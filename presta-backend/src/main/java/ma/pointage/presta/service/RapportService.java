package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.pointage.presta.config.AlfrescoConstants;
import ma.pointage.presta.config.AlfrescoProperties;
import ma.pointage.presta.dto.report.ReportDataDTO;
import ma.pointage.presta.dto.request.ReportGenerationRequest;
import ma.pointage.presta.dto.response.RapportResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.model.CreneauPointage;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.Rapport;
import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;
import ma.pointage.presta.repository.PointageRepository;
import ma.pointage.presta.repository.PrestataireRepository;
import ma.pointage.presta.repository.RapportRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RapportService {

    private final PointageRepository pointageRepository;
    private final PrestataireRepository prestataireRepository;
    private final RapportRepository rapportRepository;
    private final PdfReportGeneratorService pdfReportGeneratorService;

    private final WebClient alfrescoWebClient;
    private final AlfrescoProperties alfrescoProperties;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final Locale FRENCH_LOCALE = Locale.FRENCH;

    /**
     * Génère un rapport d'assiduité au format PDF, téléverse le document sur Alfresco,
     * enregistre la métadonnée dans MySQL, et retourne le contenu binaire du PDF.
     */
    @Transactional
    public byte[] generateAndSaveReport(ReportGenerationRequest request) {
        Prestataire prestataire = getPrestataireConnecte();

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        if (startDate.isAfter(endDate)) {
            throw new BusinessException("La date de début doit être antérieure ou égale à la date de fin.");
        }

        // 1. Fetch all pointages for the prestataire within the date range
        List<Pointage> rawPointages = pointageRepository
                .findByPrestataireIdAndDateBetweenWithCreneaux(prestataire.getId(), startDate, endDate);

        // 2. Resolve active pointages per date (CORRIGEE priority over BRUT)
        Map<LocalDate, Pointage> activePointagesByDate = resolveActivePointages(rawPointages);

        if (activePointagesByDate.isEmpty()) {
            throw new BusinessException("Aucune donnée de pointage disponible pour la période sélectionnée.");
        }

        // 3. Verify definitive processing rule (All active pointages must be VALIDE or REJETE)
        boolean hasUnprocessed = activePointagesByDate.values().stream()
                .anyMatch(p -> p.getStatut() == StatutPointage.EXTRAIT || p.getStatut() == StatutPointage.EN_ATTENTE);

        if (hasUnprocessed) {
            throw new BusinessException("Le rapport ne peut pas être généré car la période sélectionnée contient des pointages non encore traités définitivement.");
        }

        // 4. Compute metrics and construct ReportDataDTO
        ReportDataDTO reportData = buildReportData(prestataire, startDate, endDate, activePointagesByDate);

        // 5. Generate PDF byte array using iText 7.2.5
        byte[] pdfBytes = pdfReportGeneratorService.generatePdfReport(reportData);

        // 6. Upload PDF file to Alfresco using existing WebClient configuration
        String filename = String.format("Rapport_Assiduite_%s_%s_%s.pdf",
                sanitizeFilename(prestataire.getNomComplet()),
                startDate,
                endDate);

        String alfrescoNodeId = uploadPdfToAlfresco(pdfBytes, filename);

        // 7. Save metadata in MySQL (with orphan cleanup fallback)
        try {
            Rapport rapport = Rapport.builder()
                    .nom(filename)
                    .dateDebut(startDate)
                    .dateFin(endDate)
                    .alfrescoNodeId(alfrescoNodeId)
                    .prestataire(prestataire)
                    .build();
            rapportRepository.save(rapport);
        } catch (Exception e) {
            log.error("Échec de la sauvegarde MySQL pour le rapport. Suppression du fichier orphelin sur Alfresco (nodeId: {})", alfrescoNodeId, e);
            deleteFromAlfrescoQuietly(alfrescoNodeId);
            throw new BusinessException("Erreur lors de l'enregistrement du rapport en base de données : " + e.getMessage());
        }

        return pdfBytes;
    }

    /**
     * Récupère la liste de tous les rapports générés pour le prestataire connecté.
     */
    @Transactional(readOnly = true)
    public List<RapportResponse> getMesRapports() {
        Prestataire prestataire = getPrestataireConnecte();
        List<Rapport> rapports = rapportRepository.findByPrestataireIdOrderByCreatedAtDesc(prestataire.getId());

        return rapports.stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Télécharge la ressource binaire PDF d'un rapport existant depuis Alfresco
     * en utilisant directement findByIdAndPrestataireId pour la sécurité.
     */
    @Transactional(readOnly = true)
    public Resource downloadReportContent(Long id) {
        Prestataire prestataire = getPrestataireConnecte();
        Rapport rapport = rapportRepository.findByIdAndPrestataireId(id, prestataire.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Rapport non trouvé avec l'identifiant : " + id));

        return downloadFromAlfresco(rapport.getAlfrescoNodeId());
    }

    /**
     * Récupère la liste de tous les rapports générés pour tous les prestataires (pour l'administrateur).
     */
    @Transactional(readOnly = true)
    public List<RapportResponse> getAllRapportsForAdmin() {
        List<Rapport> rapports = rapportRepository.findAllByOrderByCreatedAtDesc();

        return rapports.stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Télécharge la ressource binaire PDF d'un rapport existant depuis Alfresco (pour l'administrateur).
     */
    @Transactional(readOnly = true)
    public Resource downloadReportContentForAdmin(Long id) {
        Rapport rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rapport non trouvé avec l'identifiant : " + id));

        return downloadFromAlfresco(rapport.getAlfrescoNodeId());
    }

    /**
     * Regroupe les pointages par date et donne la priorité à CORRIGEE sur BRUT.
     */
    private Map<LocalDate, Pointage> resolveActivePointages(List<Pointage> rawPointages) {
        Map<LocalDate, Pointage> activeMap = new TreeMap<>();
        // First pass: set BRUT
        for (Pointage p : rawPointages) {
            if (p.getOrigineDonnees() == OrigineDonnees.BRUT) {
                activeMap.put(p.getDate(), p);
            }
        }
        // Second pass: override with CORRIGEE
        for (Pointage p : rawPointages) {
            if (p.getOrigineDonnees() == OrigineDonnees.CORRIGEE) {
                activeMap.put(p.getDate(), p);
            }
        }
        return activeMap;
    }

    /**
     * Calcule les métriques et structure les éléments du rapport.
     * Les jours REJETE ne sont PAS inclus dans les dailyItems du PDF.
     */
    private ReportDataDTO buildReportData(Prestataire prestataire, LocalDate startDate, LocalDate endDate, Map<LocalDate, Pointage> activeMap) {
        int totalDays = activeMap.size();
        int presentDays = 0;
        int absentDays = 0;
        int leaveDays = 0;
        double totalWorkedHours = 0.0;

        List<ReportDataDTO.DailyAttendanceItem> dailyItems = new ArrayList<>();

        for (Map.Entry<LocalDate, Pointage> entry : activeMap.entrySet()) {
            LocalDate date = entry.getKey();
            Pointage pointage = entry.getValue();

            StatutPointage statut = pointage.getStatut();
            // Exclude REJETE pointages from the daily table items in PDF
            if (statut == StatutPointage.REJETE) {
                continue;
            }

            String dayOfWeek = capitalize(date.getDayOfWeek().getDisplayName(TextStyle.FULL, FRENCH_LOCALE));
            String dayType = pointage.getDayType();

            double dailyDuration = 0.0;
            List<String> timeSlots = new ArrayList<>();

            if (pointage.getCreneaux() != null && !pointage.getCreneaux().isEmpty()) {
                for (CreneauPointage cp : pointage.getCreneaux()) {
                    if (cp.getHeureEntree() != null && cp.getHeureSortie() != null) {
                        timeSlots.add(cp.getHeureEntree().format(TIME_FORMATTER) + " - " + cp.getHeureSortie().format(TIME_FORMATTER));
                    }
                }
            }

            if (statut == StatutPointage.VALIDE) {
                String normalizedType = dayType != null ? dayType.trim().toUpperCase() : "";

                if (normalizedType.contains("PRESEN") || normalizedType.contains("PRES") || (!timeSlots.isEmpty() && !normalizedType.contains("ABSEN") && !normalizedType.contains("CONG"))) {
                    presentDays++;
                    if (pointage.getCreneaux() != null) {
                        for (CreneauPointage cp : pointage.getCreneaux()) {
                            if (cp.getHeureEntree() != null && cp.getHeureSortie() != null) {
                                Duration duration = Duration.between(cp.getHeureEntree(), cp.getHeureSortie());
                                dailyDuration += duration.toMinutes() / 60.0;
                            }
                        }
                    }
                    totalWorkedHours += dailyDuration;
                } else if (normalizedType.contains("ABSEN")) {
                    absentDays++;
                } else if (normalizedType.contains("CONG") || normalizedType.contains("LEAVE")) {
                    leaveDays++;
                }
            }

            dailyItems.add(ReportDataDTO.DailyAttendanceItem.builder()
                    .date(date)
                    .dayOfWeek(dayOfWeek)
                    .dayType(dayType != null ? dayType : "VALIDE")
                    .statut(statut.name())
                    .timeSlots(timeSlots)
                    .dailyDurationHours(dailyDuration)
                    .dailyDurationFormatted(formatHours(dailyDuration))
                    .build());
        }

        double attendanceRate = totalDays > 0 ? (presentDays / (double) totalDays) * 100.0 : 0.0;

        ReportDataDTO.SummaryMetrics metrics = ReportDataDTO.SummaryMetrics.builder()
                .totalDays(totalDays)
                .presentDays(presentDays)
                .absentDays(absentDays)
                .leaveDays(leaveDays)
                .totalWorkedHours(totalWorkedHours)
                .totalWorkedHoursFormatted(formatHours(totalWorkedHours))
                .attendanceRate(attendanceRate)
                .attendanceRateFormatted(String.format(Locale.US, "%.1f%%", attendanceRate))
                .build();

        return ReportDataDTO.builder()
                .prestataireNomComplet(prestataire.getNomComplet())
                .prestataireEmail(prestataire.getEmail())
                .prestataireMatricule(prestataire.getMatricule())
                .startDate(startDate)
                .endDate(endDate)
                .generatedAt(LocalDate.now())
                .summaryMetrics(metrics)
                .dailyItems(dailyItems)
                .build();
    }

    /**
     * Uploads the PDF byte array to Alfresco using the existing WebClient configuration.
     */
    private String uploadPdfToAlfresco(byte[] pdfBytes, String filename) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();

        ByteArrayResource resource = new ByteArrayResource(pdfBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        builder.part("filedata", resource)
                .filename(filename)
                .contentType(MediaType.APPLICATION_PDF);
        builder.part("autoRename", "true");

        MultiValueMap<String, HttpEntity<?>> multipartBody = builder.build();

        String uploadUrl = String.format(AlfrescoConstants.API_UPLOAD, alfrescoProperties.getFolder().getNodeId());

        Map<?, ?> response;
        try {
            response = alfrescoWebClient.post()
                    .uri(uploadUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .bodyValue(multipartBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (WebClientResponseException e) {
            throw new BusinessException(
                    "Erreur Alfresco lors de l'upload (HTTP " + e.getStatusCode().value() + ") : " + e.getResponseBodyAsString()
            );
        }

        if (response == null || !response.containsKey("entry")) {
            throw new BusinessException("Réponse invalide reçue de la part d'Alfresco.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> entry = (Map<String, Object>) response.get("entry");
        String alfrescoNodeId = (String) entry.get("id");

        if (alfrescoNodeId == null || alfrescoNodeId.isBlank()) {
            throw new BusinessException("Impossible de récupérer l'identifiant du nœud Alfresco.");
        }

        return alfrescoNodeId;
    }

    /**
     * Downloads PDF binary stream from Alfresco.
     */
    private Resource downloadFromAlfresco(String nodeId) {
        String downloadUrl = String.format(AlfrescoConstants.API_DOWNLOAD, nodeId);

        try {
            return alfrescoWebClient.get()
                    .uri(downloadUrl)
                    .retrieve()
                    .bodyToMono(Resource.class)
                    .block();
        } catch (WebClientResponseException e) {
            throw new BusinessException(
                    "Erreur Alfresco lors du téléchargement (HTTP " + e.getStatusCode().value() + ") : " + e.getResponseBodyAsString()
            );
        }
    }

    /**
     * Supprime silencieusement un fichier sur Alfresco en cas d'erreur de sauvegarde MySQL.
     */
    private void deleteFromAlfrescoQuietly(String nodeId) {
        if (nodeId == null || nodeId.isBlank()) return;
        String deleteUrl = String.format(AlfrescoConstants.API_NODE, nodeId);

        try {
            alfrescoWebClient.delete()
                    .uri(deleteUrl)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Fichier orphelin supprimé d'Alfresco avec succès (nodeId: {})", nodeId);
        } catch (Exception e) {
            log.warn("Impossible de supprimer le nœud orphelin Alfresco (nodeId: {}) : {}", nodeId, e.getMessage());
        }
    }

    private Prestataire getPrestataireConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return prestataireRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire non trouvé avec l'email : " + email));
    }

    private RapportResponse toResponse(Rapport rapport) {
        return RapportResponse.builder()
                .id(rapport.getId())
                .nom(rapport.getNom())
                .dateDebut(rapport.getDateDebut())
                .dateFin(rapport.getDateFin())
                .prestataireId(rapport.getPrestataire().getId())
                .prestataireNomComplet(rapport.getPrestataire().getNomComplet())
                .createdAt(rapport.getCreatedAt())
                .build();
    }

    private String formatHours(double hours) {
        int h = (int) hours;
        int m = (int) Math.round((hours - h) * 60);
        return String.format("%02dh%02d", h, m);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    private String sanitizeFilename(String name) {
        if (name == null) return "Prestataire";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
