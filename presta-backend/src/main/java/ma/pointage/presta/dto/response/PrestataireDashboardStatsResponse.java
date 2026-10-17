package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrestataireDashboardStatsResponse {

    // 4 KPI Cards
    private long pointagesMois;
    private long pointagesEnAttente;
    private long pointagesValides;
    private long pointagesRejetes;

    // Daily Evolution (e.g. last 30 days)
    private List<DailyPointageStatDto> dailyStats;

    // 3 Task Counters
    private long tachesNonDemarrees;
    private long tachesEnCours;
    private long tachesTerminees;

    // Recent Activities
    private RecentPointageDto dernierPointageSoumis;
    private RecentPointageDto dernierPointageTraite;
    private RecentTaskDto derniereTacheAffectee;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyPointageStatDto {
        private String date; // e.g. "2026-08-25" or "25/08"
        private String fullDate; // ISO date format "YYYY-MM-DD"
        private long total;
        private long valides;
        private long enAttente;
        private long rejetes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentPointageDto {
        private Long id;
        private String datePointage;
        private String statut;
        private String nomFichier;
        private String motifRejet;
        private LocalDateTime dateAction;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentTaskDto {
        private Long affectationId;
        private String nomTache;
        private String categorie;
        private String statut;
        private LocalDateTime dateAffectation;
    }
}
