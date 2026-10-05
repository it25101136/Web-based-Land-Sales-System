package data;

import models.Land;
import models.LandStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LandRepository extends JpaRepository<Land, Long>, JpaSpecificationExecutor<Land> {

    @Modifying
    @Query("UPDATE Land l SET l.views = l.views + 1 WHERE l.id = :id")
    void incrementViews(Long id);

    @Modifying
    @Query("UPDATE Land l SET l.status = :status WHERE l.id = :id")
    void updateStatus(Long id, LandStatus status);

    @Query("SELECT l FROM Land l WHERE l.status = com.landhub.entity.enums.LandStatus.ACTIVE AND l.id <> :id AND (l.district = :district OR l.landType = :landType)")
    List<Land> findSimilarCandidates(@org.springframework.data.repository.query.Param("id") Long id,
                                    @org.springframework.data.repository.query.Param("district") String district,
                                    @org.springframework.data.repository.query.Param("landType") com.landhub.entity.enums.LandType landType,
                                    Pageable pageable);

    @Query("SELECT l.district, l.province, COUNT(l), COALESCE(AVG(l.pricePerPerch),0) FROM Land l WHERE l.status IN ('ACTIVE','RESERVED') GROUP BY l.district, l.province")
    List<Object[]> districtCounts();

    long countBySellerId(Long sellerId);
    long countBySellerIdAndStatus(Long sellerId, LandStatus status);
    long countByStatus(LandStatus status);

    @Query("SELECT COALESCE(SUM(l.views),0) FROM Land l WHERE l.sellerId = :sellerId")
    long sumViewsBySellerId(Long sellerId);
}

