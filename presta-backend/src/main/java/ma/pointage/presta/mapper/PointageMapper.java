package ma.pointage.presta.mapper;

import ma.pointage.presta.dto.response.CreneauResponse;
import ma.pointage.presta.dto.response.PointageResponse;
import ma.pointage.presta.model.CreneauPointage;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;

import java.util.Collections;
import java.util.List;

public final class PointageMapper {

    private PointageMapper() {
    }

    public static CreneauResponse toCreneauResponse(CreneauPointage creneau) {
        if (creneau == null) {
            return null;
        }
        return CreneauResponse.builder()
                .id(creneau.getId())
                .heureEntree(creneau.getHeureEntree())
                .heureSortie(creneau.getHeureSortie())
                .ordre(creneau.getOrdre())
                .build();
    }

    public static PointageResponse toPointageResponse(Pointage pointage) {
        if (pointage == null) {
            return null;
        }

        List<CreneauResponse> creneauxResp = pointage.getCreneaux() != null
                ? pointage.getCreneaux().stream().map(PointageMapper::toCreneauResponse).toList()
                : Collections.emptyList();

        boolean isEditable = pointage.getOrigineDonnees() == OrigineDonnees.CORRIGEE
                && pointage.getStatut() == StatutPointage.EXTRAIT;

        return PointageResponse.builder()
                .id(pointage.getId())
                .date(pointage.getDate())
                .statut(pointage.getStatut())
                .origineDonnees(pointage.getOrigineDonnees())
                .pointageOrigineId(pointage.getPointageOrigine() != null ? pointage.getPointageOrigine().getId() : null)
                .dayType(pointage.getDayType())
                .motifRejet(pointage.getMotifRejet())
                .imagePointageId(pointage.getImagePointage() != null ? pointage.getImagePointage().getId() : null)
                .editable(isEditable)
                .creneaux(creneauxResp)
                .build();
    }
}
