package com.landhub.service;

import com.landhub.entity.Inquiry;
import com.landhub.entity.InquiryResponse;
import com.landhub.entity.Land;
import com.landhub.entity.User;
import com.landhub.entity.enums.Role;
import com.landhub.exception.ApiException;
import com.landhub.repository.InquiryRepository;
import com.landhub.repository.InquiryResponseRepository;
import com.landhub.repository.LandRepository;
import com.landhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InquiryService {

    public static final List<String> CATEGORIES = List.of(
            "GENERAL", "LAND_INQUIRY", "RESERVATION", "PAYMENT", "COMPLAINT", "OTHER"
    );
    public static final List<String> STATUSES = List.of(
            "OPEN", "PENDING_CLARIFICATION", "RESOLVED"
    );

    private final InquiryRepository inquiryRepo;
    private final InquiryResponseRepository responseRepo;
    private final UserRepository userRepo;
    private final LandRepository landRepo;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> create(Long customerId, Map<String, Object> dto) {
        String subject = (String) dto.get("subject");
        String message = (String) dto.get("message");
        String category = dto.get("category") != null ? (String) dto.get("category") : "GENERAL";
        Long landId = dto.get("land_id") != null ? toLong(dto.get("land_id")) : null;

        if (subject == null || subject.trim().length() < 3) {
            throw ApiException.badRequest("Subject must be at least 3 characters");
        }
        if (message == null || message.trim().length() < 10) {
            throw ApiException.badRequest("Message must be at least 10 characters");
        }
        if (!CATEGORIES.contains(category)) {
            category = "GENERAL";
        }

        Inquiry inquiry = Inquiry.builder()
                .customerId(customerId)
                .landId(landId)
                .subject(subject.trim())
                .message(message.trim())
                .category(category)
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        inquiry = inquiryRepo.save(inquiry);

        // Notify admins about new inquiry
        final String subj = inquiry.getSubject();
        userRepo.findByRole(Role.ADMIN).forEach(admin ->
                notificationService.push(admin.getId(), "INQUIRY_NEW", "New customer inquiry",
                        "\"" + subj + "\" — requires attention.", "/inquiries"));

        return toMap(inquiry);
    }

    public List<Map<String, Object>> listAll(String status, String category, String q, Integer limit, Integer offset) {
        List<Inquiry> list = inquiryRepo.searchInquiries(
                (status != null && !status.isBlank()) ? status : null,
                (category != null && !category.isBlank()) ? category : null,
                (q != null && !q.isBlank()) ? q : null
        );
        int off = offset != null ? Math.max(0, offset) : 0;
        int lim = limit != null && limit > 0 ? limit : 100;
        return list.stream().skip(off).limit(lim).map(this::toMap).toList();
    }

    public List<Map<String, Object>> listByCustomer(Long customerId) {
        return inquiryRepo.findByCustomerIdOrderByUpdatedAtDesc(customerId)
                .stream().map(this::toMap).toList();
    }

    public Map<String, Object> findById(Long id) {
        Inquiry inquiry = inquiryRepo.findById(id).orElse(null);
        return inquiry != null ? toMap(inquiry) : null;
    }

    public List<Map<String, Object>> getResponses(Long inquiryId) {
        List<InquiryResponse> responses = responseRepo.findByInquiryIdOrderByCreatedAtAsc(inquiryId);
        return responses.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("inquiry_id", r.getInquiryId());
            m.put("sender_id", r.getSenderId());
            m.put("message", r.getMessage());
            m.put("message_type", r.getMessageType());
            m.put("created_at", r.getCreatedAt().toString());

            userRepo.findById(r.getSenderId()).ifPresent(u -> {
                m.put("sender_name", u.getFullName());
                m.put("sender_role", u.getRole() != null ? u.getRole().name() : null);
            });
            return m;
        }).toList();
    }

    @Transactional
    public Map<String, Object> respond(Long staffId, Long inquiryId, String message) {
        Inquiry inquiry = inquiryRepo.findById(inquiryId)
                .orElseThrow(() -> ApiException.notFound("Inquiry not found"));

        if ("RESOLVED".equalsIgnoreCase(inquiry.getStatus())) {
            throw ApiException.badRequest("This inquiry is already resolved");
        }
        if (message == null || message.trim().length() < 2) {
            throw ApiException.badRequest("Response message is required");
        }

        responseRepo.save(InquiryResponse.builder()
                .inquiryId(inquiryId)
                .senderId(staffId)
                .message(message.trim())
                .messageType("RESPONSE")
                .createdAt(LocalDateTime.now())
                .build());

        inquiry.setStatus("RESOLVED");
        inquiry.setAssignedStaffId(staffId);
        inquiry.setUpdatedAt(LocalDateTime.now());
        inquiryRepo.save(inquiry);

        notificationService.push(inquiry.getCustomerId(), "INQUIRY_RESOLVED", "Your inquiry has been resolved",
                "\"" + inquiry.getSubject() + "\" — a response has been provided.", "/inquiries");

        return toMap(inquiry);
    }

    @Transactional
    public Map<String, Object> requestClarification(Long staffId, Long inquiryId, String message) {
        Inquiry inquiry = inquiryRepo.findById(inquiryId)
                .orElseThrow(() -> ApiException.notFound("Inquiry not found"));

        if ("RESOLVED".equalsIgnoreCase(inquiry.getStatus())) {
            throw ApiException.badRequest("Cannot request clarification on a resolved inquiry");
        }
        if (message == null || message.trim().length() < 2) {
            throw ApiException.badRequest("Clarification message is required");
        }

        responseRepo.save(InquiryResponse.builder()
                .inquiryId(inquiryId)
                .senderId(staffId)
                .message(message.trim())
                .messageType("CLARIFICATION_REQUEST")
                .createdAt(LocalDateTime.now())
                .build());

        inquiry.setStatus("PENDING_CLARIFICATION");
        inquiry.setAssignedStaffId(staffId);
        inquiry.setUpdatedAt(LocalDateTime.now());
        inquiryRepo.save(inquiry);

        notificationService.push(inquiry.getCustomerId(), "INQUIRY_CLARIFICATION", "Clarification needed for your inquiry",
                "\"" + inquiry.getSubject() + "\" — additional information requested.", "/inquiries");

        return toMap(inquiry);
    }

    @Transactional
    public Map<String, Object> clarificationReply(Long customerId, Long inquiryId, String message) {
        Inquiry inquiry = inquiryRepo.findById(inquiryId)
                .orElseThrow(() -> ApiException.notFound("Inquiry not found"));

        if (!inquiry.getCustomerId().equals(customerId)) {
            throw ApiException.forbidden("You can only reply to your own inquiries");
        }
        if (!"PENDING_CLARIFICATION".equalsIgnoreCase(inquiry.getStatus())) {
            throw ApiException.badRequest("This inquiry is not awaiting clarification");
        }
        if (message == null || message.trim().length() < 2) {
            throw ApiException.badRequest("Reply message is required");
        }

        responseRepo.save(InquiryResponse.builder()
                .inquiryId(inquiryId)
                .senderId(customerId)
                .message(message.trim())
                .messageType("CLARIFICATION_REPLY")
                .createdAt(LocalDateTime.now())
                .build());

        inquiry.setStatus("OPEN");
        inquiry.setUpdatedAt(LocalDateTime.now());
        inquiryRepo.save(inquiry);

        if (inquiry.getAssignedStaffId() != null) {
            notificationService.push(inquiry.getAssignedStaffId(), "INQUIRY_REPLY", "Customer replied to inquiry",
                    "Clarification received for \"" + inquiry.getSubject() + "\"", "/inquiries");
        } else {
            userRepo.findByRole(Role.ADMIN).forEach(admin ->
                    notificationService.push(admin.getId(), "INQUIRY_REPLY", "Customer replied to inquiry",
                            "Clarification received for \"" + inquiry.getSubject() + "\"", "/inquiries"));
        }

        return toMap(inquiry);
    }

    public Map<String, Object> stats() {
        long total = inquiryRepo.count();
        long open = inquiryRepo.countByStatus("OPEN");
        long pending = inquiryRepo.countByStatus("PENDING_CLARIFICATION");
        long resolved = inquiryRepo.countByStatus("RESOLVED");

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("total", total);
        map.put("open", open);
        map.put("pending_clarification", pending);
        map.put("resolved", resolved);
        return map;
    }

    public Map<String, Object> toMap(Inquiry i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", i.getId());
        m.put("customer_id", i.getCustomerId());
        m.put("land_id", i.getLandId());
        m.put("subject", i.getSubject());
        m.put("message", i.getMessage());
        m.put("category", i.getCategory());
        m.put("status", i.getStatus());
        m.put("assigned_staff_id", i.getAssignedStaffId());
        m.put("created_at", i.getCreatedAt() != null ? i.getCreatedAt().toString() : null);
        m.put("updated_at", i.getUpdatedAt() != null ? i.getUpdatedAt().toString() : null);

        userRepo.findById(i.getCustomerId()).ifPresent(u -> {
            m.put("customer_name", u.getFullName());
            m.put("customer_email", u.getEmail());
            m.put("customer_phone", u.getPhone());
        });

        if (i.getLandId() != null) {
            landRepo.findById(i.getLandId()).ifPresent(l -> {
                m.put("land_title", l.getTitle());
                m.put("land_district", l.getDistrict());
            });
        }

        if (i.getAssignedStaffId() != null) {
            userRepo.findById(i.getAssignedStaffId()).ifPresent(s ->
                    m.put("staff_name", s.getFullName()));
        }

        // Include last response preview
        List<InquiryResponse> responses = responseRepo.findByInquiryIdOrderByCreatedAtAsc(i.getId());
        if (!responses.isEmpty()) {
            m.put("last_response", responses.get(responses.size() - 1).getMessage());
        }

        return m;
    }

    private static long toLong(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; }
    }
}
