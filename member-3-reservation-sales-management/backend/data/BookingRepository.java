package data;

import models.Booking;
import models.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT b FROM Booking b WHERE b.buyerId = :userId OR b.sellerId = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByBuyerIdOrSellerIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    boolean existsByLandIdAndBuyerIdAndStatusIn(Long landId, Long buyerId, List<BookingStatus> statuses);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.buyerId = :buyerId AND b.sellerId = :sellerId AND b.status IN ('APPROVED','COMPLETED')")
    long countEligibleForReview(Long buyerId, Long sellerId);

    long countByBuyerIdAndStatusIn(Long buyerId, List<BookingStatus> statuses);
    long countByBuyerIdAndStatus(Long buyerId, BookingStatus status);
    long countBySellerId(Long sellerId);
    long countByStatus(BookingStatus status);
}

