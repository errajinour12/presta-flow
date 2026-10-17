package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.TacheRequest;
import ma.pointage.presta.dto.response.TacheResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.mapper.TacheMapper;
import ma.pointage.presta.model.Admin;
import ma.pointage.presta.model.Tache;
import ma.pointage.presta.model.enums.Role;
import ma.pointage.presta.repository.TacheRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TacheService {

    private final TacheRepository tacheRepository;

    // CREATE

    /**
     * Crée une nouvelle tâche dans le catalogue commun
     * Le nom de la tâche doit être unique globalement
     */
    @Transactional
    public TacheResponse createTache(TacheRequest request) {

        if (tacheRepository.existsByNom(request.getNom())) {
            throw new BusinessException("Une tâche portant le nom « " + request.getNom() + " » existe déjà.");
        }

        Admin admin = getAdminConnecte();

        Tache tache = TacheMapper.toEntity(request, admin);
        Tache savedTache = tacheRepository.save(tache);

        return TacheMapper.toResponse(savedTache);
    }

    // READ ALL

    /** Récupère l'intégralité du catalogue de tâches (commun à tous les admins) */
    @Transactional(readOnly = true)
    public List<TacheResponse> getAllTaches() {

        return tacheRepository.findAll()
                .stream()
                .map(TacheMapper::toResponse)
                .toList();
    }

    // CATALOGUE (tâches créées par des administrateurs uniquement)

    /**
     * Retourne uniquement les tâches créées par des administrateurs.
     * Ces tâches constituent le catalogue commun pouvant être affecté à n'importe quel prestataire.
     */
    @Transactional(readOnly = true)
    public List<TacheResponse> getCatalogueTaches() {

        return tacheRepository.findByCreatedBy_Role(Role.ADMIN)
                .stream()
                .map(TacheMapper::toResponse)
                .toList();
    }

    // READ ONE

    /** Récupère une tâche par son identifiant */
    @Transactional(readOnly = true)
    public TacheResponse getById(Long id) {

        Tache tache = findTacheById(id);
        return TacheMapper.toResponse(tache);
    }

    // UPDATE

    /** Met à jour les informations d'une tâche (nom, description, catégorie) */
    @Transactional
    public TacheResponse updateTache(Long id, TacheRequest request) {

        Tache tache = findTacheById(id);

        if (tacheRepository.existsByNomAndIdNot(request.getNom(), id)) {
            throw new BusinessException("Une tâche portant le nom « " + request.getNom() + " » existe déjà.");
        }

        tache.setNom(request.getNom());
        tache.setDescription(request.getDescription());
        tache.setCategorie(request.getCategorie());

        Tache updatedTache = tacheRepository.save(tache);

        return TacheMapper.toResponse(updatedTache);
    }

    // TOGGLE STATUT

    /** Active ou désactive une tâche (suppression logique) */
    @Transactional
    public TacheResponse toggleStatut(Long id) {

        Tache tache = findTacheById(id);

        tache.setActif(!tache.isActif());
        Tache updatedTache = tacheRepository.save(tache);

        return TacheMapper.toResponse(updatedTache);
    }

    // Méthodes privées réutilisées

    /** Récupère l'admin actuellement authentifié depuis le SecurityContext */
    private Admin getAdminConnecte() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Admin) authentication.getPrincipal();
    }

    /** Recherche une tâche par son ID */
    private Tache findTacheById(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tache", id));
    }
}
