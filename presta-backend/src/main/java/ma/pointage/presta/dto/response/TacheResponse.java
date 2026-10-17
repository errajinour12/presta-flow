package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.pointage.presta.model.enums.CategorieTache;
import ma.pointage.presta.model.enums.Role;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TacheResponse {

    private Long id;

    private String nom;

    private String description;

    private CategorieTache categorie;

    private boolean actif;

    private Long createdById;

    private String createdByNomComplet;

    private Role createdByRole;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

