package data;

import models.Location;
import models.LocationLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByLevel(LocationLevel level);
    List<Location> findByParentId(Long parentId);
}

