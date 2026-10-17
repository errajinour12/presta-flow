package ma.pointage.presta.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCorrectionRequest {

    @Valid
    @NotEmpty(message = "La liste des corrections ne peut pas être vide")
    private List<PointageCorrectionRequest> corrections;
}
