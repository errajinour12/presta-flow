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
public class ProcessedSubmissionResponse {
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
    private String statutGlobal; // "VALIDE", "REJETE", "PARTIEL"
    private LocalDateTime dateImport;
    private LocalDateTime dateTraitement;
    private String traiteParAdminNom;
}
