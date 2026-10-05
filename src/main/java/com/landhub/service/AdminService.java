package com.landhub.service;

import com.landhub.entity.*;
import com.landhub.entity.enums.*;
import com.landhub.exception.ApiException;
import com.landhub.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepo;
    private final BuyerRepository buyerRepo;
    private final SellerRepository sellerRepo;
    private final AgentRepository agentRepo;
    private final LandRepository landRepo;
    private final LandImageRepository imageRepo;
    private final LandDocumentRepository docRepo;
    private final BookingRepository bookingRepo;
    private final PaymentRepository paymentRepo;
    private final ReviewRepository reviewRepo;
    private final ReportRepository reportRepo;
    private final InquiryRepository inquiryRepo;
    private final InquiryService inquiryService;
    private final MessageRepository messageRepo;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public Map<String, Object> overview() {
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("properties", landRepo.count());
        totals.put("active", landRepo.countByStatus(LandStatus.ACTIVE));
        totals.put("pending", landRepo.countByStatus(LandStatus.PENDING));
        totals.put("sold", landRepo.countByStatus(LandStatus.SOLD));
        totals.put("users", userRepo.count());

        Map<String, Long> roles = new LinkedHashMap<>();
        userRepo.countByRoleGrouped().forEach(r -> roles.put(r[0].toString(), ((Number) r[1]).longValue()));
        totals.put("buyers", roles.getOrDefault("BUYER", 0L));
        totals.put("sellers", roles.getOrDefault("SELLER", 0L));
        totals.put("agents", roles.getOrDefault("AGENT", 0L));
        totals.put("admins", roles.getOrDefault("ADMIN", 0L));
        totals.put("support_staff", roles.getOrDefault("SUPPORT", 0L));

        totals.put("reservations", bookingRepo.count());
        totals.put("pending_documents", docRepo.countByStatus(Verification.PENDING));
        totals.put("pending_reviews", reviewRepo.countByStatus(ReviewStatus.PENDING));
        totals.put("revenue", paymentRepo.totalSuccessfulRevenue());

        Map<String, Object> inqStats = inquiryService.stats();
        totals.put("total_inquiries", inqStats.get("total"));
        totals.put("open_inquiries", inqStats.get("open"));
        totals.put("pending_inquiries", inqStats.get("pending_clarification"));
        totals.put("resolved_inquiries", inqStats.get("resolved"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totals", totals);
        result.put("users_by_role", roles);
        return result;
    }

    public Map<String, Object> analytics() {
        Map<String, Object> result = new LinkedHashMap<>();

        // Popular districts
        List<Map<String, Object>> districts = new ArrayList<>();
        landRepo.districtCounts().forEach(r -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("district", r[0]);
            d.put("province", r[1]);
            d.put("c", ((Number) r[2]).longValue());
            d.put("avg_ppp", ((Number) r[3]).longValue());
            districts.add(d);
        });
        districts.sort((a, b) -> Long.compare((long) b.get("c"), (long) a.get("c")));
        result.put("popular_districts", districts);

        // Monthly listings - last 6 months
        List<Map<String, Object>> monthly = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime start = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            long count = landRepo.findAll().stream().filter(l ->
                    l.getCreatedAt() != null && l.getCreatedAt().isAfter(start) && l.getCreatedAt().isBefore(start.plusMonths(1))
            ).count();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("m", start.format(DateTimeFormatter.ofPattern("yyyy-MM")));
            m.put("c", count);
            monthly.add(m);
        }
        result.put("monthly_listings", monthly);

        // Monthly sales
        List<Map<String, Object>> monthlySales = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime start = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            long count = bookingRepo.findAll().stream().filter(b ->
                    b.getStatus() == BookingStatus.COMPLETED &&
                    b.getCreatedAt() != null && b.getCreatedAt().isAfter(start) && b.getCreatedAt().isBefore(start.plusMonths(1))
            ).count();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("m", start.format(DateTimeFormatter.ofPattern("yyyy-MM")));
            m.put("c", count);
            monthlySales.add(m);
        }
        result.put("monthly_sales", monthlySales);

        // Monthly revenue
        List<Map<String, Object>> monthlyRev = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime start = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            BigDecimal sum = paymentRepo.findAll().stream().filter(p ->
                    p.getStatus() == PaymentStatus.SUCCESSFUL &&
                    p.getCreatedAt() != null && p.getCreatedAt().isAfter(start) && p.getCreatedAt().isBefore(start.plusMonths(1))
            ).map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("m", start.format(DateTimeFormatter.ofPattern("yyyy-MM")));
            m.put("s", sum);
            monthlyRev.add(m);
        }
        result.put("monthly_revenue", monthlyRev);

        // Popular types
        Map<String, Long> types = new LinkedHashMap<>();
        for (Land l : landRepo.findAll()) {
            if (l.getLandType() != null) {
                types.merge(l.getLandType().name(), 1L, Long::sum);
            }
        }
        List<Map<String, Object>> popTypes = types.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("land_type", e.getKey());
            m.put("c", e.getValue());
            return m;
        }).toList();
        result.put("popular_types", popTypes);

        // Province split
        Map<String, Long> provinces = new LinkedHashMap<>();
        for (Land l : landRepo.findAll()) {
            if (l.getProvince() != null) {
                provinces.merge(l.getProvince(), 1L, Long::sum);
            }
        }
        List<Map<String, Object>> provSplit = provinces.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("province", e.getKey());
            m.put("c", e.getValue());
            return m;
        }).toList();
        result.put("province_split", provSplit);

        // Price bands
        result.put("price_bands", List.of(
                Map.of("band", "Under Rs. 5M", "c", landRepo.findAll().stream().filter(l -> l.getPrice().doubleValue() < 5000000).count()),
                Map.of("band", "Rs. 5M - 10M", "c", landRepo.findAll().stream().filter(l -> l.getPrice().doubleValue() >= 5000000 && l.getPrice().doubleValue() < 10000000).count()),
                Map.of("band", "Rs. 10M - 20M", "c", landRepo.findAll().stream().filter(l -> l.getPrice().doubleValue() >= 10000000 && l.getPrice().doubleValue() < 20000000).count()),
                Map.of("band", "Over Rs. 20M", "c", landRepo.findAll().stream().filter(l -> l.getPrice().doubleValue() >= 20000000).count())
        ));

        // Bookings by status
        Map<String, Long> bkStatus = new LinkedHashMap<>();
        for (Booking b : bookingRepo.findAll()) {
            if (b.getStatus() != null) bkStatus.merge(b.getStatus().name(), 1L, Long::sum);
        }
        List<Map<String, Object>> bks = bkStatus.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("status", e.getKey());
            m.put("c", e.getValue());
            return m;
        }).toList();
        result.put("bookings_by_status", bks);

        // Verification counts
        Map<String, Long> verCounts = new LinkedHashMap<>();
        for (Land l : landRepo.findAll()) {
            if (l.getVerification() != null) verCounts.merge(l.getVerification().name(), 1L, Long::sum);
        }
        List<Map<String, Object>> vers = verCounts.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("verification", e.getKey());
            m.put("c", e.getValue());
            return m;
        }).toList();
        result.put("verification", vers);

        // Payments by method
        List<Map<String, Object>> byMethod = new ArrayList<>();
        paymentRepo.countByMethod().forEach(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("method", r[0] != null ? r[0].toString() : "OTHER");
            m.put("c", ((Number) r[1]).longValue());
            byMethod.add(m);
        });
        Map<String, Object> payments = new LinkedHashMap<>();
        payments.put("byMethod", byMethod);
        result.put("payments", payments);

        return result;
    }

    public List<Map<String, Object>> listUsers(String role, String q) {
        Role r = (role != null && !role.isBlank()) ? Role.valueOf(role.toUpperCase()) : null;
        List<User> users = userRepo.findFiltered(r, q);
        return users.stream().map(this::userToMap).toList();
    }

    @Transactional
    public Map<String, Object> updateUser(Long userId, Long adminId, Map<String, Object> patch) {
        User user = userRepo.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (patch.containsKey("status") && patch.get("status") != null) {
            user.setStatus(UserStatus.valueOf(patch.get("status").toString().toUpperCase()));
        }
        if (patch.containsKey("role") && patch.get("role") != null) {
            user.setRole(Role.valueOf(patch.get("role").toString().toUpperCase()));
        }
        userRepo.save(user);
        return userToMap(user);
    }

    @Transactional
    public Map<String, String> deleteUser(Long userId, Long adminId) {
        if (userId.equals(adminId)) throw ApiException.badRequest("You cannot delete your own admin account");
        userRepo.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        userRepo.deleteById(userId);
        return Map.of("ok", "true", "message", "User deleted");
    }

    @Transactional
    public Map<String, Object> createAccount(Map<String, Object> dto) {
        String fullName = (String) dto.get("full_name");
        String email = (String) dto.get("email");
        String phone = (String) dto.get("phone");
        String roleStr = (String) dto.get("role");
        String password = (String) dto.get("password");
        String nic = (String) dto.get("nic");
        String statusStr = (String) dto.get("status");

        if (email == null || email.isBlank()) throw ApiException.badRequest("Email is required");
        if (password == null || password.length() < 8) throw ApiException.badRequest("Password must be at least 8 characters");
        if (userRepo.findByEmail(email.toLowerCase().trim()).isPresent()) {
            throw ApiException.conflict("An account with this email already exists");
        }

        Role role = Role.valueOf(roleStr != null ? roleStr.toUpperCase() : "BUYER");
        UserStatus status = statusStr != null ? UserStatus.valueOf(statusStr.toUpperCase()) : UserStatus.ACTIVE;

        User user = userRepo.save(User.builder()
                .fullName(fullName)
                .email(email.toLowerCase().trim())
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .nic(nic)
                .language(Language.en)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build());

        if (role == Role.BUYER) buyerRepo.save(Buyer.builder().userId(user.getId()).build());
        if (role == Role.SELLER) sellerRepo.save(Seller.builder().userId(user.getId()).companyName(fullName + " Properties").build());
        if (role == Role.AGENT) agentRepo.save(Agent.builder().userId(user.getId()).commissionPct(new BigDecimal("2.50")).build());

        notificationService.push(user.getId(), "WELCOME", "Welcome to LandHub Sri Lanka",
                "Your " + user.getRole().name().toLowerCase() + " account has been created by an administrator.", "/dashboard");

        return userToMap(user);
    }

    public Map<String, Object> listLands(String status, Integer limit, Integer page) {
        List<Land> all = landRepo.findAll();
        if (status != null && !status.isBlank()) {
            all = all.stream().filter(l -> l.getStatus() != null && l.getStatus().name().equalsIgnoreCase(status)).toList();
        }
        int p = page != null && page > 0 ? page : 1;
        int lim = limit != null && limit > 0 ? limit : 60;
        int offset = (p - 1) * lim;

        List<Map<String, Object>> items = all.stream().skip(offset).limit(lim).map(this::landToAdminMap).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", all.size());
        result.put("page", p);
        result.put("limit", lim);
        return result;
    }

    @Transactional
    public Map<String, Object> updateLandStatus(Long landId, Long adminId, String status) {
        Land land = landRepo.findById(landId).orElseThrow(() -> ApiException.notFound("Land not found"));
        LandStatus st = LandStatus.valueOf(status.toUpperCase());
        land.setStatus(st);
        landRepo.save(land);

        notificationService.push(land.getSellerId(), "LISTING_" + st.name(),
                "Listing " + st.name().toLowerCase(),
                "\"" + land.getTitle() + "\" is now " + st.name().toLowerCase() + ".", "/seller");

        return landToAdminMap(land);
    }

    @Transactional
    public Map<String, Object> verifyLand(Long landId, String verification) {
        Land land = landRepo.findById(landId).orElseThrow(() -> ApiException.notFound("Land not found"));
        Verification v = Verification.valueOf(verification.toUpperCase());
        land.setVerification(v);
        landRepo.save(land);

        notificationService.push(land.getSellerId(), "VERIFICATION_" + v.name(),
                "Property verification " + v.name().toLowerCase(),
                "\"" + land.getTitle() + "\" verification status: " + v.name() + ".", "/documents");

        return landToAdminMap(land);
    }

    public Map<String, Object> liveReports(String from, String to) {
        Map<String, Object> res = new LinkedHashMap<>();

        // Users
        long usersTotal = userRepo.count();
        Map<String, Long> byRole = new LinkedHashMap<>();
        userRepo.countByRoleGrouped().forEach(r -> byRole.put(r[0].toString(), ((Number) r[1]).longValue()));
        res.put("users", Map.of(
                "total", usersTotal,
                "buyers", byRole.getOrDefault("BUYER", 0L),
                "sellers", byRole.getOrDefault("SELLER", 0L),
                "agents", byRole.getOrDefault("AGENT", 0L),
                "admins", byRole.getOrDefault("ADMIN", 0L),
                "support", byRole.getOrDefault("SUPPORT", 0L)
        ));

        // Lands
        res.put("lands", Map.of(
                "total", landRepo.count(),
                "active", landRepo.countByStatus(LandStatus.ACTIVE),
                "pending", landRepo.countByStatus(LandStatus.PENDING)
        ));

        // Reservations
        res.put("reservations", Map.of(
                "total", bookingRepo.count()
        ));

        // Payments
        res.put("payments", Map.of(
                "total_count", paymentRepo.count(),
                "total_value", paymentRepo.totalSuccessfulRevenue()
        ));

        // Inquiries
        res.put("inquiries", inquiryService.stats());

        // Reviews
        res.put("reviews", Map.of(
                "total", reviewRepo.count(),
                "pending", reviewRepo.countByStatus(ReviewStatus.PENDING)
        ));

        return res;
    }

    @Transactional
    public Map<String, Object> generateReport(Long adminId, String reportType) {
        Object payloadObj;
        switch (reportType.toUpperCase()) {
            case "SUMMARY" -> {
                Map<String, Object> summary = new LinkedHashMap<>();
                summary.put("properties", landRepo.count());
                summary.put("users", userRepo.count());
                summary.put("reservations", bookingRepo.count());
                summary.put("payments", paymentRepo.count());
                summary.put("revenue", paymentRepo.totalSuccessfulRevenue());
                summary.put("pending_approval", landRepo.countByStatus(LandStatus.PENDING));
                summary.put("pending_documents", docRepo.countByStatus(Verification.PENDING));
                payloadObj = summary;
            }
            case "USERS" -> {
                List<Map<String, Object>> userCounts = new ArrayList<>();
                userRepo.countByRoleGrouped().forEach(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("role", r[0].toString());
                    m.put("c", ((Number) r[1]).longValue());
                    userCounts.add(m);
                });
                payloadObj = userCounts;
            }
            case "SALES" -> {
                Map<String, Long> countMap = new LinkedHashMap<>();
                Map<String, BigDecimal> revMap = new LinkedHashMap<>();
                for (Payment p : paymentRepo.findAll()) {
                    if (p.getStatus() == PaymentStatus.SUCCESSFUL) {
                        Booking b = bookingRepo.findById(p.getBookingId()).orElse(null);
                        if (b != null) {
                            Land l = landRepo.findById(b.getLandId()).orElse(null);
                            String dist = l != null ? l.getDistrict() : "Unknown";
                            countMap.merge(dist, 1L, Long::sum);
                            revMap.merge(dist, p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO, BigDecimal::add);
                        }
                    }
                }
                List<Map<String, Object>> sales = new ArrayList<>();
                for (String d : countMap.keySet()) {
                    sales.add(Map.of("district", d, "c", countMap.get(d), "revenue", revMap.getOrDefault(d, BigDecimal.ZERO)));
                }
                if (sales.isEmpty()) {
                    sales.add(Map.of("district", "All Districts", "c", 0L, "revenue", BigDecimal.ZERO));
                }
                payloadObj = sales;
            }
            case "LISTINGS" -> {
                Map<String, Long> distTypeCounts = new LinkedHashMap<>();
                for (Land l : landRepo.findAll()) {
                    String key = (l.getDistrict() != null ? l.getDistrict() : "Unknown") + "::" + (l.getLandType() != null ? l.getLandType().name() : "OTHER");
                    distTypeCounts.merge(key, 1L, Long::sum);
                }
                List<Map<String, Object>> listings = new ArrayList<>();
                distTypeCounts.forEach((k, cnt) -> {
                    String[] parts = k.split("::");
                    listings.add(Map.of("district", parts[0], "land_type", parts[1], "c", cnt));
                });
                payloadObj = listings;
            }
            case "INQUIRIES" -> {
                Map<String, Object> inq = new LinkedHashMap<>();
                Map<String, Object> istats = inquiryService.stats();
                inq.put("total_inquiries", istats.get("total"));
                inq.put("open", istats.get("open"));
                inq.put("pending", istats.get("pending_clarification"));
                inq.put("resolved", istats.get("resolved"));
                inq.put("total_messages", messageRepo.count());
                inq.put("conversations", inquiryRepo.count());
                payloadObj = inq;
            }
            default -> payloadObj = Map.of();
        }

        String payloadJson;
        try { payloadJson = objectMapper.writeValueAsString(payloadObj); } catch (Exception e) { payloadJson = "{}"; }

        Report report = reportRepo.save(Report.builder()
                .reportType(reportType.toUpperCase()).generatedBy(adminId)
                .payload(payloadJson).build());

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", report.getId());
        m.put("report_type", report.getReportType());
        m.put("payload", report.getPayload());
        m.put("created_at", report.getCreatedAt().toString());
        return m;
    }

    public List<Map<String, Object>> listReports() {
        return reportRepo.findAllByOrderByCreatedAtDesc().stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("report_type", r.getReportType());
            m.put("generated_by", r.getGeneratedBy());
            m.put("payload", r.getPayload());
            m.put("created_at", r.getCreatedAt().toString());
            return m;
        }).toList();
    }

    @Transactional
    public Map<String, String> deleteReport(Long id) {
        reportRepo.deleteById(id);
        return Map.of("message", "Report deleted");
    }

    private Map<String, Object> userToMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("full_name", u.getFullName());
        m.put("email", u.getEmail());
        m.put("phone", u.getPhone());
        m.put("role", u.getRole().name());
        m.put("nic", u.getNic());
        m.put("avatar", u.getAvatar());
        m.put("language", u.getLanguage().name());
        m.put("status", u.getStatus().name());
        m.put("created_at", u.getCreatedAt().toString());
        return m;
    }

    private Map<String, Object> landToAdminMap(Land l) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", l.getId());
        m.put("seller_id", l.getSellerId());
        m.put("title", l.getTitle());
        m.put("land_type", l.getLandType() != null ? l.getLandType().name() : null);
        m.put("province", l.getProvince());
        m.put("district", l.getDistrict());
        m.put("city", l.getCity());
        m.put("perches", l.getPerches());
        m.put("price", l.getPrice());
        m.put("price_per_perch", l.getPricePerPerch());
        m.put("status", l.getStatus() != null ? l.getStatus().name() : null);
        m.put("verification", l.getVerification() != null ? l.getVerification().name() : null);
        m.put("views", l.getViews());
        m.put("created_at", l.getCreatedAt().toString());

        userRepo.findById(l.getSellerId()).ifPresent(s -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("id", s.getId());
            sm.put("full_name", s.getFullName());
            sm.put("email", s.getEmail());
            sm.put("phone", s.getPhone());
            m.put("seller", sm);
            m.put("seller_name", s.getFullName());
        });
        m.putIfAbsent("seller_name", "Unknown Seller");

        List<LandImage> imgs = imageRepo.findByLandIdOrderBySortOrderAsc(l.getId());
        m.put("cover", imgs.isEmpty() ? null : imgs.get(0).getUrl());
        m.put("size", com.landhub.util.MeasurementUtil.breakdown(l.getPerches() != null ? l.getPerches().doubleValue() : 0));
        m.put("price_display", com.landhub.util.MoneyUtil.lkr(l.getPrice()));
        return m;
    }
}
