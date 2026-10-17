package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.response.DailyAttendanceSummaryResponse;
import ma.pointage.presta.dto.response.PendingSubmissionResponse;
import ma.pointage.presta.dto.response.PointageResponse;
import ma.pointage.presta.dto.response.ProcessedSubmissionResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.mapper.PointageMapper;
import ma.pointage.presta.model.Admin;
import ma.pointage.presta.model.ImagePointage;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.Utilisateur;
import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;
import ma.pointage.presta.repository.ImagePointageRepository;
import ma.pointage.presta.repository.PointageRepository;
import ma.pointage.presta.repository.UtilisateurRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAttendanceValidationService {

    private final PointageRepository pointageRepository;
    private final ImagePointageRepository imagePointageRepository;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * Retrieve all attendance submissions currently pending validation (StatutPointage.EN_ATTENTE).
     */
    @Transactional(readOnly = true)
    public List<PendingSubmissionResponse> getPendingSubmissions() {
        List<ImagePointage> pendingImages = pointageRepository.findDistinctImagePointageByStatut(StatutPointage.EN_ATTENTE);
        List<PendingSubmissionResponse> responses = new ArrayList<>();

        for (ImagePointage image : pendingImages) {
            List<Pointage> imagePointages = pointageRepository.findByImagePointageId(image.getId());

            // Filter for EN_ATTENTE pointages to extract date range and counts
            List<Pointage> pendingPointages = imagePointages.stream()
                    .filter(p -> p.getStatut() == StatutPointage.EN_ATTENTE)
                    .toList();

            LocalDate minDate = pendingPointages.stream()
                    .map(Pointage::getDate)
                    .min(LocalDate::compareTo)
                    .orElse(null);

            LocalDate maxDate = pendingPointages.stream()
                    .map(Pointage::getDate)
                    .max(LocalDate::compareTo)
                    .orElse(null);

            int nombreJours = (int) pendingPointages.stream()
                    .map(Pointage::getDate)
                    .distinct()
                    .count();

            responses.add(PendingSubmissionResponse.builder()
                    .imageId(image.getId())
                    .alfrescoNodeId(image.getAlfrescoNodeId())
                    .nomOriginal(image.getNomOriginal())
                    .mimeType(image.getMimeType())
                    .prestataireId(image.getPrestataire() != null ? image.getPrestataire().getId() : null)
                    .prestataireNomComplet(image.getPrestataire() != null ? image.getPrestataire().getNomComplet() : null)
                    .prestataireMatricule(image.getPrestataire() != null ? image.getPrestataire().getMatricule() : null)
                    .dateDebut(minDate)
                    .dateFin(maxDate)
                    .nombreJours(nombreJours)
                    .nombrePointages(pendingPointages.size())
                    .createdAt(image.getCreatedAt())
                    .build());
        }

        responses.sort(Comparator.comparing(PendingSubmissionResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return responses;
    }

    /**
     * Retrieve all attendance submissions that have been fully processed (no active EN_ATTENTE pointages).
     */
    @Transactional(readOnly = true)
    public List<ProcessedSubmissionResponse> getProcessedSubmissions() {
        List<ImagePointage> allImages = imagePointageRepository.findAllByOrderByCreatedAtDesc();
        List<ProcessedSubmissionResponse> responses = new ArrayList<>();

        for (ImagePointage image : allImages) {
            List<Pointage> imagePointages = pointageRepository.findByImagePointageId(image.getId());
            if (imagePointages.isEmpty()) continue;

            // Group by date to determine active pointages (CORRIGEE ?? BRUT)
            Map<LocalDate, List<Pointage>> byDate = imagePointages.stream()
                    .collect(Collectors.groupingBy(Pointage::getDate));

            List<Pointage> activePointages = new ArrayList<>();
            for (List<Pointage> dayPointages : byDate.values()) {
                Pointage active = dayPointages.stream()
                        .filter(p -> p.getOrigineDonnees() == OrigineDonnees.CORRIGEE)
                        .findFirst()
                        .orElseGet(() -> dayPointages.stream()
                                .filter(p -> p.getOrigineDonnees() == OrigineDonnees.BRUT)
                                .findFirst()
                                .orElse(null));

                if (active != null) {
                    activePointages.add(active);
                }
            }

            if (activePointages.isEmpty()) continue;

            // Check if there are any active EN_ATTENTE pointages remaining
            boolean hasPending = activePointages.stream().anyMatch(p -> p.getStatut() == StatutPointage.EN_ATTENTE);

            // History only contains submissions with NO remaining active EN_ATTENTE pointages
            if (hasPending) continue;

            // Determine global status (VALIDE, REJETE, or PARTIEL)
            boolean hasValide = activePointages.stream().anyMatch(p -> p.getStatut() == StatutPointage.VALIDE);
            boolean hasRejete = activePointages.stream().anyMatch(p -> p.getStatut() == StatutPointage.REJETE);

            String statutGlobal;
            if (hasValide && hasRejete) {
                statutGlobal = "PARTIEL";
            } else if (hasRejete) {
                statutGlobal = "REJETE";
            } else {
                statutGlobal = "VALIDE";
            }

            LocalDate minDate = activePointages.stream()
                    .map(Pointage::getDate)
                    .min(LocalDate::compareTo)
                    .orElse(null);

            LocalDate maxDate = activePointages.stream()
                    .map(Pointage::getDate)
                    .max(LocalDate::compareTo)
                    .orElse(null);

            // Date of latest treatment & admin decision
            Pointage latestProcessedPointage = activePointages.stream()
                    .filter(p -> p.getUpdatedAt() != null)
                    .max(Comparator.comparing(Pointage::getUpdatedAt))
                    .orElse(null);

            java.time.LocalDateTime dateTraitement = latestProcessedPointage != null ? latestProcessedPointage.getUpdatedAt() : null;
            String traiteParAdminNom = (latestProcessedPointage != null && latestProcessedPointage.getTraitePar() != null)
                    ? latestProcessedPointage.getTraitePar().getNomComplet()
                    : null;

            responses.add(ProcessedSubmissionResponse.builder()
                    .imageId(image.getId())
                    .alfrescoNodeId(image.getAlfrescoNodeId())
                    .nomOriginal(image.getNomOriginal())
                    .mimeType(image.getMimeType())
                    .prestataireId(image.getPrestataire() != null ? image.getPrestataire().getId() : null)
                    .prestataireNomComplet(image.getPrestataire() != null ? image.getPrestataire().getNomComplet() : null)
                    .prestataireMatricule(image.getPrestataire() != null ? image.getPrestataire().getMatricule() : null)
                    .dateDebut(minDate)
                    .dateFin(maxDate)
                    .nombreJours(activePointages.size())
                    .nombrePointages(activePointages.size())
                    .statutGlobal(statutGlobal)
                    .dateImport(image.getCreatedAt())
                    .dateTraitement(dateTraitement)
                    .traiteParAdminNom(traiteParAdminNom)
                    .build());
        }

        responses.sort(Comparator.comparing(ProcessedSubmissionResponse::getDateTraitement, Comparator.nullsLast(Comparator.reverseOrder())));
        return responses;
    }

    /**
     * View complete details for an image submission, exposing both BRUT and CORRIGEE pointages for comparison.
     */
    @Transactional(readOnly = true)
    public List<DailyAttendanceSummaryResponse> getSubmissionDetails(Long imageId) {
        ImagePointage imagePointage = imagePointageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", imageId));

        List<Pointage> pointages = pointageRepository.findByImagePointageId(imagePointage.getId());

        Map<LocalDate, List<Pointage>> byDate = pointages.stream()
                .collect(Collectors.groupingBy(Pointage::getDate));

        List<DailyAttendanceSummaryResponse> summaries = new ArrayList<>();

        for (Map.Entry<LocalDate, List<Pointage>> entry : byDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<Pointage> dayPointages = entry.getValue();

            Pointage brut = dayPointages.stream()
                    .filter(p -> p.getOrigineDonnees() == OrigineDonnees.BRUT)
                    .findFirst()
                    .orElse(null);

            Pointage corrigee = dayPointages.stream()
                    .filter(p -> p.getOrigineDonnees() == OrigineDonnees.CORRIGEE)
                    .findFirst()
                    .orElse(null);

            summaries.add(DailyAttendanceSummaryResponse.builder()
                    .date(date)
                    .hasCorrection(corrigee != null)
                    .brutPointage(PointageMapper.toPointageResponse(brut))
                    .corrigeePointage(PointageMapper.toPointageResponse(corrigee))
                    .build());
        }

        summaries.sort(Comparator.comparing(DailyAttendanceSummaryResponse::getDate));
        return summaries;
    }

    /**
     * Validate a single pending (EN_ATTENTE) pointage for a specific day.
     */
    @Transactional
    public PointageResponse validatePointage(Long pointageId) {
        Admin admin = getAdminConnecte();

        Pointage pointage = pointageRepository.findById(pointageId)
                .orElseThrow(() -> new ResourceNotFoundException("Pointage", pointageId));

        if (pointage.getStatut() != StatutPointage.EN_ATTENTE) {
            throw new BusinessException("Seuls les pointages en attente de validation peuvent être validés.");
        }

        pointage.setStatut(StatutPointage.VALIDE);
        pointage.setTraitePar(admin);
        pointage.setMotifRejet(null);

        Pointage saved = pointageRepository.save(pointage);
        return PointageMapper.toPointageResponse(saved);
    }

    /**
     * Reject a single pending (EN_ATTENTE) pointage for a specific day with a required rejection reason.
     */
    @Transactional
    public PointageResponse rejectPointage(Long pointageId, String motifRejet) {
        if (motifRejet == null || motifRejet.trim().isEmpty()) {
            throw new BusinessException("Le motif de rejet est obligatoire.");
        }

        Admin admin = getAdminConnecte();

        Pointage pointage = pointageRepository.findById(pointageId)
                .orElseThrow(() -> new ResourceNotFoundException("Pointage", pointageId));

        if (pointage.getStatut() != StatutPointage.EN_ATTENTE) {
            throw new BusinessException("Seuls les pointages en attente de validation peuvent être rejetés.");
        }

        pointage.setStatut(StatutPointage.REJETE);
        pointage.setTraitePar(admin);
        pointage.setMotifRejet(motifRejet.trim());

        Pointage saved = pointageRepository.save(pointage);
        return PointageMapper.toPointageResponse(saved);
    }

    /**
     * Validate all pending (EN_ATTENTE) pointages for a submission.
     */
    @Transactional
    public List<PointageResponse> validateSubmission(Long imageId) {
        Admin admin = getAdminConnecte();

        imagePointageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", imageId));

        List<Pointage> pendingPointages = pointageRepository.findByImagePointageIdAndStatut(imageId, StatutPointage.EN_ATTENTE);

        if (pendingPointages.isEmpty()) {
            throw new BusinessException("Aucun pointage en attente de validation pour cette soumission.");
        }

        for (Pointage pointage : pendingPointages) {
            pointage.setStatut(StatutPointage.VALIDE);
            pointage.setTraitePar(admin);
            pointage.setMotifRejet(null);
        }

        List<Pointage> savedList = pointageRepository.saveAll(pendingPointages);
        return savedList.stream().map(PointageMapper::toPointageResponse).toList();
    }

    /**
     * Reject all pending (EN_ATTENTE) pointages for a submission with a required rejection reason.
     */
    @Transactional
    public List<PointageResponse> rejectSubmission(Long imageId, String motifRejet) {
        if (motifRejet == null || motifRejet.trim().isEmpty()) {
            throw new BusinessException("Le motif de rejet est obligatoire.");
        }

        Admin admin = getAdminConnecte();

        imagePointageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", imageId));

        List<Pointage> pendingPointages = pointageRepository.findByImagePointageIdAndStatut(imageId, StatutPointage.EN_ATTENTE);

        if (pendingPointages.isEmpty()) {
            throw new BusinessException("Aucun pointage en attente de validation pour cette soumission.");
        }

        for (Pointage pointage : pendingPointages) {
            pointage.setStatut(StatutPointage.REJETE);
            pointage.setTraitePar(admin);
            pointage.setMotifRejet(motifRejet.trim());
        }

        List<Pointage> savedList = pointageRepository.saveAll(pendingPointages);
        return savedList.stream().map(PointageMapper::toPointageResponse).toList();
    }

    /**
     * Retrieve authenticated Admin user from SecurityContext.
     */
    private Admin getAdminConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'email : " + email));

        if (!(user instanceof Admin admin)) {
            throw new BusinessException("L'utilisateur connecté n'a pas les privilèges Administrateur.");
        }

        return admin;
    }
}
