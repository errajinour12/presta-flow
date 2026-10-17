package ma.pointage.presta.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.pointage.presta.config.GeminiPrompt;
import ma.pointage.presta.config.GeminiProperties;
import ma.pointage.presta.dto.gemini.AttendanceExtractionDTO;
import ma.pointage.presta.exception.BusinessException;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    private final WebClient geminiWebClient;
    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;

    /**
     * Extracts attendance data from a given image resource.
     *
     * @param resource the Resource representing the image
     * @param mimeType the MIME type of the resource (e.g., "image/png")
     * @return the deserialized AttendanceExtractionDTO
     */
    public AttendanceExtractionDTO extractAttendance(Resource resource, String mimeType) {
        if (resource == null) {
            throw new IllegalArgumentException("Le fichier de pointage (Resource) ne peut pas être nul.");
        }
        if (mimeType == null || mimeType.isBlank()) {
            throw new IllegalArgumentException("Le type MIME ne peut pas être nul ou vide.");
        }

        // 1. Lire la ressource et l'encoder en Base64
        String base64Data;
        try (InputStream inputStream = resource.getInputStream()) {
            byte[] bytes = StreamUtils.copyToByteArray(inputStream);
            if (bytes.length == 0) {
                throw new IllegalArgumentException("L'image de pointage fournie est vide.");
            }
            base64Data = Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            log.error("Erreur lors de la lecture du fichier pour encodage Base64", e);
            throw new BusinessException("Impossible de lire le fichier de pointage : " + e.getMessage(), e);
        }

        // 2. Construire le payload de la requête conforme à l'API Gemini
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", GeminiPrompt.ATTENDANCE_EXTRACTION_PROMPT),
                                Map.of("inlineData", Map.of(
                                        "mimeType", mimeType,
                                        "data", base64Data
                                ))
                        ))
                )
        );

        // 3. Effectuer l'appel HTTP vers l'API Gemini
        String rawResponse;
        try {
            String fullUrl = UriComponentsBuilder.fromHttpUrl(geminiProperties.getUrl())
                    .queryParam("key", geminiProperties.getKey())
                    .toUriString();

            rawResponse = geminiWebClient.post()
                    .uri(fullUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60)) // Gestion du timeout
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Erreur HTTP reçue de l'API Gemini : {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new BusinessException("Quota dépassé pour l'API Gemini. Veuillez réessayer plus tard.", e);
            }
            throw new BusinessException("L'API Gemini a retourné une erreur HTTP : " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erreur de communication avec l'API Gemini", e);
            throw new BusinessException("Erreur de communication avec l'API Gemini ou délai d'attente dépassé : " + e.getMessage(), e);
        }

        if (rawResponse == null || rawResponse.isBlank()) {
            throw new BusinessException("L'API Gemini a retourné une réponse vide.");
        }

        // 4. Extraire le texte JSON de la réponse Gemini
        String jsonText;
        try {
            JsonNode rootNode = objectMapper.readTree(rawResponse);
            JsonNode textNode = rootNode
                    .path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new BusinessException("Le format de la réponse Gemini est invalide ou le texte extrait est manquant.");
            }
            jsonText = textNode.asText();
        } catch (Exception e) {
            log.error("Impossible de parser la structure de réponse brute de Gemini. Réponse brute : {}", rawResponse, e);
            throw new BusinessException("Erreur lors de l'extraction de la structure JSON de la réponse Gemini : " + e.getMessage(), e);
        }

        // 5. Nettoyer le texte extrait (retrait des éventuels blocs de code markdown ```json ... ```)
        String cleanedJson = cleanJsonText(jsonText);

        // 6. Désérialiser le JSON textuel en AttendanceExtractionDTO
        try {
            return objectMapper.readValue(cleanedJson, AttendanceExtractionDTO.class);
        } catch (Exception e) {
            log.error("Erreur de désérialisation du JSON extrait en DTO. JSON nettoyé : {}", cleanedJson, e);
            throw new BusinessException("Le format JSON extrait par Gemini ne correspond pas au modèle attendu (AttendanceExtractionDTO) : " + e.getMessage(), e);
        }
    }

    /**
     * Nettoie les balises markdown entourant parfois le JSON retourné par Gemini.
     */
    private String cleanJsonText(String text) {
        if (text == null) {
            return "";
        }
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        return text.trim();
    }
}