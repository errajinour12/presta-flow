package ma.pointage.presta.dto.response;

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

public class PrestataireResponse {

    private Long id;

    private String matricule;

    private String nom;

    private String prenom;

    private String email;

    private LocalDate dateNaissance;

    private LocalDate dateEmbauche;

    private boolean actif;

    private Long adminId;

    private String adminNomComplet;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


}
