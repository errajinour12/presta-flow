package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.pointage.presta.dto.request.TacheRequest;
import ma.pointage.presta.dto.response.AffectationTacheResponse;
import ma.pointage.presta.dto.response.TacheResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.mapper.AffectationTacheMapper;
import ma.pointage.presta.mapper.TacheMapper;
import ma.pointage.presta.model.AffectationTache;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.Tache;
import ma.pointage.presta.model.enums.StatutTache;
import ma.pointage.presta.repository.AffectationTacheRepository;
import ma.pointage.presta.repository.PrestataireRepository;
import ma.pointage.presta.repository.TacheRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrestataireTacheService {

    private final TacheRepository tacheRepository;
    private final PrestataireRepository prestataireRepository;
    private final AffectationTacheRepository affectationTacheRepository;

    /**
     * Récupère le prestataire connecté à partir du SecurityContext.
     */
    private Prestataire getPrestataireConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return prestataireRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire introuvable avec l'email : " + email));
    }

    /**
     * Permet à un prestataire de créer une nouvelle tâche.
     * La tâche lui sera automatiquement affectée.
     */
    @Transactional
    public TacheResponse creerTache(TacheRequest request) {
        log.info("Tentative de création d'une tâche par le prestataire (nom de tâche={})", request.getNom());

        // Récupération du prestataire connecté
        Prestataire prestataire = getPrestataireConnecte();

        // Vérification de l'unicité globale du nom de la tâche
        if (tacheRepository.existsByNom(request.getNom())) {
            log.error("Une tâche avec le nom '{}' existe déjà.", request.getNom());
            throw new BusinessException("Une tâche avec ce nom existe déjà dans le catalogue global.");
        }

        // Création de la tâche (createdBy = prestataire)
        Tache tache = TacheMapper.toEntity(request, prestataire);
        tache = tacheRepository.save(tache);

        // Création automatique de l'affectation
        AffectationTache affectation = AffectationTache.builder()
                .tache(tache)
                .prestataire(prestataire)
                .build();
        affectationTacheRepository.save(affectation);

        log.info("Tâche '{}' créée et affectée automatiquement au prestataire {}", tache.getNom(), prestataire.getEmail());

        return TacheMapper.toResponse(tache);
    }

    /**
     * Récupère les tâches affectées au prestataire connecté.
     */
    @Transactional(readOnly = true)
    public List<AffectationTacheResponse> getMesTaches() {
        Prestataire prestataire = getPrestataireConnecte();
        return affectationTacheRepository.findByPrestataireId(prestataire.getId())
                .stream()
                .map(AffectationTacheMapper::toResponse)
                .toList();
    }

    /**
     * Démarre une tâche affectée.
     */
    @Transactional
    public AffectationTacheResponse demarrerTache(Long affectationId) {
        Prestataire prestataire = getPrestataireConnecte();
        AffectationTache affectation = affectationTacheRepository.findById(affectationId)
                .orElseThrow(() -> new ResourceNotFoundException("AffectationTache", affectationId));

        // Vérification stricte que le prestataire connecté possède bien l'affectation
        if (!affectation.getPrestataire().getId().equals(prestataire.getId())) {
            throw new BusinessException("Vous n'êtes pas autorisé à démarrer cette tâche car elle ne vous est pas affectée.");
        }

        if (affectation.getStatut() != StatutTache.NON_DEMARREE) {
            throw new BusinessException("La tâche ne peut pas être démarrée car son statut actuel est : " + affectation.getStatut());
        }

        affectation.setStatut(StatutTache.EN_COURS);
        affectation.setDateDebut(LocalDateTime.now());

        AffectationTache saved = affectationTacheRepository.save(affectation);
        return AffectationTacheMapper.toResponse(saved);
    }

    /**
     * Termine une tâche affectée.
     */
    @Transactional
    public AffectationTacheResponse terminerTache(Long affectationId) {
        Prestataire prestataire = getPrestataireConnecte();
        AffectationTache affectation = affectationTacheRepository.findById(affectationId)
                .orElseThrow(() -> new ResourceNotFoundException("AffectationTache", affectationId));

        // Vérification stricte que le prestataire connecté possède bien l'affectation
        if (!affectation.getPrestataire().getId().equals(prestataire.getId())) {
            throw new BusinessException("Vous n'êtes pas autorisé à terminer cette tâche car elle ne vous est pas affectée.");
        }

        if (affectation.getStatut() != StatutTache.EN_COURS) {
            throw new BusinessException("La tâche ne peut pas être terminée car son statut actuel est : " + affectation.getStatut());
        }

        affectation.setStatut(StatutTache.TERMINEE);
        affectation.setDateFin(LocalDateTime.now());

        AffectationTache saved = affectationTacheRepository.save(affectation);
        return AffectationTacheMapper.toResponse(saved);
    }
}

