package ma.pointage.presta.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDataDTO {

    private String prestataireNomComplet;
    private String prestataireEmail;
    private String prestataireMatricule;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate generatedAt;

    private SummaryMetrics summaryMetrics;
    private List<DailyAttendanceItem> dailyItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryMetrics {
        private int totalDays;
        private int presentDays;
        private int absentDays;
        private int leaveDays;
        private double totalWorkedHours;
        private String totalWorkedHoursFormatted;
        private double attendanceRate;
        private String attendanceRateFormatted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyAttendanceItem {
        private LocalDate date;
        private String dayOfWeek; // e.g. "Lundi", "Mardi"
        private String dayType;   // e.g. "PRESENCE", "Absence", "Congé"
        private String statut;    // e.g. "VALIDE"
        private List<String> timeSlots; // e.g. ["08:45 - 12:15", "13:15 - 17:30"]
        private double dailyDurationHours;
        private String dailyDurationFormatted; // e.g. "08h00" or "0h00"
    }
}
