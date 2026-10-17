package ma.pointage.presta.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectSubmissionRequest {

    @NotBlank(message = "Le motif de rejet est obligatoire.")
    private String motifRejet;
}
