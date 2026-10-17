package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.pointage.presta.dto.request.AffectationBatchRequest;
import ma.pointage.presta.dto.request.AffectationTacheRequest;
import ma.pointage.presta.dto.response.AffectationBatchResponse;
import ma.pointage.presta.dto.response.AffectationFailureDetail;
import ma.pointage.presta.dto.response.AffectationTacheResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.mapper.AffectationTacheMapper;
import ma.pointage.presta.model.AffectationTache;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.Tache;
import ma.pointage.presta.model.enums.Role;
import ma.pointage.presta.repository.AffectationTacheRepository;
import ma.pointage.presta.repository.PrestataireRepository;
import ma.pointage.presta.repository.TacheRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AffectationTacheService {

    private final AffectationTacheRepository affectationTacheRepository;
    private final TacheRepository tacheRepository;
    private final PrestataireRepository prestataireRepository;

    @Transactional
    public AffectationTacheResponse affecterTache(AffectationTacheRequest request) {
        log.info("Création d'une affectation de tâche : tacheId={}, prestataireId={}", request.getTacheId(), request.getPrestataireId());

        if (affectationTacheRepository.existsByPrestataireIdAndTacheId(request.getPrestataireId(), request.getTacheId())) {
            log.error("Le prestataire {} est déjà affecté à la tâche {}", request.getPrestataireId(), request.getTacheId());
            throw new BusinessException("Ce prestataire est déjà affecté à cette tâche.");
        }

        Tache tache = tacheRepository.findById(request.getTacheId())
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id : " + request.getTacheId()));

        if (!tache.isActif()) {
            log.error("Tentative d'affectation vers une tâche inactive : tacheId={}", tache.getId());
            throw new BusinessException("La tâche « " + tache.getNom() + " » est inactive et ne peut pas être affectée.");
        }

        // Règle métier : seules les tâches du catalogue (créées par un administrateur) peuvent être affectées
        if (tache.getCreatedBy() == null || tache.getCreatedBy().getRole() != Role.ADMIN) {
            log.error("Tentative d'affectation d'une tâche personnelle : tacheId={}", tache.getId());
            throw new BusinessException("Seules les tâches du catalogue administrateur peuvent être affectées.");
        }

        Prestataire prestataire = prestataireRepository.findById(request.getPrestataireId())
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire non trouvé avec l'id : " + request.getPrestataireId()));

        if (!prestataire.isActif()) {
            log.error("Tentative d'affectation vers un prestataire inactif : prestataireId={}", prestataire.getId());
            throw new BusinessException("Le prestataire « " + prestataire.getPrenom() + " " + prestataire.getNom() + " » est inactif et ne peut pas recevoir une affectation.");
        }

        AffectationTache affectationTache = AffectationTacheMapper.toEntity(request, tache, prestataire);
        affectationTache = affectationTacheRepository.save(affectationTache);

        return AffectationTacheMapper.toResponse(affectationTache);
    }

    /**
     * Affecte plusieurs tâches à un prestataire en validant chaque affectation individuellement.
     * Les erreurs sur une tâche n'annulent pas les autres affectations valides.
     */
    @Transactional
    public AffectationBatchResponse affecterTaches(AffectationBatchRequest request) {
        log.info("Affectation en masse de tâches : prestataireId={}, tacheIds={}", request.getPrestataireId(), request.getTacheIds());

        List<AffectationTacheResponse> successes = new ArrayList<>();
        List<AffectationFailureDetail> failures = new ArrayList<>();

        for (Long tacheId : request.getTacheIds()) {
            try {
                AffectationTacheRequest singleRequest = AffectationTacheRequest.builder()
                        .prestataireId(request.getPrestataireId())
                        .tacheId(tacheId)
                        .build();
                // Exécute la logique et validations unitaires
                AffectationTacheResponse response = this.affecterTache(singleRequest);
                successes.add(response);
            } catch (Exception e) {
                log.warn("Échec d'affectation de la tâche {} au prestataire {} : {}", tacheId, request.getPrestataireId(), e.getMessage());
                failures.add(new AffectationFailureDetail(tacheId, e.getMessage()));
            }
        }

        return AffectationBatchResponse.builder()
                .successCount(successes.size())
                .failureCount(failures.size())
                .successes(successes)
                .failures(failures)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AffectationTacheResponse> getAffectationsByPrestataire(Long prestataireId) {
        log.info("Récupération des affectations pour le prestataireId={}", prestataireId);

        if (!prestataireRepository.existsById(prestataireId)) {
            throw new ResourceNotFoundException("Prestataire non trouvé avec l'id : " + prestataireId);
        }

        return affectationTacheRepository.findByPrestataireId(prestataireId).stream()
                .map(AffectationTacheMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AffectationTacheResponse> getAffectationsByTache(Long tacheId) {
        log.info("Récupération des affectations pour le tacheId={}", tacheId);

        if (!tacheRepository.existsById(tacheId)) {
            throw new ResourceNotFoundException("Tâche non trouvée avec l'id : " + tacheId);
        }

        return affectationTacheRepository.findByTacheId(tacheId).stream()
                .map(AffectationTacheMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AffectationTacheResponse> getAllAffectations() {
        log.info("Récupération de toutes les affectations");
        return affectationTacheRepository.findAll().stream()
                .map(AffectationTacheMapper::toResponse)
                .toList();
    }

    @Transactional
    public void supprimerAffectation(Long id) {
        log.info("Suppression de l'affectation id={}", id);

        AffectationTache affectation = affectationTacheRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Affectation non trouvée avec l'id : " + id));

        affectationTacheRepository.delete(affectation);
    }
}
