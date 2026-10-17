package ma.pointage.presta.repository;

import ma.pointage.presta.model.Rapport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RapportRepository extends JpaRepository<Rapport, Long> {

    List<Rapport> findByPrestataireIdOrderByCreatedAtDesc(Long prestataireId);

    Optional<Rapport> findByIdAndPrestataireId(Long id, Long prestataireId);

    List<Rapport> findAllByOrderByCreatedAtDesc();
}
