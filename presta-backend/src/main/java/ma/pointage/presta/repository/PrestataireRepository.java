package ma.pointage.presta.repository;

import ma.pointage.presta.model.Prestataire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrestataireRepository extends JpaRepository<Prestataire, Long> {

    // Récupère tous les prestataires gérés par un admin donné
    List<Prestataire> findByAdminId(Long adminId);

    // Récupère un prestataire par email
    Optional<Prestataire> findByEmail(String email);

    // Recherche un prestataire par son ID ET son adminId (isolation par admin)
    Optional<Prestataire> findByIdAndAdminId(Long id, Long adminId);

    // Vérifications d'unicité à la création (délégué depuis UtilisateurRepository)
    // Les deux méthodes ci-dessous excluent l'entité en cours de modification

    // Vérifie si un autre prestataire possède déjà cet email
    boolean existsByEmailAndIdNot(String email, Long id);

    // Vérifie si un autre prestataire possède déjà ce matricule
    boolean existsByMatriculeAndIdNot(String matricule, Long id);
}