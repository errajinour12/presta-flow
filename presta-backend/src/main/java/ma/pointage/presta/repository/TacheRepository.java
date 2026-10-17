package ma.pointage.presta.repository;

import ma.pointage.presta.model.Tache;
import ma.pointage.presta.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {

    // Vérifie l'unicité globale du nom à la création
    boolean existsByNom(String nom);

    // Vérifie l'unicité globale du nom en excluant la tâche en cours de modification
    boolean existsByNomAndIdNot(String nom, Long id);

    // Récupère les tâches créées par des utilisateurs ayant un rôle donné (ex. ADMIN)
    List<Tache> findByCreatedBy_Role(Role role);
}

