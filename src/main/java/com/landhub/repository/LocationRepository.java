package com.landhub.repository;

import com.landhub.entity.Location;
import com.landhub.entity.enums.LocationLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByLevel(LocationLevel level);
    List<Location> findByParentId(Long parentId);
}
