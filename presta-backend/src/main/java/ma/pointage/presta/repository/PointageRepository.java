package ma.pointage.presta.repository;

import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.enums.StatutPointage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PointageRepository extends JpaRepository<Pointage, Long> {

    /**
     * Finds the existing CORRIGEE pointage linked to a specific BRUT pointage (pointageOrigine).
     */
    Optional<Pointage> findByPointageOrigineId(Long pointageOrigineId);

    /**
     * Finds all pointages for an image owned by a specific prestataire.
     */
    List<Pointage> findByImagePointageIdAndPrestataireId(Long imagePointageId, Long prestataireId);

    /**
     * Finds all pointages for an image.
     */
    List<Pointage> findByImagePointageId(Long imagePointageId);

    /**
     * Finds a pointage by id and prestataire id.
     */
    Optional<Pointage> findByIdAndPrestataireId(Long id, Long prestataireId);

    /**
     * Finds distinct ImagePointage entities having pointages with the given status.
     */
    @Query("SELECT DISTINCT p.imagePointage FROM Pointage p WHERE p.statut = :statut")
    List<ma.pointage.presta.model.ImagePointage> findDistinctImagePointageByStatut(@Param("statut") StatutPointage statut);

    /**
     * Finds pointages for an image matching the specified status.
     */
    List<Pointage> findByImagePointageIdAndStatut(Long imagePointageId, StatutPointage statut);

    /**
     * Finds pointages for a prestataire in a given date range with eagerly loaded time slots.
     */
    @Query("SELECT DISTINCT p FROM Pointage p LEFT JOIN FETCH p.creneaux WHERE p.prestataire.id = :prestataireId AND p.date >= :startDate AND p.date <= :endDate ORDER BY p.date ASC")
    List<Pointage> findByPrestataireIdAndDateBetweenWithCreneaux(
            @Param("prestataireId") Long prestataireId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<Pointage> findByPrestataireId(Long prestataireId);
}
