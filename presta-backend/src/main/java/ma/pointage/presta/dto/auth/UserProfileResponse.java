package ma.pointage.presta.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String matricule;
    private String nom;
    private String prenom;
    private String nomComplet;
    private String email;
    private String role;
    private LocalDateTime createdAt;

    // Spécifique Prestataire (null pour Admin)
    private LocalDate dateNaissance;
    private LocalDate dateEmbauche;
    private Boolean actif;
    private String adminNomComplet;
}
