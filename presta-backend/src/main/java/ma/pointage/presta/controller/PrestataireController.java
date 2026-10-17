package ma.pointage.presta.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.PrestataireRequest;
import ma.pointage.presta.dto.response.PrestataireResponse;
import ma.pointage.presta.service.PrestataireService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prestataires")
@RequiredArgsConstructor
public class PrestataireController {

    private final PrestataireService prestataireService;

    // Crée un nouveau prestatire et l'associe à l'admin connecté
    /**--------POST /api/prestataires----------**/
    @PostMapping
    public ResponseEntity<PrestataireResponse> createPrestataire(
            @Valid @RequestBody PrestataireRequest request
    ) {
        PrestataireResponse response = prestataireService.createPrestataire(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //récupérer la liste de tous les prestataires de l'admin connecté
    /**--------GET /api/prestataires----------**/
    @GetMapping
    public ResponseEntity<List<PrestataireResponse>> getAllPrestataires() {
        return ResponseEntity.ok(prestataireService.getAllPrestataires());
    }

    //Récupère le détail d'un prestataire par son identifiant
    /**---------GET /api/prestataires/{id}--------*/
    @GetMapping("/{id}")
    public ResponseEntity<PrestataireResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(prestataireService.getById(id));
    }

    //Met à jour les informations d'un prestataire (hors mot de passe)
    /**-------PUT /api/prestataires/{id}--------**/
    @PutMapping("/{id}")
    public ResponseEntity<PrestataireResponse> updatePrestataire(
            @PathVariable Long id,
            @Valid @RequestBody PrestataireRequest request
    ) {
        return ResponseEntity.ok(prestataireService.updatePrestataire(id, request));
    }

    //Suppression logique (Activer ou Désactiver un prestataires)
    /**-------Patch /api/prestataires/{id}/statut--------**/
    @PatchMapping("/{id}/statut")
    public ResponseEntity<PrestataireResponse> toggleStatut(@PathVariable Long id) {
        return ResponseEntity.ok(prestataireService.toggleStatut(id));
    }


}

