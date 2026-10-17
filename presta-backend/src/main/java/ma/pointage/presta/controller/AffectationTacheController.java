package ma.pointage.presta.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import ma.pointage.presta.dto.response.AffectationTacheResponse;
import ma.pointage.presta.service.AffectationTacheService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ma.pointage.presta.dto.request.AffectationBatchRequest;
import ma.pointage.presta.dto.response.AffectationBatchResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/affectations")
@RequiredArgsConstructor
public class AffectationTacheController {

    private final AffectationTacheService affectationTacheService;

    @PostMapping
    public ResponseEntity<AffectationBatchResponse> affecterTache(@Valid @RequestBody AffectationBatchRequest request) {
        AffectationBatchResponse response = affectationTacheService.affecterTaches(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }


    @GetMapping
    public ResponseEntity<List<AffectationTacheResponse>> getAllAffectations() {
        return ResponseEntity.ok(affectationTacheService.getAllAffectations());
    }

    @GetMapping("/prestataire/{id}")
    public ResponseEntity<List<AffectationTacheResponse>> getAffectationsByPrestataire(@PathVariable Long id) {
        List<AffectationTacheResponse> responses = affectationTacheService.getAffectationsByPrestataire(id);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/tache/{id}")
    public ResponseEntity<List<AffectationTacheResponse>> getAffectationsByTache(@PathVariable Long id) {
        List<AffectationTacheResponse> responses = affectationTacheService.getAffectationsByTache(id);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerAffectation(@PathVariable Long id) {
        affectationTacheService.supprimerAffectation(id);
        return ResponseEntity.noContent().build();
    }
}
