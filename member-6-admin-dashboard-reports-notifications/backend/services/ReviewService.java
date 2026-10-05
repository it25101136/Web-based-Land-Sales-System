package services;

import models.Review;
import models.ReviewStatus;
import com.landhub.exception.ApiException;
import data.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepo;
    private final BookingRepository bookingRepo;
    private final SellerRepository sellerRepo;
    private final UserRepository userRepo;
    private final LandRepository landRepo;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> create(Long buyerId, Map<String, Object> dto) {
        Long sellerId = toLong(dto.get("seller_id"));
        int rating = toInt(dto.get("rating"));
        if (rating < 1 || rating > 5) throw ApiException.badRequest("Validation failed",
                Map.of("rating", "Rating must be between 1 and 5"));

        long eligible = bookingRepo.countEligibleForReview(buyerId, sellerId);
        if (eligible == 0) throw ApiException.forbidden("You need an approved/completed reservation with this seller to leave a review");

        Review r = reviewRepo.save(Review.builder()
                .landId(dto.get("land_id") != null ? toLong(dto.get("land_id")) : null)
                .sellerId(sellerId).buyerId(buyerId)
                .rating(rating).comment((String) dto.get("comment"))
                .status(ReviewStatus.PENDING).build());

        notificationService.push(sellerId, "REVIEW_RECEIVED", "New review received",
                "A buyer left a " + rating + "-star review.", "/seller");

        return reviewToMap(r);
    }

    @Transactional
    public Map<String, Object> moderate(Long reviewId, String status) {
        Review r = reviewRepo.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review not found"));
        r.setStatus(ReviewStatus.valueOf(status.toUpperCase()));
        reviewRepo.save(r);

        if (r.getStatus() == ReviewStatus.APPROVED) recalcRating(r.getSellerId());
        return reviewToMap(r);
    }

    public Map<String, Object> listForSeller(Long sellerId) {
        List<Review> reviews = reviewRepo.findBySellerIdAndStatusOrderByCreatedAtDesc(sellerId, ReviewStatus.APPROVED);
        Object[] stats = reviewRepo.sellerRatingStats(sellerId);
        long count = stats[0] != null ? ((Number) stats[0]).longValue() : 0;
        double avg = stats[1] != null ? ((Number) stats[1]).doubleValue() : 0;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("count", count);
        m.put("average", Math.round(avg * 100.0) / 100.0);
        m.put("items", reviews.stream().map(r -> {
            Map<String, Object> rm = reviewToMap(r);
            userRepo.findById(r.getBuyerId()).ifPresent(u -> rm.put("buyer_name", u.getFullName()));
            return rm;
        }).toList());
        return m;
    }

    public List<Map<String, Object>> pending() {
        return reviewRepo.findByStatusOrderByCreatedAtAsc(ReviewStatus.PENDING).stream().map(this::enrichReview).toList();
    }

    public List<Map<String, Object>> forUser(Long userId, String role) {
        List<Review> reviews;
        if ("ADMIN".equals(role)) reviews = reviewRepo.findAllByOrderByCreatedAtDesc();
        else reviews = reviewRepo.findForUser(userId);
        return reviews.stream().map(this::enrichReview).toList();
    }

    private void recalcRating(Long sellerId) {
        Object[] stats = reviewRepo.sellerRatingStats(sellerId);
        long count = stats[0] != null ? ((Number) stats[0]).longValue() : 0;
        double avg = stats[1] != null ? ((Number) stats[1]).doubleValue() : 0;
        sellerRepo.updateRating(sellerId, BigDecimal.valueOf(avg), (int) count);
    }

    private Map<String, Object> enrichReview(Review r) {
        Map<String, Object> m = reviewToMap(r);
        userRepo.findById(r.getBuyerId()).ifPresent(u -> m.put("buyer_name", u.getFullName()));
        userRepo.findById(r.getSellerId()).ifPresent(u -> m.put("seller_name", u.getFullName()));
        if (r.getLandId() != null) {
            landRepo.findById(r.getLandId()).ifPresent(l -> m.put("land_title", l.getTitle()));
        }
        m.putIfAbsent("buyer_name", "Buyer #" + r.getBuyerId());
        m.putIfAbsent("seller_name", "Seller #" + r.getSellerId());
        m.putIfAbsent("land_title", "");
        return m;
    }

    private Map<String, Object> reviewToMap(Review r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId()); m.put("land_id", r.getLandId()); m.put("seller_id", r.getSellerId());
        m.put("buyer_id", r.getBuyerId()); m.put("rating", r.getRating()); m.put("comment", r.getComment());
        m.put("status", r.getStatus().name()); m.put("created_at", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        return m;
    }

    private static long toLong(Object v) { if (v == null) return 0; if (v instanceof Number n) return n.longValue(); try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; } }
    private static int toInt(Object v) { if (v == null) return 0; if (v instanceof Number n) return n.intValue(); try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 0; } }
}

