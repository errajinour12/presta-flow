package ma.pointage.presta.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.request.ReportGenerationRequest;
import ma.pointage.presta.dto.response.RapportResponse;
import ma.pointage.presta.service.RapportService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prestataire/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService rapportService;

    /**
     * Génère le rapport PDF d'assiduité pour la période sélectionnée,
     * l'enregistre sur Alfresco et MySQL, et le retourne sous forme de flux binaire (PDF).
     */
    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateReport(@Valid @RequestBody ReportGenerationRequest request) {
        byte[] pdfBytes = rapportService.generateAndSaveReport(request);

        String filename = String.format("Rapport_Assiduite_%s_%s.pdf", request.getStartDate(), request.getEndDate());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(pdfBytes);
    }

    /**
     * Récupère l'historique des rapports générés pour le prestataire connecté.
     */
    @GetMapping
    public ResponseEntity<List<RapportResponse>> getMesRapports() {
        return ResponseEntity.ok(rapportService.getMesRapports());
    }

    /**
     * Télécharge la version PDF d'un rapport précédemment généré à partir de son identifiant,
     * après vérification stricte des droits d'accès du prestataire connecté.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadReport(@PathVariable Long id) {
        Resource resource = rapportService.downloadReportContent(id);

        String filename = "Rapport_Assiduite_" + id + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
