package ma.pointage.presta.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.BatchCorrectionRequest;
import ma.pointage.presta.dto.request.PointageCorrectionRequest;
import ma.pointage.presta.dto.response.DailyAttendanceSummaryResponse;
import ma.pointage.presta.dto.response.PointageResponse;
import ma.pointage.presta.service.PointageCorrectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prestataire")
@RequiredArgsConstructor
public class PointageCorrectionController {

    private final PointageCorrectionService pointageCorrectionService;

    /**
     * Endpoint permettant à un prestataire de consulter tous les pointages (BRUT + CORRIGEE) d'une image.
     */
    @GetMapping("/images-pointage/{imageId}/pointages")
    public ResponseEntity<List<DailyAttendanceSummaryResponse>> getPointagesByImage(@PathVariable Long imageId) {
        return ResponseEntity.ok(pointageCorrectionService.getPointagesByImage(imageId));
    }

    /**
     * Endpoint permettant d'enregistrer/mettre à jour un seul pointage corrigé (brouillon).
     */
    @PostMapping("/pointages/corrections")
    public ResponseEntity<PointageResponse> saveOrUpdateCorrection(@Valid @RequestBody PointageCorrectionRequest request) {
        return ResponseEntity.ok(pointageCorrectionService.saveOrUpdateCorrection(request));
    }

    /**
     * Endpoint permettant d'enregistrer/mettre à jour en lot les corrections d'une image.
     */
    @PostMapping("/images-pointage/{imageId}/corrections")
    public ResponseEntity<List<PointageResponse>> saveOrUpdateBatchCorrections(
            @PathVariable Long imageId,
            @Valid @RequestBody BatchCorrectionRequest batchRequest) {
        return ResponseEntity.ok(pointageCorrectionService.saveOrUpdateBatchCorrections(imageId, batchRequest));
    }

    /**
     * Endpoint permettant de soumettre définitivement les pointages corrigés d'une image (statut EN_ATTENTE).
     */
    @PostMapping("/images-pointage/{imageId}/soumettre")
    public ResponseEntity<List<PointageResponse>> submitCorrectionsForImage(@PathVariable Long imageId) {
        return ResponseEntity.ok(pointageCorrectionService.submitCorrectionsForImage(imageId));
    }

    /**
     * Endpoint permettant à un prestataire de resoumettre un pointage (CORRIGEE) rejeté.
     */
    @PostMapping("/pointages/{pointageId}/resoumettre")
    public ResponseEntity<PointageResponse> resubmitSinglePointage(@PathVariable Long pointageId) {
        return ResponseEntity.ok(pointageCorrectionService.resubmitSinglePointage(pointageId));
    }
}
