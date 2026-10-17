package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.gemini.AttendanceExtractionDTO;
import ma.pointage.presta.dto.gemini.AttendanceRecordDTO;
import ma.pointage.presta.dto.gemini.TimeSlotDTO;
import ma.pointage.presta.model.CreneauPointage;
import ma.pointage.presta.model.ImagePointage;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;
import ma.pointage.presta.repository.PointageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendancePersistenceService {

    private final PointageRepository pointageRepository;

    /**
     * Persists the data extracted by Gemini.
     */
    @Transactional
    public void persistExtraction(AttendanceExtractionDTO extraction,
                                  ImagePointage image,
                                  Prestataire prestataire) {
        List<Pointage> pointages = new ArrayList<>();
        for (AttendanceRecordDTO record : extraction.getAttendanceRecords()) {
            // Build Pointage
            Pointage pointage = Pointage.builder()
                    .date(record.getDate())
                    .dayType(record.getDayType())
                    .origineDonnees(OrigineDonnees.BRUT)
                    .statut(StatutPointage.EXTRAIT)
                    .pointageOrigine(null)
                    .traitePar(null)
                    .motifRejet(null)
                    .prestataire(prestataire)
                    .imagePointage(image)
                    .build();

            // Build CreneauPointage list (may be empty)
            List<CreneauPointage> creneaux = new ArrayList<>();
            if (record.getTimeSlots() != null) {
                for (TimeSlotDTO slot : record.getTimeSlots()) {
                    CreneauPointage c = CreneauPointage.builder()
                            .heureEntree(slot.getCheckInTime())
                            .heureSortie(slot.getCheckOutTime())
                            .ordre(creneaux.size() + 1)
                            .pointage(pointage)
                            .build();
                    creneaux.add(c);
                }
            }
            pointage.setCreneaux(creneaux);
            pointages.add(pointage);
        }
        // Batch persist all pointages (cascades persist creneaux)
        pointageRepository.saveAll(pointages);
    }
}
