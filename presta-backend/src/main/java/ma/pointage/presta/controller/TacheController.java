package ma.pointage.presta.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.TacheRequest;
import ma.pointage.presta.dto.response.TacheResponse;
import ma.pointage.presta.service.TacheService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Contrôleur REST pour la gestion du catalogue de tâches.  */
@RestController
@RequestMapping("/api/taches")
@RequiredArgsConstructor
public class TacheController {

    private final TacheService tacheService;

    /**-----------------POST /api/taches -------------------*/
    // Crée une nouvelle tâche dans le catalogue commun

    @PostMapping
    public ResponseEntity<TacheResponse> createTache(
            @Valid @RequestBody TacheRequest request
    ) {
        TacheResponse response = tacheService.createTache(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**-----------------GET /api/taches-------------------*/
    //Récupère l'intégralité du catalogue de tâches

    @GetMapping
    public ResponseEntity<List<TacheResponse>> getAllTaches() {
        return ResponseEntity.ok(tacheService.getAllTaches());
    }

    /**-----------------GET /api/taches/catalogue-------------------*/
    // Retourne uniquement les tâches créées par des administrateurs.
    // Utilisé par la modal "Nouvelle Affectation" pour n'afficher que les tâches du catalogue commun.

    @GetMapping("/catalogue")
    public ResponseEntity<List<TacheResponse>> getCatalogueTaches() {
        return ResponseEntity.ok(tacheService.getCatalogueTaches());
    }

    /**-----------------GET /api/taches/{id}-------------------*/
    // Récupère le détail d'une tâche par son identifiant

    @GetMapping("/{id}")
    public ResponseEntity<TacheResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tacheService.getById(id));
    }

    /**-----------------PUT /api/taches/{id}-------------------*/
    //Met à jour les informations d'une tâche (nom, description, catégorie)

    @PutMapping("/{id}")
    public ResponseEntity<TacheResponse> updateTache(
            @PathVariable Long id,
            @Valid @RequestBody TacheRequest request
    ) {
        return ResponseEntity.ok(tacheService.updateTache(id, request));
    }


    /**------------- PATCH /api/taches/{id}/statut ----------------*/
    //Suppression logique (Activer ou Désactiver un prestataires)

    @PatchMapping("/{id}/statut")
    public ResponseEntity<TacheResponse> toggleStatut(@PathVariable Long id) {
        return ResponseEntity.ok(tacheService.toggleStatut(id));
    }
}
