package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.pointage.presta.model.enums.StatutTache;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectationTacheResponse {

    private Long id;

    private Long tacheId;
    private String tacheNom;

    private Long prestataireId;
    private String prestataireNomComplet;

    /** Statut de progression de la tâche (NON_DEMARREE, EN_COURS, TERMINEE). */
    private StatutTache statut;

    /** Horodatage du démarrage effectif de la tâche. Null si non encore démarrée. */
    private LocalDateTime dateDebut;

    /** Horodatage de la fin effective de la tâche. Null si non encore terminée. */
    private LocalDateTime dateFin;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
