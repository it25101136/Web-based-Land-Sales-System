package data;

import models.LandImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LandImageRepository extends JpaRepository<LandImage, Long> {
    List<LandImage> findByLandIdOrderByIsCoverDescSortOrderAsc(Long landId);
    List<LandImage> findByLandIdOrderBySortOrderAsc(Long landId);
    void deleteByLandId(Long landId);
}

