package ma.pointage.presta.controller;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.response.RapportResponse;
import ma.pointage.presta.service.RapportService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/rapports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRapportController {

    private final RapportService rapportService;

    /**
     * Récupère la liste de tous les rapports générés pour l'ensemble des prestataires.
     */
    @GetMapping
    public ResponseEntity<List<RapportResponse>> getAllRapports() {
        return ResponseEntity.ok(rapportService.getAllRapportsForAdmin());
    }

    /**
     * Télécharge la version PDF d'un rapport existant à partir de son identifiant (pour les admins).
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadReport(@PathVariable Long id) {
        Resource resource = rapportService.downloadReportContentForAdmin(id);

        String filename = "Rapport_Assiduite_" + id + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
