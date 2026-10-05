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
public class UserService {

    private final UserRepository userRepo;
    private final BuyerRepository buyerRepo;
    private final SellerRepository sellerRepo;
    private final AgentRepository agentRepo;
    private final BookingRepository bookingRepo;
    private final PaymentRepository paymentRepo;
    private final WishlistRepository wishlistRepo;
    private final ReviewRepository reviewRepo;
    private final MessageRepository messageRepo;
    private final AuthService authService;

    public Map<String, Object> profile(Long userId) {
        User user = userRepo.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        Map<String, Object> m = authService.userToMap(user);

        if (user.getRole() == Role.BUYER) {
            buyerRepo.findByUserId(userId).ifPresent(b -> {
                m.put("preferred_district", b.getPreferredDistrict());
                m.put("budget_max", b.getBudgetMax());
            });
        }
        if (user.getRole() == Role.SELLER) {
            sellerRepo.findByUserId(userId).ifPresent(s -> {
                m.put("company_name", s.getCompanyName());
                m.put("business_reg_no", s.getBusinessRegNo());
                m.put("rating_avg", s.getRatingAvg());
                m.put("rating_count", s.getRatingCount());
                m.put("verified", s.getVerified());
            });
        }
        if (user.getRole() == Role.AGENT) {
            agentRepo.findByUserId(userId).ifPresent(a -> {
                m.put("agency_name", a.getAgencyName());
                m.put("licence_no", a.getLicenceNo());
                m.put("service_districts", a.getServiceDistricts());
                m.put("commission_pct", a.getCommissionPct());
            });
        }
        return m;
    }

    @Transactional
    public Map<String, Object> updateProfile(Long userId, Map<String, Object> patch) {
        User user = userRepo.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (patch.containsKey("full_name")) user.setFullName(patch.get("full_name").toString());
        if (patch.containsKey("phone")) user.setPhone(patch.get("phone").toString());
        if (patch.containsKey("nic")) user.setNic(patch.get("nic").toString());
        if (patch.containsKey("avatar")) user.setAvatar(patch.get("avatar").toString());
        if (patch.containsKey("language")) user.setLanguage(Language.valueOf(patch.get("language").toString()));
        userRepo.save(user);

        if (user.getRole() == Role.BUYER && patch.containsKey("preferred_district")) {
            buyerRepo.findByUserId(userId).ifPresent(b -> {
                b.setPreferredDistrict(patch.get("preferred_district").toString());
                if (patch.containsKey("budget_max")) b.setBudgetMax(new java.math.BigDecimal(patch.get("budget_max").toString()));
                buyerRepo.save(b);
            });
        }
        if (user.getRole() == Role.SELLER && patch.containsKey("company_name")) {
            sellerRepo.findByUserId(userId).ifPresent(s -> {
                s.setCompanyName(patch.get("company_name").toString());
                sellerRepo.save(s);
            });
        }
        return profile(userId);
    }

    public Map<String, Object> dashboard(Long userId) {
        Map<String, Object> d = new LinkedHashMap<>();
        long saved = wishlistRepo.findByUserIdOrderByCreatedAtDesc(userId).size();
        long activeReservations = bookingRepo.countByBuyerIdAndStatusIn(userId, List.of(BookingStatus.PENDING, BookingStatus.APPROVED));
        long completedPurchases = bookingRepo.countByBuyerIdAndStatus(userId, BookingStatus.COMPLETED);
        if (completedPurchases == 0) {
            completedPurchases = paymentRepo.countByPayerId(userId);
        }
        long unreadMessages = messageRepo.countByReceiverIdAndIsReadFalse(userId);
        long reviews = reviewRepo.countByBuyerId(userId);

        d.put("saved", saved);
        d.put("wishlist", saved);
        d.put("active_reservations", activeReservations);
        d.put("bookings", activeReservations);
        d.put("completed_purchases", completedPurchases);
        d.put("payments", completedPurchases);
        d.put("unread_messages", unreadMessages);
        d.put("reviews", reviews);
        return d;
    }

    public Map<String, Object> publicSellerProfile(Long sellerId) {
        User user = userRepo.findById(sellerId).orElseThrow(() -> ApiException.notFound("Seller not found"));
        if (user.getRole() != Role.SELLER) throw ApiException.notFound("Seller not found");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", user.getId());
        m.put("full_name", user.getFullName());
        m.put("avatar", user.getAvatar());
        m.put("created_at", user.getCreatedAt().toString());
        sellerRepo.findByUserId(sellerId).ifPresent(s -> {
            m.put("company_name", s.getCompanyName());
            m.put("rating_avg", s.getRatingAvg());
            m.put("rating_count", s.getRatingCount());
            m.put("verified", s.getVerified());
        });
        return m;
    }
}
