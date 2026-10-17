package ma.pointage.presta.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.TacheRequest;
import ma.pointage.presta.dto.response.AffectationTacheResponse;
import ma.pointage.presta.dto.response.TacheResponse;
import ma.pointage.presta.service.PrestataireTacheService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prestataire/taches")
@RequiredArgsConstructor
public class PrestataireTacheController {

    private final PrestataireTacheService prestataireTacheService;

    @PostMapping
    public ResponseEntity<TacheResponse> creerTache(@Valid @RequestBody TacheRequest request) {
        TacheResponse response = prestataireTacheService.creerTache(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AffectationTacheResponse>> getMesTaches() {
        List<AffectationTacheResponse> response = prestataireTacheService.getMesTaches();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{affectationId}/demarrer")
    public ResponseEntity<AffectationTacheResponse> demarrerTache(@PathVariable Long affectationId) {
        AffectationTacheResponse response = prestataireTacheService.demarrerTache(affectationId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{affectationId}/terminer")
    public ResponseEntity<AffectationTacheResponse> terminerTache(@PathVariable Long affectationId) {
        AffectationTacheResponse response = prestataireTacheService.terminerTache(affectationId);
        return ResponseEntity.ok(response);
    }
}

