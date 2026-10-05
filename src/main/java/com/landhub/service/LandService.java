package com.landhub.service;

import com.landhub.entity.*;
import com.landhub.entity.enums.*;
import com.landhub.exception.ApiException;
import com.landhub.repository.*;
import com.landhub.util.MeasurementUtil;
import com.landhub.util.MoneyUtil;
import com.landhub.util.SriLankaData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandService {

    private final LandRepository landRepo;
    private final LandImageRepository imageRepo;
    private final LandDocumentRepository docRepo;
    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ReviewRepository reviewRepo;
    private final BookingRepository bookingRepo;
    private final MessageRepository messageRepo;
    private final RecentlyViewedRepository recentlyViewedRepo;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    // ---- Decoration (adds display fields to a raw entity) ----

    public Map<String, Object> decorate(Land l) {
        if (l == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", l.getId());
        m.put("seller_id", l.getSellerId());
        m.put("agent_id", l.getAgentId());
        m.put("title", l.getTitle());
        m.put("title_si", l.getTitleSi());
        m.put("title_ta", l.getTitleTa());
        m.put("description", l.getDescription() != null ? l.getDescription() : "");
        m.put("land_type", l.getLandType() != null ? l.getLandType().name() : "Residential");
        m.put("province", l.getProvince() != null ? l.getProvince() : "");
        m.put("district", l.getDistrict() != null ? l.getDistrict() : "");
        m.put("city", l.getCity() != null ? l.getCity() : "");
        m.put("area", l.getArea());
        m.put("address", l.getAddress());
        m.put("perches", l.getPerches() != null ? l.getPerches() : BigDecimal.ZERO);
        m.put("price", l.getPrice() != null ? l.getPrice() : BigDecimal.ZERO);
        m.put("price_per_perch", l.getPricePerPerch() != null ? l.getPricePerPerch() : BigDecimal.ZERO);
        m.put("negotiable", Boolean.TRUE.equals(l.getNegotiable()) ? 1 : 0);
        m.put("lat", l.getLat() != null ? l.getLat() : BigDecimal.valueOf(6.9271));
        m.put("lng", l.getLng() != null ? l.getLng() : BigDecimal.valueOf(79.8612));
        m.put("electricity", Boolean.TRUE.equals(l.getElectricity()) ? 1 : 0);
        m.put("water", Boolean.TRUE.equals(l.getWater()) ? 1 : 0);
        m.put("main_road", Boolean.TRUE.equals(l.getMainRoad()) ? 1 : 0);
        m.put("internet", Boolean.TRUE.equals(l.getInternet()) ? 1 : 0);
        m.put("telephone", Boolean.TRUE.equals(l.getTelephone()) ? 1 : 0);
        m.put("drainage", Boolean.TRUE.equals(l.getDrainage()) ? 1 : 0);
        m.put("clear_deed", Boolean.TRUE.equals(l.getClearDeed()) ? 1 : 0);
        m.put("survey_plan", Boolean.TRUE.equals(l.getSurveyPlan()) ? 1 : 0);
        m.put("near_school", Boolean.TRUE.equals(l.getNearSchool()) ? 1 : 0);
        m.put("near_hospital", Boolean.TRUE.equals(l.getNearHospital()) ? 1 : 0);
        m.put("near_highway", Boolean.TRUE.equals(l.getNearHighway()) ? 1 : 0);
        m.put("near_railway", Boolean.TRUE.equals(l.getNearRailway()) ? 1 : 0);
        m.put("nearest_highway", l.getNearestHighway());
        m.put("status", l.getStatus() != null ? l.getStatus().name() : "PENDING");
        m.put("verification", l.getVerification() != null ? l.getVerification().name() : "PENDING");
        m.put("views", l.getViews() != null ? l.getViews() : 0);
        m.put("created_at", l.getCreatedAt() != null ? l.getCreatedAt().toString() : null);

        // Seller info
        userRepo.findById(l.getSellerId()).ifPresent(u -> {
            m.put("seller_name", u.getFullName());
            m.put("seller_phone", u.getPhone());
            m.put("seller_email", u.getEmail());
        });
        m.putIfAbsent("seller_name", "Seller #" + l.getSellerId());
        sellerRepo.findByUserId(l.getSellerId()).ifPresent(s -> {
            m.put("seller_rating", s.getRatingAvg());
            m.put("seller_reviews", s.getRatingCount());
            m.put("seller_company", s.getCompanyName());
        });

        // Images
        List<LandImage> imgs = imageRepo.findByLandIdOrderByIsCoverDescSortOrderAsc(l.getId());
        m.put("cover", imgs.isEmpty() ? null : imgs.get(0).getUrl());
        m.put("images", imgs.stream().map(LandImage::getUrl).toList());

        // Display fields
        double perchesVal = l.getPerches() != null ? l.getPerches().doubleValue() : 0.0;
        BigDecimal priceVal = l.getPrice() != null ? l.getPrice() : BigDecimal.ZERO;
        BigDecimal pppVal = l.getPricePerPerch() != null ? l.getPricePerPerch() : BigDecimal.ZERO;

        m.put("size", MeasurementUtil.breakdown(perchesVal));
        m.put("price_display", MoneyUtil.lkr(priceVal));
        m.put("price_short", MoneyUtil.lkrShort(priceVal));
        m.put("ppp_display", MoneyUtil.lkr(pppVal) + " / Perch");

        String locDisplay = (l.getArea() != null ? l.getArea() + ", " : "") + (l.getCity() != null ? l.getCity() : "") + ", " + (l.getDistrict() != null ? l.getDistrict() : "") + " District";
        m.put("location_display", locDisplay);
        m.put("is_verified", l.getVerification() == Verification.VERIFIED);

        // Nearby
        try {
            m.put("nearby", l.getNearby() != null ? objectMapper.readValue(l.getNearby(), new TypeReference<List<String>>(){}) : List.of());
        } catch (Exception e) {
            m.put("nearby", List.of());
        }

        return m;
    }

    // ---- Create ----

    @Transactional
    public Map<String, Object> create(Long sellerId, Map<String, Object> dto) {
        String district = (String) dto.get("district");
        String province = SriLankaData.findProvince(district);
        if (province == null) throw ApiException.badRequest("Unknown Sri Lankan district: " + district);

        String landTypeStr = (String) dto.get("land_type");
        if (!SriLankaData.LAND_TYPES.contains(landTypeStr)) throw ApiException.badRequest("Unknown land type");
        LandType landType = LandType.valueOf(landTypeStr);

        // Size: may be supplied in any unit
        String unit = dto.getOrDefault("unit", "perch").toString();
        double sizeValue = toDouble(dto.getOrDefault("size_value", dto.get("perches")));
        double perches = !unit.equals("perch") ? MeasurementUtil.convert(sizeValue, unit, "perches") : sizeValue;
        if (perches <= 0) throw ApiException.badRequest("Land size must be greater than zero");

        double price = toDouble(dto.get("price"));
        double[] coords = SriLankaData.DISTRICT_COORDS.getOrDefault(district, new double[]{7.8731, 80.7718});

        Land land = Land.builder()
                .sellerId(sellerId)
                .title(escapeHtml((String) dto.get("title")))
                .titleSi((String) dto.get("title_si"))
                .titleTa((String) dto.get("title_ta"))
                .description(escapeHtml((String) dto.get("description")))
                .landType(landType)
                .province(province).district(district)
                .city((String) dto.get("city"))
                .area((String) dto.get("area"))
                .address((String) dto.get("address"))
                .perches(BigDecimal.valueOf(perches).setScale(2, RoundingMode.HALF_UP))
                .price(BigDecimal.valueOf(price))
                .pricePerPerch(BigDecimal.valueOf(Math.round(price / perches)))
                .negotiable(toBool(dto.get("negotiable")))
                .lat(dto.get("lat") != null ? BigDecimal.valueOf(toDouble(dto.get("lat"))) : BigDecimal.valueOf(coords[0]))
                .lng(dto.get("lng") != null ? BigDecimal.valueOf(toDouble(dto.get("lng"))) : BigDecimal.valueOf(coords[1]))
                .electricity(toBool(dto.get("electricity")))
                .water(toBool(dto.get("water")))
                .mainRoad(toBool(dto.get("main_road")))
                .internet(toBool(dto.get("internet")))
                .telephone(toBool(dto.get("telephone")))
                .drainage(toBool(dto.get("drainage")))
                .clearDeed(toBool(dto.get("clear_deed")))
                .surveyPlan(toBool(dto.get("survey_plan")))
                .nearSchool(toBool(dto.get("near_school")))
                .nearHospital(toBool(dto.get("near_hospital")))
                .nearHighway(toBool(dto.get("near_highway")))
                .nearRailway(toBool(dto.get("near_railway")))
                .nearestHighway((String) dto.get("nearest_highway"))
                .status(LandStatus.PENDING).verification(Verification.PENDING)
                .build();

        // Nearby as JSON
        Object nearbyObj = dto.get("nearby");
        if (nearbyObj instanceof List<?> list) {
            try { land.setNearby(objectMapper.writeValueAsString(list)); } catch (JsonProcessingException ignored) {}
        } else {
            land.setNearby("[]");
        }

        land = landRepo.save(land);

        // Images
        Object imagesObj = dto.get("images");
        if (imagesObj instanceof List<?> imgList) {
            Long landId = land.getId();
            for (int i = 0; i < Math.min(imgList.size(), 10); i++) {
                imageRepo.save(LandImage.builder()
                        .landId(landId).url(imgList.get(i).toString())
                        .isCover(i == 0).sortOrder(i).build());
            }
        }

        // Notifications
        notificationService.push(sellerId, "LISTING_SUBMITTED", "Listing submitted for review",
                "\"" + land.getTitle() + "\" is pending administrator approval.", "/seller");
        final String landTitle = land.getTitle();
        userRepo.findByRole(Role.ADMIN).forEach(a ->
                notificationService.push(a.getId(), "LISTING_REVIEW", "New listing awaiting approval", landTitle, "/admin"));

        return decorate(land);
    }

    // ---- Get single ----

    @Transactional
    public Map<String, Object> get(Long id, Long viewerId) {
        Land land = landRepo.findById(id).orElseThrow(() -> ApiException.notFound("Land listing not found"));
        try {
            landRepo.incrementViews(id);
        } catch (Exception ignored) {}

        if (viewerId != null) {
            try {
                recentlyViewedRepo.findByUserIdAndLandId(viewerId, id).ifPresentOrElse(
                    rv -> { rv.setViewedAt(java.time.LocalDateTime.now()); recentlyViewedRepo.save(rv); },
                    () -> recentlyViewedRepo.save(RecentlyViewed.builder().userId(viewerId).landId(id).build())
                );
            } catch (Exception ignored) {}
        }
        Map<String, Object> d = decorate(land);

        // Documents
        try {
            d.put("documents", docRepo.findByLandIdOrderByCreatedAtDesc(id).stream().map(doc -> {
                Map<String, Object> dm = new LinkedHashMap<>();
                dm.put("id", doc.getId());
                dm.put("doc_type", doc.getDocType() != null ? doc.getDocType().name() : "");
                dm.put("status", doc.getStatus() != null ? doc.getStatus().name() : "");
                dm.put("created_at", doc.getCreatedAt() != null ? doc.getCreatedAt().toString() : "");
                return dm;
            }).toList());
        } catch (Exception e) {
            d.put("documents", List.of());
        }

        // Reviews
        try {
            d.put("reviews", reviewRepo.findBySellerIdAndStatusOrderByCreatedAtDesc(land.getSellerId(), ReviewStatus.APPROVED)
                    .stream().limit(5).map(r -> {
                Map<String, Object> rm = new LinkedHashMap<>();
                rm.put("id", r.getId());
                rm.put("rating", r.getRating());
                rm.put("comment", r.getComment());
                rm.put("created_at", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
                if (r.getBuyerId() != null) {
                    userRepo.findById(r.getBuyerId()).ifPresent(u -> rm.put("buyer_name", u.getFullName()));
                }
                return rm;
            }).toList());
        } catch (Exception e) {
            d.put("reviews", List.of());
        }

        // Similar
        List<Map<String, Object>> similar = List.of();
        try {
            similar = landRepo.findSimilarCandidates(id, land.getDistrict(), land.getLandType(), PageRequest.of(0, 10))
                    .stream()
                    .sorted(Comparator.comparing(c -> c.getPrice() != null && land.getPrice() != null ?
                            c.getPrice().subtract(land.getPrice()).abs() : BigDecimal.ZERO))
                    .limit(3)
                    .map(this::decorate)
                    .toList();
        } catch (Exception ignored) {}
        d.put("similar", similar);

        return d;
    }

    // ---- Search ----

    public Map<String, Object> search(Map<String, Object> filters) {
        Specification<Land> spec = buildSpec(filters);
        int limit = Math.min(toInt(filters.getOrDefault("limit", 12)), 60);
        int page = Math.max(toInt(filters.getOrDefault("page", 1)), 1) - 1;
        String sortKey = (String) filters.getOrDefault("sort", "newest");

        org.springframework.data.domain.Sort sort = switch (sortKey) {
            case "price_asc" -> org.springframework.data.domain.Sort.by("price").ascending();
            case "price_desc" -> org.springframework.data.domain.Sort.by("price").descending();
            case "perch_asc" -> org.springframework.data.domain.Sort.by("pricePerPerch").ascending();
            case "size_desc" -> org.springframework.data.domain.Sort.by("perches").descending();
            case "popular" -> org.springframework.data.domain.Sort.by("views").descending();
            default -> org.springframework.data.domain.Sort.by("createdAt").descending().and(
                    org.springframework.data.domain.Sort.by("id").descending());
        };

        var pageResult = landRepo.findAll(spec, PageRequest.of(page, limit, sort));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", pageResult.getContent().stream().map(this::decorate).toList());
        result.put("total", pageResult.getTotalElements());
        result.put("page", page + 1);
        result.put("pages", pageResult.getTotalPages() == 0 ? 1 : pageResult.getTotalPages());
        result.put("limit", limit);
        return result;
    }

    private Specification<Land> buildSpec(Map<String, Object> f) {
        Specification<Land> spec = Specification.where(null);

        if (f.containsKey("status")) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), LandStatus.valueOf(f.get("status").toString())));
        } else if (!Boolean.TRUE.equals(f.get("all_statuses"))) {
            spec = spec.and((r, q, cb) -> r.get("status").in(LandStatus.ACTIVE, LandStatus.RESERVED));
        }
        if (f.containsKey("seller_id")) spec = spec.and((r, q, cb) -> cb.equal(r.get("sellerId"), toLong(f.get("seller_id"))));
        if (f.containsKey("province")) spec = spec.and((r, q, cb) -> cb.equal(r.get("province"), f.get("province")));
        if (f.containsKey("district")) spec = spec.and((r, q, cb) -> cb.equal(r.get("district"), f.get("district")));
        if (f.containsKey("city")) spec = spec.and((r, q, cb) -> cb.equal(r.get("city"), f.get("city")));
        if (f.containsKey("area")) spec = spec.and((r, q, cb) -> cb.like(r.get("area"), "%" + f.get("area") + "%"));
        if (f.containsKey("land_type")) spec = spec.and((r, q, cb) -> cb.equal(r.get("landType"), LandType.valueOf(f.get("land_type").toString())));
        if (Boolean.TRUE.equals(f.get("verified"))) spec = spec.and((r, q, cb) -> cb.equal(r.get("verification"), Verification.VERIFIED));
        if (f.containsKey("min_price")) spec = spec.and((r, q, cb) -> cb.ge(r.get("price"), toBd(f.get("min_price"))));
        if (f.containsKey("max_price")) spec = spec.and((r, q, cb) -> cb.le(r.get("price"), toBd(f.get("max_price"))));
        if (f.containsKey("max_ppp")) spec = spec.and((r, q, cb) -> cb.le(r.get("pricePerPerch"), toBd(f.get("max_ppp"))));
        if (f.containsKey("min_perches")) spec = spec.and((r, q, cb) -> cb.ge(r.get("perches"), toBd(f.get("min_perches"))));
        if (f.containsKey("max_perches")) spec = spec.and((r, q, cb) -> cb.le(r.get("perches"), toBd(f.get("max_perches"))));
        if (toBool(f.get("negotiable"))) spec = spec.and((r, q, cb) -> cb.isTrue(r.get("negotiable")));
        if (f.containsKey("highway")) spec = spec.and((r, q, cb) -> cb.equal(r.get("nearestHighway"), f.get("highway")));

        // Feature filters
        for (String col : List.of("main_road","electricity","water","clear_deed","survey_plan","near_school","near_hospital","near_highway","near_railway","internet","telephone","drainage")) {
            if (toBool(f.get(col))) {
                String javaField = toCamelCase(col);
                spec = spec.and((r, q, cb) -> cb.isTrue(r.get(javaField)));
            }
        }

        // Text search
        if (f.containsKey("q")) {
            String q = "%" + f.get("q").toString() + "%";
            spec = spec.and((r, query, cb) -> cb.or(
                    cb.like(r.get("title"), q), cb.like(r.get("description"), q),
                    cb.like(r.get("city"), q), cb.like(r.get("area"), q), cb.like(r.get("district"), q)
            ));
        }
        return spec;
    }

    // ---- Update ----

    @Transactional
    public Map<String, Object> update(Long id, Long userId, String userRole, Map<String, Object> patch) {
        Land land = landRepo.findById(id).orElseThrow(() -> ApiException.notFound("Land listing not found"));
        if (!userRole.equals("ADMIN") && !land.getSellerId().equals(userId))
            throw ApiException.forbidden("You can only edit your own listings");

        if (patch.containsKey("price") || patch.containsKey("perches")) {
            double price = toDouble(patch.getOrDefault("price", land.getPrice()));
            double perches = toDouble(patch.getOrDefault("perches", land.getPerches()));
            land.setPrice(BigDecimal.valueOf(price));
            land.setPerches(BigDecimal.valueOf(perches));
            land.setPricePerPerch(BigDecimal.valueOf(Math.round(price / perches)));
        }
        if (patch.containsKey("title")) land.setTitle(escapeHtml(patch.get("title").toString()));
        if (patch.containsKey("description")) land.setDescription(escapeHtml(patch.get("description").toString()));
        if (patch.containsKey("land_type")) land.setLandType(LandType.valueOf(patch.get("land_type").toString()));
        if (patch.containsKey("district")) land.setDistrict(patch.get("district").toString());
        if (patch.containsKey("city")) land.setCity(patch.get("city").toString());
        if (patch.containsKey("area")) land.setArea(patch.get("area").toString());
        if (patch.containsKey("negotiable")) land.setNegotiable(toBool(patch.get("negotiable")));
        if (patch.containsKey("lat")) land.setLat(BigDecimal.valueOf(toDouble(patch.get("lat"))));
        if (patch.containsKey("lng")) land.setLng(BigDecimal.valueOf(toDouble(patch.get("lng"))));

        if (userRole.equals("ADMIN")) {
            if (patch.containsKey("status")) land.setStatus(LandStatus.valueOf(patch.get("status").toString()));
            if (patch.containsKey("verification")) land.setVerification(Verification.valueOf(patch.get("verification").toString()));
        }

        landRepo.save(land);
        return decorate(land);
    }

    // ---- Remove ----

    @Transactional
    public Map<String, String> remove(Long id, Long userId, String userRole) {
        Land land = landRepo.findById(id).orElseThrow(() -> ApiException.notFound("Land listing not found"));
        if (!userRole.equals("ADMIN") && !land.getSellerId().equals(userId))
            throw ApiException.forbidden("You can only delete your own listings");
        landRepo.delete(land);
        return Map.of("message", "Listing deleted");
    }

    // ---- Seller Stats ----

    public Map<String, Object> sellerStats(Long sellerId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", landRepo.countBySellerId(sellerId));
        stats.put("active", landRepo.countBySellerIdAndStatus(sellerId, LandStatus.ACTIVE));
        stats.put("pending", landRepo.countBySellerIdAndStatus(sellerId, LandStatus.PENDING));
        stats.put("rejected", landRepo.countBySellerIdAndStatus(sellerId, LandStatus.REJECTED));
        stats.put("sold", landRepo.countBySellerIdAndStatus(sellerId, LandStatus.SOLD));
        stats.put("views", landRepo.sumViewsBySellerId(sellerId));
        stats.put("inquiries", (long) messageRepo.findConversationsForUser(sellerId).size());
        stats.put("reservations", bookingRepo.countBySellerId(sellerId));
        stats.put("reviews", reviewRepo.countBySellerIdAndStatus(sellerId, ReviewStatus.APPROVED));
        return stats;
    }

    // ---- Helpers ----

    private String escapeHtml(String s) {
        if (s == null) return null;
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;").replace("`", "&#96;");
    }

    private String toCamelCase(String snake) {
        String[] parts = snake.split("_");
        StringBuilder sb = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            sb.append(Character.toUpperCase(parts[i].charAt(0))).append(parts[i].substring(1));
        }
        return sb.toString();
    }

    static double toDouble(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return 0; }
    }

    static int toInt(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 0; }
    }

    static long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }

    static boolean toBool(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean b) return b;
        if (v instanceof Number n) return n.intValue() != 0;
        String s = v.toString();
        return "true".equalsIgnoreCase(s) || "1".equals(s);
    }

    static BigDecimal toBd(Object v) {
        return BigDecimal.valueOf(toDouble(v));
    }
}
