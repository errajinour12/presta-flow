package ma.pointage.presta.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreneauCorrectionRequest {

    @NotNull(message = "L'heure d'entrée est obligatoire")
    private LocalTime heureEntree;

    @NotNull(message = "L'heure de sortie est obligatoire")
    private LocalTime heureSortie;

    private Integer ordre;
}
