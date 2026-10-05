package services;

import models.Buyer;
import models.User;
import models.Language;
import models.UserStatus;
import com.landhub.exception.ApiException;
import data.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final UserRepository userRepo;
    private final BuyerRepository buyerRepo;
    private final BookingRepository bookingRepo;
    private final PaymentRepository paymentRepo;
    private final InquiryRepository inquiryRepo;
    private final LandRepository landRepo;

    public List<Map<String, Object>> list(String status, String q, Integer limit, Integer offset) {
        List<User> users = userRepo.findAll();
        // Filter by status and search query q
        String qLower = q != null ? q.trim().toLowerCase() : null;
        String statusUpper = status != null ? status.trim().toUpperCase() : null;

        List<User> filtered = users.stream().filter(u -> {
            if (statusUpper != null && !statusUpper.isBlank()) {
                if (u.getStatus() == null || !u.getStatus().name().equalsIgnoreCase(statusUpper)) return false;
            }
            if (qLower != null && !qLower.isBlank()) {
                boolean nameMatch = u.getFullName() != null && u.getFullName().toLowerCase().contains(qLower);
                boolean emailMatch = u.getEmail() != null && u.getEmail().toLowerCase().contains(qLower);
                if (!nameMatch && !emailMatch) return false;
            }
            return true;
        }).sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())).toList();

        int off = offset != null ? Math.max(0, offset) : 0;
        int lim = limit != null && limit > 0 ? limit : 50;

        return filtered.stream().skip(off).limit(lim).map(this::toPublicMap).toList();
    }

    public long count(String status, String q) {
        return list(status, q, Integer.MAX_VALUE, 0).size();
    }

    public Map<String, Object> findById(Long id) {
        User user = userRepo.findById(id).orElse(null);
        if (user == null) return null;

        Map<String, Object> result = toPublicMap(user);

        // Buyer profile extra
        buyerRepo.findByUserId(id).ifPresent(b -> {
            Map<String, Object> bm = new LinkedHashMap<>();
            bm.put("id", b.getId());
            bm.put("user_id", b.getUserId());
            bm.put("preferred_district", b.getPreferredDistrict());
            bm.put("budget_max", b.getBudgetMax());
            result.put("buyer", bm);
        });

        // Reservation history
        List<Map<String, Object>> reservations = bookingRepo.findByBuyerIdOrderByCreatedAtDesc(id)
                .stream().limit(20).map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", b.getId());
                    m.put("status", b.getStatus() != null ? b.getStatus().name() : null);
                    m.put("created_at", b.getCreatedAt().toString());
                    m.put("preferred_date", b.getPreferredDate());
                    landRepo.findById(b.getLandId()).ifPresent(l -> {
                        m.put("land_title", l.getTitle());
                        m.put("district", l.getDistrict());
                    });
                    return m;
                }).toList();
        result.put("reservations", reservations);

        // Payment history
        List<Map<String, Object>> payments = paymentRepo.findByPayerIdOrderByCreatedAtDesc(id)
                .stream().limit(20).map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("amount", p.getAmount());
                    m.put("method", p.getMethod() != null ? p.getMethod().name() : null);
                    m.put("status", p.getStatus() != null ? p.getStatus().name() : null);
                    m.put("invoice_no", p.getInvoiceNo());
                    m.put("created_at", p.getCreatedAt().toString());
                    bookingRepo.findById(p.getBookingId()).ifPresent(bk ->
                            landRepo.findById(bk.getLandId()).ifPresent(l ->
                                    m.put("land_title", l.getTitle())));
                    return m;
                }).toList();
        result.put("payments", payments);

        // Inquiry history
        List<Map<String, Object>> inquiries = inquiryRepo.findByCustomerIdOrderByUpdatedAtDesc(id)
                .stream().limit(20).map(inq -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", inq.getId());
                    m.put("subject", inq.getSubject());
                    m.put("category", inq.getCategory());
                    m.put("status", inq.getStatus());
                    m.put("created_at", inq.getCreatedAt().toString());
                    m.put("updated_at", inq.getUpdatedAt().toString());
                    return m;
                }).toList();
        result.put("inquiries", inquiries);

        return result;
    }

    @Transactional
    public Map<String, Object> update(Long id, Map<String, Object> dto) {
        User user = userRepo.findById(id).orElseThrow(() -> ApiException.notFound("Customer not found"));

        if (dto.containsKey("full_name") && dto.get("full_name") != null) {
            user.setFullName((String) dto.get("full_name"));
        }
        if (dto.containsKey("phone")) {
            user.setPhone((String) dto.get("phone"));
        }
        if (dto.containsKey("nic")) {
            user.setNic((String) dto.get("nic"));
        }
        if (dto.containsKey("language") && dto.get("language") != null) {
            try {
                user.setLanguage(Language.valueOf(((String) dto.get("language")).toLowerCase()));
            } catch (Exception ignored) {}
        }
        if (dto.containsKey("status") && dto.get("status") != null) {
            try {
                user.setStatus(UserStatus.valueOf(((String) dto.get("status")).toUpperCase()));
            } catch (Exception ignored) {}
        }

        userRepo.save(user);
        return toPublicMap(user);
    }

    @Transactional
    public Map<String, Object> setStatus(Long id, String status) {
        User user = userRepo.findById(id).orElseThrow(() -> ApiException.notFound("Customer not found"));
        try {
            user.setStatus(UserStatus.valueOf(status.toUpperCase()));
            userRepo.save(user);
            return toPublicMap(user);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid status: " + status);
        }
    }

    public Map<String, Object> stats() {
        long total = userRepo.count();
        long active = userRepo.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long suspended = userRepo.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.SUSPENDED).count();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long newCustomers = userRepo.findAll().stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(thirtyDaysAgo)).count();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("total", total);
        map.put("active", active);
        map.put("suspended", suspended);
        map.put("new_last_30_days", newCustomers);
        return map;
    }

    private Map<String, Object> toPublicMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("full_name", u.getFullName());
        m.put("email", u.getEmail());
        m.put("phone", u.getPhone());
        m.put("role", u.getRole() != null ? u.getRole().name() : null);
        m.put("nic", u.getNic());
        m.put("avatar", u.getAvatar());
        m.put("language", u.getLanguage() != null ? u.getLanguage().name() : "en");
        m.put("status", u.getStatus() != null ? u.getStatus().name() : "ACTIVE");
        m.put("created_at", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        return m;
    }
}

