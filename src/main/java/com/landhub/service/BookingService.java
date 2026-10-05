package com.landhub.service;

import com.landhub.entity.*;
import com.landhub.entity.enums.*;
import com.landhub.exception.ApiException;
import com.landhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepo;
    private final LandRepository landRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> create(Long buyerId, Map<String, Object> dto) {
        Long landId = toLong(dto.get("land_id"));
        Land land = landRepo.findById(landId).orElseThrow(() -> ApiException.notFound("Land listing not found"));

        boolean dup = bookingRepo.existsByLandIdAndBuyerIdAndStatusIn(landId, buyerId,
                List.of(BookingStatus.PENDING, BookingStatus.APPROVED));
        if (dup) throw ApiException.conflict("You already have an active reservation for this property");

        String contactNo = (String) dto.get("contact_no");
        if (contactNo != null && !contactNo.matches("^(?:\\+94|0)\\s?\\d{2}\\s?\\d{3}\\s?\\d{4}$")) {
            throw ApiException.badRequest("Validation failed", Map.of("contact_no", "Must be a Sri Lankan number (+94 XX XXX XXXX)"));
        }

        java.time.LocalDate prefDate = null;
        if (dto.get("preferred_date") != null) {
            try { prefDate = java.time.LocalDate.parse(dto.get("preferred_date").toString()); } catch (Exception ignored) {}
        }

        Booking b = bookingRepo.save(Booking.builder()
                .landId(landId).buyerId(buyerId).sellerId(land.getSellerId())
                .buyerName((String) dto.get("buyer_name")).contactNo(contactNo)
                .email((String) dto.get("email")).preferredDate(prefDate)
                .message((String) dto.get("message")).status(BookingStatus.PENDING)
                .build());

        notificationService.push(land.getSellerId(), "RESERVATION_RECEIVED", "New reservation request",
                "A buyer requested a visit to \"" + land.getTitle() + "\".", "/seller");

        return bookingToMap(b);
    }

    @Transactional
    public Map<String, Object> updateStatus(Long bookingId, Long userId, String userRole, String newStatus) {
        Booking b = bookingRepo.findById(bookingId).orElseThrow(() -> ApiException.notFound("Booking not found"));
        BookingStatus target = BookingStatus.valueOf(newStatus.toUpperCase());

        boolean isSeller = b.getSellerId().equals(userId);
        boolean isBuyer = b.getBuyerId().equals(userId);
        boolean isAdmin = "ADMIN".equals(userRole);

        if (target == BookingStatus.APPROVED && !isSeller && !isAdmin)
            throw ApiException.forbidden("Only the seller or admin can approve reservations");
        if (target == BookingStatus.REJECTED && !isSeller && !isAdmin)
            throw ApiException.forbidden("Only the seller or admin can reject reservations");
        if (target == BookingStatus.CANCELLED && !isBuyer && !isAdmin)
            throw ApiException.forbidden("Only the buyer or admin can cancel");

        b.setStatus(target);
        bookingRepo.save(b);

        if (target == BookingStatus.APPROVED) {
            landRepo.updateStatus(b.getLandId(), LandStatus.RESERVED);
            notificationService.push(b.getBuyerId(), "RESERVATION_APPROVED", "Reservation approved!",
                    "Your reservation has been approved. Please arrange the site visit.", "/buyer");
        } else if (target == BookingStatus.REJECTED || target == BookingStatus.CANCELLED) {
            landRepo.updateStatus(b.getLandId(), LandStatus.ACTIVE);
        }

        return bookingToMap(b);
    }

    public List<Map<String, Object>> listFor(Long userId, String role) {
        List<Booking> bookings;
        if ("ADMIN".equals(role)) {
            bookings = bookingRepo.findAllByOrderByCreatedAtDesc();
        } else {
            bookings = bookingRepo.findByBuyerIdOrSellerIdOrderByCreatedAtDesc(userId);
        }
        return bookings.stream().map(b -> {
            Map<String, Object> m = bookingToMap(b);
            landRepo.findById(b.getLandId()).ifPresent(l -> {
                m.put("land_title", l.getTitle());
                m.put("district", l.getDistrict());
                m.put("city", l.getCity());
                m.put("price", l.getPrice());
            });
            m.putIfAbsent("land_title", "Land #" + b.getLandId());
            m.putIfAbsent("district", "");
            m.putIfAbsent("city", "");
            m.putIfAbsent("price", java.math.BigDecimal.ZERO);

            userRepo.findById(b.getBuyerId()).ifPresent(u -> m.put("buyer_name", u.getFullName()));
            userRepo.findById(b.getSellerId()).ifPresent(u -> {
                m.put("seller_name", u.getFullName());
                m.put("seller_full_name", u.getFullName());
            });
            m.putIfAbsent("seller_name", "Seller");
            m.putIfAbsent("seller_full_name", "Seller");
            return m;
        }).toList();
    }

    private Map<String, Object> bookingToMap(Booking b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId()); m.put("land_id", b.getLandId()); m.put("buyer_id", b.getBuyerId());
        m.put("seller_id", b.getSellerId()); m.put("buyer_name", b.getBuyerName() != null ? b.getBuyerName() : "");
        m.put("contact_no", b.getContactNo() != null ? b.getContactNo() : "");
        m.put("email", b.getEmail() != null ? b.getEmail() : "");
        m.put("preferred_date", b.getPreferredDate() != null ? b.getPreferredDate().toString() : null);
        m.put("message", b.getMessage()); m.put("status", b.getStatus().name());
        m.put("created_at", b.getCreatedAt() != null ? b.getCreatedAt().toString() : "");
        return m;
    }

    private static long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }
}
