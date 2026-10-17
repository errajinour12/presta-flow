package ma.pointage.presta.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectationTacheRequest {

    @NotNull(message = "L'identifiant de la tâche est obligatoire")
    private Long tacheId;

    @NotNull(message = "L'identifiant du prestataire est obligatoire")
    private Long prestataireId;
}
