package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AffectationFailureDetail {
    private Long tacheId;
    private String error;
}
