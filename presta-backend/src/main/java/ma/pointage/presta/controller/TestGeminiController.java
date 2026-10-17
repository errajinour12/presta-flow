package ma.pointage.presta.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.pointage.presta.dto.gemini.AttendanceExtractionDTO;
import ma.pointage.presta.service.GeminiService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * TEMPORARY controller for testing the Gemini extraction pipeline.
 * DO NOT use in production. Remove this class after validation.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class TestGeminiController {

    private final GeminiService geminiService;

    /**
     * Temporary endpoint to test the full Gemini extraction flow.
     * Accepts an image file, sends it to Gemini, and returns the parsed AttendanceExtractionDTO.
     * No data is saved to the database. Alfresco is not involved.
     *
     * @param file the attendance sheet image (JPEG, PNG, WEBP or PDF)
     * @return the extracted attendance data as JSON
     */
    @PostMapping(value = "/test-gemini", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttendanceExtractionDTO> testGeminiExtraction(
            @RequestParam("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String mimeType = file.getContentType();
        if (mimeType == null || mimeType.isBlank()) {
            mimeType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        log.info("[TEST] Gemini extraction test triggered — file: {}, mimeType: {}, size: {} bytes",
                file.getOriginalFilename(), mimeType, file.getSize());

        // Convert MultipartFile to a Spring Resource
        Resource resource = file.getResource();

        AttendanceExtractionDTO result = geminiService.extractAttendance(resource, mimeType);

        log.info("[TEST] Gemini extraction successful — periodStart: {}, periodEnd: {}, records: {}",
                result.getPeriodStart(), result.getPeriodEnd(),
                result.getAttendanceRecords() != null ? result.getAttendanceRecords().size() : 0);

        return ResponseEntity.ok(result);
    }
}
