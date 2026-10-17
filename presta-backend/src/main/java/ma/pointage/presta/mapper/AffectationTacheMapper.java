package ma.pointage.presta.mapper;

import ma.pointage.presta.dto.request.AffectationTacheRequest;
import ma.pointage.presta.dto.response.AffectationTacheResponse;
import ma.pointage.presta.model.AffectationTache;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.Tache;

public final class AffectationTacheMapper {

    private AffectationTacheMapper() {
    }

    /**
     * Convertit une entité {AffectationTache} en DTO de réponse.
     */
    public static AffectationTacheResponse toResponse(AffectationTache affectation) {
        if (affectation == null) {
            return null;
        }

        return AffectationTacheResponse.builder()
                .id(affectation.getId())
                .tacheId(affectation.getTache() != null ? affectation.getTache().getId() : null)
                .tacheNom(affectation.getTache() != null ? affectation.getTache().getNom() : null)
                .prestataireId(affectation.getPrestataire() != null ? affectation.getPrestataire().getId() : null)
                .prestataireNomComplet(affectation.getPrestataire() != null ? affectation.getPrestataire().getNomComplet() : null)
                .statut(affectation.getStatut())
                .dateDebut(affectation.getDateDebut())
                .dateFin(affectation.getDateFin())
                .createdAt(affectation.getCreatedAt())
                .updatedAt(affectation.getUpdatedAt())
                .build();
    }

    /**
     * Convertit un DTO {AffectationTacheRequest} en entité {AffectationTache}.
     */
    public static AffectationTache toEntity(AffectationTacheRequest request, Tache tache, Prestataire prestataire) {
        if (request == null) {
            return null;
        }

        return AffectationTache.builder()
                .tache(tache)
                .prestataire(prestataire)
                .build();
    }
}
