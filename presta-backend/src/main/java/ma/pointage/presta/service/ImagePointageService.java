package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.config.AlfrescoConstants;
import ma.pointage.presta.config.AlfrescoProperties;
import ma.pointage.presta.dto.response.ImageDownloadPayload;
import ma.pointage.presta.dto.response.ImagePointageResponse;
import ma.pointage.presta.dto.response.ImageUploadWithExtractionResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.mapper.ImagePointageMapper;
import ma.pointage.presta.model.ImagePointage;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;
import ma.pointage.presta.repository.ImagePointageRepository;
import ma.pointage.presta.repository.PointageRepository;
import ma.pointage.presta.repository.PrestataireRepository;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import ma.pointage.presta.mapper.ImagePointageMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImagePointageService {

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "application/pdf"
    );

    private final ImagePointageRepository imagePointageRepository;
    private final AttendancePersistenceService attendancePersistenceService;
    private final PrestataireRepository prestataireRepository;
    private final AlfrescoProperties alfrescoProperties;
    private final WebClient alfrescoWebClient;
    private final GeminiService geminiService;
    private final PointageRepository pointageRepository;

    /**
     * Upload d'une image de pointage vers Alfresco et enregistrement en base de données.
     */
    @Transactional
    public ma.pointage.presta.dto.response.ImageUploadWithExtractionResponse uploadImage(MultipartFile file) {
        // Validate file
        validateFile(file);

        // Retrieve the authenticated prestataire
        Prestataire prestataire = getPrestataireConnecte();

        // 1. Build multipart body for Alfresco upload
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        String contentType = file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        builder.part("filedata", file.getResource())
                .filename(file.getOriginalFilename())
                .contentType(MediaType.parseMediaType(contentType));
        builder.part("autoRename", "true");
        MultiValueMap<String, HttpEntity<?>> multipartBody = builder.build();

        // 2. Call Alfresco REST API to store the file
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

        // 3. Persist image metadata locally
        ImagePointage imagePointage = ImagePointage.builder()
                .alfrescoNodeId(alfrescoNodeId)
                .nomOriginal(file.getOriginalFilename())
                .mimeType(contentType)
                .prestataire(prestataire)
                .build();
        ImagePointage saved = imagePointageRepository.save(imagePointage);

        // 4. Retrieve the stored file as a Resource for Gemini processing
        Resource resource = downloadFromAlfresco(saved.getAlfrescoNodeId());

        // 5. Call Gemini to extract attendance data
        ma.pointage.presta.dto.gemini.AttendanceExtractionDTO extraction = geminiService.extractAttendance(resource, saved.getMimeType());

        // Persist the extracted attendance data
        attendancePersistenceService.persistExtraction(extraction, saved, prestataire);

        // 6. Build combined response DTO
        ma.pointage.presta.dto.response.ImagePointageResponse imgResp = ImagePointageMapper.toResponse(saved);
        return ma.pointage.presta.dto.response.ImageUploadWithExtractionResponse.builder()
                .image(imgResp)
                .extraction(extraction)
                .build();
    }

    /**
     * Récupère la ressource Alfresco associée à un node ID.
     */
    public Resource getResourceByNodeId(String nodeId) {
        return downloadFromAlfresco(nodeId);
    }

    /**
     * Récupère l'historique des images importées par le prestataire connecté,
     * enrichi avec le statut global calculé et le nombre de journées distinctes.
     */
    @Transactional(readOnly = true)
    public List<ImagePointageResponse> getMesImages() {
        Prestataire prestataire = getPrestataireConnecte();

        List<ImagePointage> images = imagePointageRepository
                .findByPrestataireIdOrderByCreatedAtDesc(prestataire.getId());

        return images.stream()
                .map(image -> {
                    // Security: load only pointages that belong to this prestataire
                    List<Pointage> pointages = pointageRepository
                            .findByImagePointageIdAndPrestataireId(image.getId(), prestataire.getId());

                    // Determine the active pointage per day (CORRIGEE takes priority over BRUT)
                    Map<LocalDate, Pointage> activeByDate = new java.util.LinkedHashMap<>();
                    // First pass: collect BRUT
                    for (Pointage p : pointages) {
                        if (p.getOrigineDonnees() == OrigineDonnees.BRUT) {
                            activeByDate.put(p.getDate(), p);
                        }
                    }
                    // Second pass: override with CORRIGEE where available
                    for (Pointage p : pointages) {
                        if (p.getOrigineDonnees() == OrigineDonnees.CORRIGEE) {
                            activeByDate.put(p.getDate(), p);
                        }
                    }

                    int nombreJours = activeByDate.size();
                    String statutGlobal = computeStatutGlobal(activeByDate.values());

                    return ImagePointageMapper.toResponse(image, statutGlobal, nombreJours);
                })
                .toList();
    }

    /**
     * Récupère toutes les images importées par tous les prestataires (pour l'admin).
     */
    @Transactional(readOnly = true)
    public List<ImagePointageResponse> getAllImages() {
        return imagePointageRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ImagePointageMapper::toResponse)
                .toList();
    }

    /**
     * Téléchargement d'une image par un prestataire (propriétaire de l'image).
     */
    @Transactional(readOnly = true)
    public ImageDownloadPayload downloadImageContent(Long id) {
        Prestataire prestataire = getPrestataireConnecte();

        ImagePointage image = imagePointageRepository.findByIdAndPrestataireId(id, prestataire.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", id));

        Resource resource = downloadFromAlfresco(image.getAlfrescoNodeId());

        return ImageDownloadPayload.builder()
                .resource(resource)
                .nomOriginal(image.getNomOriginal())
                .mimeType(image.getMimeType())
                .build();
    }

    /**
     * Téléchargement d'une image par un administrateur.
     */
    @Transactional(readOnly = true)
    public ImageDownloadPayload downloadImageContentForAdmin(Long id) {
        ImagePointage image = imagePointageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", id));

        Resource resource = downloadFromAlfresco(image.getAlfrescoNodeId());

        return ImageDownloadPayload.builder()
                .resource(resource)
                .nomOriginal(image.getNomOriginal())
                .mimeType(image.getMimeType())
                .build();
    }

    /**
     * Récupère la ressource binaire depuis Alfresco.
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
                    "Erreur Alfresco lors du telechargement (HTTP " + e.getStatusCode().value() + ") : " + e.getResponseBodyAsString()
            );
        }
    }

    /**
     * Validation stricte du fichier téléversé.
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Veuillez sélectionner un fichier non vide.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException("La taille du fichier dépasse la limite autorisée (10 Mo).");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("Format de fichier non autorisé. Formats acceptés : JPEG, PNG, WEBP, PDF.");
        }
    }

    /**
     * Recupere le Prestataire connecte par son email depuis le SecurityContext,
     * selon la convention etablie dans PrestataireTacheService.
     */
    private Prestataire getPrestataireConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return prestataireRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire introuvable avec l'email : " + email));
    }

    /**
     * Calcule le statut global d'une image à partir des statuts des pointages actifs.
     * Priorité : REJETE > EN_ATTENTE > VALIDE > EXTRAIT > EN_COURS.
     */
    private String computeStatutGlobal(java.util.Collection<Pointage> activePointages) {
        if (activePointages.isEmpty()) {
            return "EXTRAIT";
        }

        boolean hasRejete = false;
        boolean hasEnAttente = false;
        boolean hasValide = false;
        boolean hasExtrait = false;

        for (Pointage p : activePointages) {
            StatutPointage s = p.getStatut();
            if (s == StatutPointage.REJETE) hasRejete = true;
            else if (s == StatutPointage.EN_ATTENTE) hasEnAttente = true;
            else if (s == StatutPointage.VALIDE) hasValide = true;
            else if (s == StatutPointage.EXTRAIT) hasExtrait = true;
        }

        if (hasRejete) return "REJETE";
        if (hasEnAttente) return "EN_ATTENTE";
        if (hasValide && !hasExtrait) return "VALIDE";
        if (hasExtrait && !hasValide) return "EXTRAIT";
        return "EN_COURS";
    }
}

