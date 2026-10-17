package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointageResponse {

    private Long id;
    private LocalDate date;
    private StatutPointage statut;
    private OrigineDonnees origineDonnees;
    private Long pointageOrigineId;
    private String dayType;
    private String motifRejet;
    private Long imagePointageId;
    private boolean editable;
    private List<CreneauResponse> creneaux;
}
