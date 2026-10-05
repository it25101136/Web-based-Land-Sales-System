package data;

import models.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByUserId(Long userId);
    boolean existsByUserId(Long userId);

    @Modifying
    @Query("UPDATE Seller s SET s.ratingAvg = :avg, s.ratingCount = :count WHERE s.userId = :userId")
    void updateRating(Long userId, BigDecimal avg, Integer count);
}

