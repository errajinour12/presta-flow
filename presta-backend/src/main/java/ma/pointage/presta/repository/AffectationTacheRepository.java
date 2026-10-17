package ma.pointage.presta.repository;

import ma.pointage.presta.model.AffectationTache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AffectationTacheRepository extends JpaRepository<AffectationTache, Long> {

    List<AffectationTache> findByPrestataireId(Long prestataireId);

    List<AffectationTache> findByTacheId(Long tacheId);

    boolean existsByPrestataireIdAndTacheId(Long prestataireId, Long tacheId);
}
