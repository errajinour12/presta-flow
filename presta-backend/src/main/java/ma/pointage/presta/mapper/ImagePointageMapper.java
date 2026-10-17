package ma.pointage.presta.mapper;

import ma.pointage.presta.dto.response.ImagePointageResponse;
import ma.pointage.presta.model.ImagePointage;

public final class ImagePointageMapper {

    private ImagePointageMapper() {
    }

    /**
     * Standard mapping — used by the Admin path and upload response.
     * Does not include statutGlobal or nombreJours.
     */
    public static ImagePointageResponse toResponse(ImagePointage imagePointage) {
        if (imagePointage == null) {
            return null;
        }

        return ImagePointageResponse.builder()
                .id(imagePointage.getId())
                .alfrescoNodeId(imagePointage.getAlfrescoNodeId())
                .nomOriginal(imagePointage.getNomOriginal())
                .mimeType(imagePointage.getMimeType())
                .prestataireId(
                        imagePointage.getPrestataire() != null
                                ? imagePointage.getPrestataire().getId()
                                : null
                )
                .prestataireNomComplet(
                        imagePointage.getPrestataire() != null
                                ? imagePointage.getPrestataire().getNomComplet()
                                : null
                )
                .createdAt(imagePointage.getCreatedAt())
                .build();
    }

    /**
     * Enriched mapping for the Prestataire list — includes computed statutGlobal and nombreJours.
     */
    public static ImagePointageResponse toResponse(ImagePointage imagePointage, String statutGlobal, int nombreJours) {
        if (imagePointage == null) {
            return null;
        }

        return ImagePointageResponse.builder()
                .id(imagePointage.getId())
                .alfrescoNodeId(imagePointage.getAlfrescoNodeId())
                .nomOriginal(imagePointage.getNomOriginal())
                .mimeType(imagePointage.getMimeType())
                .prestataireId(
                        imagePointage.getPrestataire() != null
                                ? imagePointage.getPrestataire().getId()
                                : null
                )
                .prestataireNomComplet(
                        imagePointage.getPrestataire() != null
                                ? imagePointage.getPrestataire().getNomComplet()
                                : null
                )
                .createdAt(imagePointage.getCreatedAt())
                .statutGlobal(statutGlobal)
                .nombreJours(nombreJours)
                .build();
    }
}
