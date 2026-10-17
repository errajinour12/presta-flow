package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.BatchCorrectionRequest;
import ma.pointage.presta.dto.request.CreneauCorrectionRequest;
import ma.pointage.presta.dto.request.PointageCorrectionRequest;
import ma.pointage.presta.dto.response.DailyAttendanceSummaryResponse;
import ma.pointage.presta.dto.response.PointageResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.mapper.PointageMapper;
import ma.pointage.presta.model.CreneauPointage;
import ma.pointage.presta.model.ImagePointage;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;
import ma.pointage.presta.repository.ImagePointageRepository;
import ma.pointage.presta.repository.PointageRepository;
import ma.pointage.presta.repository.PrestataireRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PointageCorrectionService {

    private final PointageRepository pointageRepository;
    private final ImagePointageRepository imagePointageRepository;
    private final PrestataireRepository prestataireRepository;

    /**
     * Consult all daily pointages (BRUT + CORRIGEE summary) for an uploaded image.
     * The authenticated Prestataire can only access their own images.
     */
    @Transactional(readOnly = true)
    public List<DailyAttendanceSummaryResponse> getPointagesByImage(Long imageId) {
        Prestataire prestataire = getPrestataireConnecte();

        // Verify image existence and ownership — throws 404 if the image does not belong to this prestataire
        ImagePointage imagePointage = imagePointageRepository.findByIdAndPrestataireId(imageId, prestataire.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", imageId));

        List<Pointage> pointages = pointageRepository.findByImagePointageIdAndPrestataireId(imageId, prestataire.getId());

        // Group by LocalDate
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

            // Active pointage: CORRIGEE takes priority over BRUT
            Pointage actif = (corrigee != null) ? corrigee : brut;
            StatutPointage statutActif = actif != null ? actif.getStatut() : null;
            String motifRejet = actif != null ? actif.getMotifRejet() : null;

            summaries.add(DailyAttendanceSummaryResponse.builder()
                    .date(date)
                    .hasCorrection(corrigee != null)
                    .brutPointage(PointageMapper.toPointageResponse(brut))
                    .corrigeePointage(PointageMapper.toPointageResponse(corrigee))
                    .statutActif(statutActif)
                    .motifRejet(motifRejet)
                    .build());
        }

        // Sort summaries by date ascending
        summaries.sort(Comparator.comparing(DailyAttendanceSummaryResponse::getDate));
        return summaries;
    }

    /**
     * Create or update a single CORRIGEE pointage draft from a BRUT pointage.
     */
    @Transactional
    public PointageResponse saveOrUpdateCorrection(PointageCorrectionRequest request) {
        Prestataire prestataire = getPrestataireConnecte();

        // 1. Retrieve BRUT pointage
        Pointage brutPointage = pointageRepository.findById(request.getBrutPointageId())
                .orElseThrow(() -> new ResourceNotFoundException("Pointage", request.getBrutPointageId()));

        if (brutPointage.getOrigineDonnees() != OrigineDonnees.BRUT) {
            throw new BusinessException("L'identifiant fourni ne correspond pas à un pointage de type BRUT.");
        }

        if (!brutPointage.getPrestataire().getId().equals(prestataire.getId())) {
            throw new BusinessException("Vous n'êtes pas autorisé à modifier ce pointage.");
        }

        // Submission Lock check on BRUT pointage
        if (brutPointage.getStatut() != StatutPointage.EXTRAIT && brutPointage.getStatut() != StatutPointage.REJETE) {
            throw new BusinessException("Ce pointage a déjà été soumis et ne peut plus être modifié.");
        }

        // 2. Check if a CORRIGEE version already exists for this BRUT pointage
        Optional<Pointage> existingCorrigeeOpt = pointageRepository.findByPointageOrigineId(brutPointage.getId());

        Pointage corrigeePointage;

        if (existingCorrigeeOpt.isPresent()) {
            corrigeePointage = existingCorrigeeOpt.get();

            // Submission Lock check
            if (corrigeePointage.getStatut() != StatutPointage.EXTRAIT && corrigeePointage.getStatut() != StatutPointage.REJETE) {
                throw new BusinessException("Ce pointage a déjà été soumis et ne peut plus être modifié.");
            }

            // Update existing CORRIGEE fields
            if (request.getDayType() != null) {
                corrigeePointage.setDayType(request.getDayType());
            }

            // Replace creneaux using orphanRemoval
            corrigeePointage.getCreneaux().clear();
            if (request.getCreneaux() != null) {
                int ordreCounter = 1;
                for (CreneauCorrectionRequest cReq : request.getCreneaux()) {
                    CreneauPointage c = CreneauPointage.builder()
                            .heureEntree(cReq.getHeureEntree())
                            .heureSortie(cReq.getHeureSortie())
                            .ordre(cReq.getOrdre() != null ? cReq.getOrdre() : ordreCounter++)
                            .pointage(corrigeePointage)
                            .build();
                    corrigeePointage.getCreneaux().add(c);
                }
            }
        } else {
            // Create new CORRIGEE entity, inheriting the status from the BRUT pointage (e.g., REJETE)
            corrigeePointage = Pointage.builder()
                    .date(brutPointage.getDate())
                    .statut(brutPointage.getStatut())
                    .origineDonnees(OrigineDonnees.CORRIGEE)
                    .pointageOrigine(brutPointage)
                    .dayType(request.getDayType() != null ? request.getDayType() : brutPointage.getDayType())
                    .prestataire(prestataire)
                    .imagePointage(brutPointage.getImagePointage())
                    .creneaux(new ArrayList<>())
                    .build();

            if (request.getCreneaux() != null) {
                int ordreCounter = 1;
                for (CreneauCorrectionRequest cReq : request.getCreneaux()) {
                    CreneauPointage c = CreneauPointage.builder()
                            .heureEntree(cReq.getHeureEntree())
                            .heureSortie(cReq.getHeureSortie())
                            .ordre(cReq.getOrdre() != null ? cReq.getOrdre() : ordreCounter++)
                            .pointage(corrigeePointage)
                            .build();
                    corrigeePointage.getCreneaux().add(c);
                }
            }
        }

        Pointage saved = pointageRepository.save(corrigeePointage);
        return PointageMapper.toPointageResponse(saved);
    }

    /**
     * Resoumet un pointage de type CORRIGEE ayant le statut REJETE.
     * Fait passer uniquement cette version CORRIGEE au statut EN_ATTENTE.
     * Le pointage BRUT d'origine demeure inchangé.
     */
    @Transactional
    public PointageResponse resubmitSinglePointage(Long pointageId) {
        Prestataire prestataire = getPrestataireConnecte();

        Pointage pointage = pointageRepository.findById(pointageId)
                .orElseThrow(() -> new ResourceNotFoundException("Pointage", pointageId));

        if (!pointage.getPrestataire().getId().equals(prestataire.getId())) {
            throw new BusinessException("Vous n'êtes pas autorisé à resoumettre ce pointage.");
        }

        if (pointage.getOrigineDonnees() != OrigineDonnees.CORRIGEE) {
            throw new BusinessException("Seule une version corrigée d'un pointage peut être resoumise.");
        }

        if (pointage.getStatut() != StatutPointage.REJETE) {
            throw new BusinessException("Seul un pointage au statut REJETE peut être resoumis.");
        }

        pointage.setStatut(StatutPointage.EN_ATTENTE);
        Pointage saved = pointageRepository.save(pointage);
        return PointageMapper.toPointageResponse(saved);
    }

    /**
     * Create or update multiple CORRIGEE pointages in batch for an image.
     */
    @Transactional
    public List<PointageResponse> saveOrUpdateBatchCorrections(Long imageId, BatchCorrectionRequest batchRequest) {
        Prestataire prestataire = getPrestataireConnecte();

        // Verify image ownership
        imagePointageRepository.findByIdAndPrestataireId(imageId, prestataire.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", imageId));

        List<PointageResponse> responses = new ArrayList<>();
        for (PointageCorrectionRequest req : batchRequest.getCorrections()) {
            responses.add(saveOrUpdateCorrection(req));
        }

        return responses;
    }

    /**
     * Soumet tous les pointages associés à une image (transitionne le statut à EN_ATTENTE).
     * Si une version CORRIGEE existe pour un pointage BRUT, seule la version CORRIGEE est soumise.
     * Si aucune version CORRIGEE n'existe pour un pointage BRUT, le pointage BRUT lui-même est soumis.
     */
    @Transactional
    public List<PointageResponse> submitCorrectionsForImage(Long imageId) {
        Prestataire prestataire = getPrestataireConnecte();

        // Verify image ownership
        ImagePointage imagePointage = imagePointageRepository.findByIdAndPrestataireId(imageId, prestataire.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ImagePointage", imageId));

        List<Pointage> pointages = pointageRepository.findByImagePointageIdAndPrestataireId(imageId, prestataire.getId());

        List<Pointage> brutPointages = pointages.stream()
                .filter(p -> p.getOrigineDonnees() == OrigineDonnees.BRUT)
                .toList();

        Map<Long, Pointage> corrigeeMap = pointages.stream()
                .filter(p -> p.getOrigineDonnees() == OrigineDonnees.CORRIGEE && p.getPointageOrigine() != null)
                .collect(Collectors.toMap(
                        p -> p.getPointageOrigine().getId(),
                        p -> p,
                        (existing, replacement) -> existing
                ));

        List<Pointage> toSubmit = new ArrayList<>();

        for (Pointage brut : brutPointages) {
            Pointage corrigee = corrigeeMap.get(brut.getId());

            if (corrigee != null) {
                // If a CORRIGEE exists, submit ONLY the CORRIGEE pointage
                if (corrigee.getStatut() == StatutPointage.EXTRAIT || corrigee.getStatut() == StatutPointage.REJETE) {
                    corrigee.setStatut(StatutPointage.EN_ATTENTE);
                }
                toSubmit.add(corrigee);
            } else {
                // If no CORRIGEE exists for this BRUT pointage, submit the existing BRUT pointage directly
                if (brut.getStatut() == StatutPointage.EXTRAIT || brut.getStatut() == StatutPointage.REJETE) {
                    brut.setStatut(StatutPointage.EN_ATTENTE);
                }
                toSubmit.add(brut);
            }
        }

        List<Pointage> savedList = pointageRepository.saveAll(toSubmit);
        return savedList.stream().map(PointageMapper::toPointageResponse).toList();
    }

    /**
     * Retrieve authenticated Prestataire from SecurityContext.
     */
    private Prestataire getPrestataireConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return prestataireRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire introuvable avec l'email : " + email));
    }
}
