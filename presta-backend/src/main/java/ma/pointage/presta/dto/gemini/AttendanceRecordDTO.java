package ma.pointage.presta.dto.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class AttendanceRecordDTO {

    private LocalDate date;

    private String dayName;

    /**
     * Examples:
     * - PRESENCE
     * - Congé annuel
     * - Absence Inj.
     * - Absence
     * - ...
     */
    private String dayType;

    private List<TimeSlotDTO> timeSlots;
}