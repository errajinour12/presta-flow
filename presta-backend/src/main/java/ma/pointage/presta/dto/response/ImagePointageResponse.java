package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImagePointageResponse {

    private Long id;
    private String alfrescoNodeId;
    private String nomOriginal;
    private String mimeType;
    private Long prestataireId;
    private String prestataireNomComplet;
    private LocalDateTime createdAt;

    /** Statut global calculé depuis les pointages actifs (CORRIGEE ?? BRUT) de cette image. */
    private String statutGlobal;

    /** Nombre de journées distinctes (dates) parmi les pointages actifs. */
    private int nombreJours;
}
