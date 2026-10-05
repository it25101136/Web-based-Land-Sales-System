package data;

import models.LandDocument;
import models.Verification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LandDocumentRepository extends JpaRepository<LandDocument, Long> {
    List<LandDocument> findByLandIdOrderByCreatedAtDesc(Long landId);
    List<LandDocument> findByStatusOrderByCreatedAtAsc(Verification status);
    List<LandDocument> findByUploadedByOrderByCreatedAtDesc(Long uploadedBy);
    List<LandDocument> findAllByOrderByCreatedAtDesc();
    long countByStatus(Verification status);
}

