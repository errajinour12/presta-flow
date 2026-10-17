package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsResponse {

    // KPI Cards
    private long totalPrestataires;
    private long prestatairesActifs;
    private long totalTaches;
    private long tachesEnCours;
    private long totalPointages;
    private long pointagesMois;
    private long pointagesEnAttente;
    private long pointagesValides;
    private long pointagesValidesMois;
    private long pointagesRejetes;

    // Monthly Grouped Bar Chart (6 months)
    private List<MonthlyPointageStatDto> monthlyStats;

    // Donut chart percentages
    private Map<String, Long> pointagesParStatut;
    private Map<String, Double> pointagesStatutPourcentages;

    // Task breakdown
    private Map<String, Long> tachesParStatut;
    private long tachesTermineesAujourdhui;

    // 5 Latest Submitted Pointages
    private List<LatestSubmissionDto> latestSubmissions;

    // Recent activities (5 items)
    private List<RecentActivityDto> recentActivities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyPointageStatDto {
        private String monthName; // e.g., "Mars", "Avril", "Mai", "Juin", "Juillet", "Août"
        private long valides;
        private long rejetes;
        private long enAttente;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LatestSubmissionDto {
        private Long imageId;
        private String prestataireNom;
        private String prestataireMatricule;
        private String periode;
        private LocalDateTime soumisLe;
        private String statut; // EN_ATTENTE, VALIDE, REJETE, EXTRAIT
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDto {
        private String id;
        private String type; // POINTAGE_SUBMITTED, POINTAGE_VALIDATED, POINTAGE_REJECTED, TASK_CREATED, PRESTATAIRE_CREATED
        private String title;
        private String description;
        private LocalDateTime timestamp;
    }
}
