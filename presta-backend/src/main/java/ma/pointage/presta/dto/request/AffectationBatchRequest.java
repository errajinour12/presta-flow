package ma.pointage.presta.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectationBatchRequest {

    @NotNull(message = "L'identifiant du prestataire est obligatoire")
    private Long prestataireId;

    @NotEmpty(message = "La liste des identifiants des tâches ne peut pas être vide")
    private List<Long> tacheIds;
}
