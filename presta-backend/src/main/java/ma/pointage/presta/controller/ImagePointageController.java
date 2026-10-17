package ma.pointage.presta.controller;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.response.ImageDownloadPayload;
import ma.pointage.presta.dto.response.ImagePointageResponse;
import ma.pointage.presta.dto.response.ImageUploadWithExtractionResponse;
import ma.pointage.presta.service.ImagePointageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ImagePointageController {

    private final ImagePointageService imagePointageService;

    /**
     * Endpoint permettant à un prestataire d'envoyer une image de pointage.
     */
    @PostMapping(value = "/prestataire/images-pointage", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadWithExtractionResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(imagePointageService.uploadImage(file));
    }

    /**
     * Endpoint permettant à un prestataire de consulter son historique d'images importées.
     */
    @GetMapping("/prestataire/images-pointage")
    public ResponseEntity<List<ImagePointageResponse>> getMesImages() {
        return ResponseEntity.ok(imagePointageService.getMesImages());
    }

    /**
     * Endpoint permettant à un administrateur de consulter toutes les images de pointage importées.
     */
    @GetMapping("/admin/images-pointage")
    public ResponseEntity<List<ImagePointageResponse>> getAllImages() {
        return ResponseEntity.ok(imagePointageService.getAllImages());
    }

    /**
     * Endpoint permettant à un prestataire de télécharger/consulter l'une de ses images.
     */
    @GetMapping("/prestataire/images-pointage/{id}/content")
    public ResponseEntity<Resource> downloadImagePrestataire(@PathVariable Long id) {
        ImageDownloadPayload payload = imagePointageService.downloadImageContent(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(payload.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + payload.getNomOriginal() + "\"")
                .body(payload.getResource());
    }

    /**
     * Endpoint permettant à un administrateur de télécharger/consulter une image de pointage.
     */
    @GetMapping("/admin/images-pointage/{id}/content")
    public ResponseEntity<Resource> downloadImageAdmin(@PathVariable Long id) {
        ImageDownloadPayload payload = imagePointageService.downloadImageContentForAdmin(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(payload.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + payload.getNomOriginal() + "\"")
                .body(payload.getResource());
    }
}
