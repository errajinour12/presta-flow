package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectationBatchResponse {
    private int successCount;
    private int failureCount;
    private List<AffectationTacheResponse> successes;
    private List<AffectationFailureDetail> failures;
}
