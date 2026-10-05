package data;

import models.Review;
import models.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findBySellerIdAndStatusOrderByCreatedAtDesc(Long sellerId, ReviewStatus status);

    List<Review> findByStatusOrderByCreatedAtAsc(ReviewStatus status);

    @Query("SELECT r FROM Review r WHERE r.buyerId = :userId OR r.sellerId = :userId ORDER BY r.createdAt DESC")
    List<Review> findForUser(Long userId);

    List<Review> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(r), COALESCE(AVG(r.rating),0) FROM Review r WHERE r.sellerId = :sellerId AND r.status = 'APPROVED'")
    Object[] sellerRatingStats(Long sellerId);

    long countByBuyerId(Long buyerId);
    long countBySellerIdAndStatus(Long sellerId, ReviewStatus status);
    long countByStatus(ReviewStatus status);
}

