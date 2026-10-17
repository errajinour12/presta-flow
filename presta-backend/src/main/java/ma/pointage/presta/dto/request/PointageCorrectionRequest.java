package ma.pointage.presta.dto.request;

import jakarta.validation.Valid;
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
public class PointageCorrectionRequest {

    @NotNull(message = "L'ID du pointage d'origine (BRUT) est obligatoire")
    private Long brutPointageId;

    private String dayType;

    @Valid
    @NotNull(message = "La liste des créneaux est obligatoire")
    private List<CreneauCorrectionRequest> creneaux;
}
