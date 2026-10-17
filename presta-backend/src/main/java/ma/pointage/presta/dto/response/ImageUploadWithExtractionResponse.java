package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.pointage.presta.dto.gemini.AttendanceExtractionDTO;

/**
 * DTO that combines the image metadata with the attendance extraction result.
 * Designed for the future frontend; contains no redundant fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadWithExtractionResponse {
    /** Image metadata returned by the existing ImagePointage endpoint */
    private ImagePointageResponse image;

    /** Result of Gemini attendance extraction */
    private AttendanceExtractionDTO extraction;
}
