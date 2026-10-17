package ma.pointage.presta.repository;

import ma.pointage.presta.model.ImagePointage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImagePointageRepository extends JpaRepository<ImagePointage, Long> {

    Optional<ImagePointage> findByIdAndPrestataireId(Long id, Long prestataireId);

    List<ImagePointage> findByPrestataireIdOrderByCreatedAtDesc(Long prestataireId);

    List<ImagePointage> findAllByOrderByCreatedAtDesc();

    Optional<ImagePointage> findByAlfrescoNodeId(String alfrescoNodeId);
}
