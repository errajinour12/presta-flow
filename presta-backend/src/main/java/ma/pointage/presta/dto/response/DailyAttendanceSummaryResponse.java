package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.pointage.presta.model.enums.StatutPointage;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAttendanceSummaryResponse {

    private LocalDate date;
    private boolean hasCorrection;
    private PointageResponse brutPointage;
    private PointageResponse corrigeePointage;

    /** Statut du pointage actif pour ce jour (CORRIGEE ?? BRUT). */
    private StatutPointage statutActif;

    /** Motif de rejet du pointage actif si statut == REJETE, sinon null. */
    private String motifRejet;
}
