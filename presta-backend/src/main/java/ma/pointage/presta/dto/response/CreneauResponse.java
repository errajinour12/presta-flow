package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreneauResponse {

    private Long id;
    private LocalTime heureEntree;
    private LocalTime heureSortie;
    private Integer ordre;
}
