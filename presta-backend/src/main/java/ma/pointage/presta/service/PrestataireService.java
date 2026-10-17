package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.PrestataireRequest;
import ma.pointage.presta.dto.response.PrestataireResponse;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.mapper.PrestataireMapper;
import ma.pointage.presta.model.Admin;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.repository.PrestataireRepository;
import ma.pointage.presta.repository.UtilisateurRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
public class PrestataireService {

    private final PrestataireRepository prestataireRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

        /**-----------------------------Create---------------------------------**/

    public PrestataireResponse createPrestataire(PrestataireRequest request) {

        // Vérifier l'unicite de l'email
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un utilisateur avec cet email existe déjà.");
        }

        // Vérifier l'unicite du matricule
        if (utilisateurRepository.existsByMatricule(request.getMatricule())) {
            throw new RuntimeException("Un utilisateur avec ce matricule existe déjà.");
        }

        // Récupérer l'admin connecté
        Admin admin = getAdminConnecte();
        // Mapper Request -> Entity
        Prestataire prestataire = PrestataireMapper.toEntity(request, admin, passwordEncoder);
        // Sauvegarder
        Prestataire savedPrestataire = prestataireRepository.save(prestataire);
        // Mapper Entity -> Response
        return PrestataireMapper.toResponse(savedPrestataire);

    }

    /**----------------------------READ ALL----------------------------------------**/

    @Transactional(readOnly = true)
    public List<PrestataireResponse> getAllPrestataires() {

        Admin admin = getAdminConnecte();

        return prestataireRepository.findByAdminId(admin.getId())
                .stream()
                .map(PrestataireMapper::toResponse)
                .toList();
    }

    /**----------------------------READ ONE---------------------------------**/

    @Transactional(readOnly = true)
    public PrestataireResponse getById(Long id) {

        Admin admin = getAdminConnecte();
        Prestataire prestataire = findPrestataireByIdAndAdmin(id, admin.getId());

        return PrestataireMapper.toResponse(prestataire);
    }

    /**----------------------------UPDATE---------------------------------**/

    @Transactional
    public PrestataireResponse updatePrestataire(Long id, PrestataireRequest request) {

        Admin admin = getAdminConnecte();
        Prestataire prestataire = findPrestataireByIdAndAdmin(id, admin.getId());

        // Vérifier l'unicité de l'email en excluant le prestataire courant
        if (prestataireRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new BusinessException("Cet email est déjà utilisé par un autre utilisateur.");
        }

        // Vérifier l'unicité du matricule en excluant le prestataire courant
        if (prestataireRepository.existsByMatriculeAndIdNot(request.getMatricule(), id)) {
            throw new BusinessException("Ce matricule est déjà utilisé par un autre utilisateur.");
        }

        // Mise à jour des champs (le mot de passe n'est pas modifié ici)
        prestataire.setNom(request.getNom());
        prestataire.setPrenom(request.getPrenom());
        prestataire.setEmail(request.getEmail());
        prestataire.setMatricule(request.getMatricule());
        prestataire.setDateNaissance(request.getDateNaissance());
        prestataire.setDateEmbauche(request.getDateEmbauche());

        Prestataire updatedPrestataire = prestataireRepository.save(prestataire);

        return PrestataireMapper.toResponse(updatedPrestataire);
    }

    /**------------------------TOGGEL STATUT-----------------------------**/

    @Transactional
    public PrestataireResponse toggleStatut(Long id) {

        Admin admin = getAdminConnecte();
        Prestataire prestataire = findPrestataireByIdAndAdmin(id, admin.getId());

        // Inversion du statut actif/inactif
        prestataire.setActif(!prestataire.isActif());
        Prestataire updatedPrestataire = prestataireRepository.save(prestataire);

        return PrestataireMapper.toResponse(updatedPrestataire);
    }

    /**----------------méthodes privées réutilisées----------**/
    //Récupère l'admin actuellement authentifié depuis le SecurityContext
    private Admin getAdminConnecte() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Admin) authentication.getPrincipal();
    }
    //Recherche un prestataire par son ID en vérifiant qu'il appartient à l'admin donné
    private Prestataire findPrestataireByIdAndAdmin(Long prestataireId, Long adminId) {
        return prestataireRepository.findByIdAndAdminId(prestataireId, adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire", prestataireId));
    }

}