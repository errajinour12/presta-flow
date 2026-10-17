package ma.pointage.presta.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.RejectSubmissionRequest;
import ma.pointage.presta.dto.response.DailyAttendanceSummaryResponse;
import ma.pointage.presta.dto.response.PendingSubmissionResponse;
import ma.pointage.presta.dto.response.PointageResponse;
import ma.pointage.presta.dto.response.ProcessedSubmissionResponse;
import ma.pointage.presta.service.AdminAttendanceValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAttendanceValidationController {

    private final AdminAttendanceValidationService adminAttendanceValidationService;

    /**
     * Retrieve all pending attendance submissions.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<PendingSubmissionResponse>> getPendingSubmissions() {
        return ResponseEntity.ok(adminAttendanceValidationService.getPendingSubmissions());
    }

    /**
     * Retrieve all processed attendance submissions (history).
     */
    @GetMapping("/history")
    public ResponseEntity<List<ProcessedSubmissionResponse>> getProcessedSubmissions() {
        return ResponseEntity.ok(adminAttendanceValidationService.getProcessedSubmissions());
    }

    /**
     * View complete submission details (BRUT vs CORRIGEE) for an image.
     */
    @GetMapping("/{imageId}/details")
    public ResponseEntity<List<DailyAttendanceSummaryResponse>> getSubmissionDetails(@PathVariable Long imageId) {
        return ResponseEntity.ok(adminAttendanceValidationService.getSubmissionDetails(imageId));
    }

    /**
     * Validate a single pending pointage for a day.
     */
    @PostMapping("/pointages/{pointageId}/validate")
    public ResponseEntity<PointageResponse> validatePointage(@PathVariable Long pointageId) {
        return ResponseEntity.ok(adminAttendanceValidationService.validatePointage(pointageId));
    }

    /**
     * Reject a single pending pointage for a day with a mandatory rejection reason.
     */
    @PostMapping("/pointages/{pointageId}/reject")
    public ResponseEntity<PointageResponse> rejectPointage(
            @PathVariable Long pointageId,
            @Valid @RequestBody RejectSubmissionRequest request) {
        return ResponseEntity.ok(adminAttendanceValidationService.rejectPointage(pointageId, request.getMotifRejet()));
    }
}
