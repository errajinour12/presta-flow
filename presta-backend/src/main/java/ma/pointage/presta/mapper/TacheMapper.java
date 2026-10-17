package ma.pointage.presta.mapper;

import ma.pointage.presta.dto.request.TacheRequest;
import ma.pointage.presta.dto.response.TacheResponse;
import ma.pointage.presta.model.Tache;
import ma.pointage.presta.model.Utilisateur;

public final class TacheMapper {

    private TacheMapper() {
    }

    public static TacheResponse toResponse(Tache tache) {

        if (tache == null) {
            return null;
        }

        return TacheResponse.builder()
                .id(tache.getId())
                .nom(tache.getNom())
                .description(tache.getDescription())
                .categorie(tache.getCategorie())
                .actif(tache.isActif())
                .createdById(
                        tache.getCreatedBy() != null
                                ? tache.getCreatedBy().getId()
                                : null
                )
                .createdByNomComplet(
                        tache.getCreatedBy() != null
                                ? tache.getCreatedBy().getNomComplet()
                                : null
                )
                .createdByRole(tache.getCreatedBy().getRole())
                .createdAt(tache.getCreatedAt())
                .updatedAt(tache.getUpdatedAt())
                .build();

    }


    public static Tache toEntity(TacheRequest request, Utilisateur createdBy) {

        if (request == null) {
            return null;
        }

        return Tache.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .categorie(request.getCategorie())
                .actif(true)
                .createdBy(createdBy)
                .build();
    }
}
