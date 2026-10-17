package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingSubmissionResponse {

    private Long imageId;
    private String alfrescoNodeId;
    private String nomOriginal;
    private String mimeType;
    private Long prestataireId;
    private String prestataireNomComplet;
    private String prestataireMatricule;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private int nombreJours;
    private int nombrePointages;
    private LocalDateTime createdAt;
}
