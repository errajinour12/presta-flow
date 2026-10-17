package ma.pointage.presta.controller;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.response.PrestataireDashboardStatsResponse;
import ma.pointage.presta.service.PrestataireDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prestataire/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PRESTATAIRE')")
public class PrestataireDashboardController {

    private final PrestataireDashboardService prestataireDashboardService;

    @GetMapping("/stats")
    public ResponseEntity<PrestataireDashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(prestataireDashboardService.getDashboardStats());
    }
}
