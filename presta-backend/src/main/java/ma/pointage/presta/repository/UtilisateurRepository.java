package ma.pointage.presta.repository;

import ma.pointage.presta.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

//Fournir la recherche par email nécessaire à l'authentification Spring Security.

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    //Recherche un utilisateur par son adresse email (champ de connexion).
     //@param email l'email de l'utilisateur
     // @return un Optional contenant l'utilisateur si trouvé

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByMatricule(String matricule);
}
