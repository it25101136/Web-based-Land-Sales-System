package com.landhub.service;

import com.landhub.entity.*;
import com.landhub.entity.enums.*;
import com.landhub.exception.ApiException;
import com.landhub.repository.*;
import com.landhub.util.MoneyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final BookingRepository bookingRepo;
    private final LandRepository landRepo;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> create(Long payerId, Map<String, Object> dto) {
        Long bookingId = toLong(dto.get("booking_id"));
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        if (!booking.getBuyerId().equals(payerId))
            throw ApiException.forbidden("You can only pay for your own reservations");

        BigDecimal amount = BigDecimal.valueOf(toDouble(dto.get("amount")));
        String methodStr = (String) dto.getOrDefault("method", "ONLINE");
        PaymentMethod method = PaymentMethod.valueOf(methodStr.toUpperCase());

        // Deterministic sandbox simulation
        PaymentStatus status;
        if (method == PaymentMethod.BANK_TRANSFER) {
            status = PaymentStatus.PENDING;
        } else if (method == PaymentMethod.CARD) {
            String card = (String) dto.get("card_number");
            if (card != null && !card.isEmpty()) {
                char last = card.charAt(card.length() - 1);
                status = (last - '0') % 2 == 0 ? PaymentStatus.SUCCESSFUL : PaymentStatus.FAILED;
            } else {
                status = PaymentStatus.SUCCESSFUL;
            }
        } else {
            status = PaymentStatus.SUCCESSFUL;
        }

        String ref = "LH" + System.currentTimeMillis() % 10000000;
        String inv = String.format("INV-%d-%05d", Year.now().getValue(), paymentRepo.count() + 1);

        Payment p = paymentRepo.save(Payment.builder()
                .bookingId(bookingId).payerId(payerId).amount(amount).method(method)
                .status(status).reference(ref).invoiceNo(inv).isSandbox(true)
                .build());

        if (status == PaymentStatus.SUCCESSFUL) {
            notificationService.push(booking.getSellerId(), "PAYMENT_RECEIVED", "Payment received",
                    MoneyUtil.lkr(amount) + " advance payment for reservation #" + bookingId, "/seller");
        }

        Map<String, Object> m = paymentToMap(p);
        m.put("currency", "LKR");
        return m;
    }

    public List<Map<String, Object>> listFor(Long userId, String role) {
        List<Payment> payments;
        if ("ADMIN".equals(role)) {
            payments = paymentRepo.findAllByOrderByCreatedAtDesc();
        } else {
            payments = paymentRepo.findForUser(userId);
        }
        return payments.stream().map(this::paymentToMap).toList();
    }

    @Transactional
    public Map<String, Object> updateStatus(Long id, Long adminId, String status) {
        Payment p = paymentRepo.findById(id).orElseThrow(() -> ApiException.notFound("Payment not found"));
        p.setStatus(PaymentStatus.valueOf(status.toUpperCase()));
        paymentRepo.save(p);
        notificationService.push(p.getPayerId(), "PAYMENT_UPDATE", "Payment status updated",
                "Payment " + p.getReference() + " is now " + p.getStatus().name(), "/buyer");
        return paymentToMap(p);
    }

    public Payment getById(Long id) {
        return paymentRepo.findById(id).orElseThrow(() -> ApiException.notFound("Payment not found"));
    }

    private Map<String, Object> paymentToMap(Payment p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId()); m.put("booking_id", p.getBookingId()); m.put("payer_id", p.getPayerId());
        m.put("amount", p.getAmount()); m.put("currency", p.getCurrency());
        m.put("method", p.getMethod().name()); m.put("status", p.getStatus().name());
        m.put("reference", p.getReference()); m.put("invoice_no", p.getInvoiceNo());
        m.put("is_sandbox", p.getIsSandbox());
        m.put("created_at", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");

        bookingRepo.findById(p.getBookingId()).ifPresent(b -> {
            landRepo.findById(b.getLandId()).ifPresent(l -> {
                m.put("land_title", l.getTitle());
                m.put("district", l.getDistrict());
                m.put("city", l.getCity());
            });
        });
        m.putIfAbsent("land_title", "Booking #" + p.getBookingId());
        m.putIfAbsent("district", "");
        m.putIfAbsent("city", "");

        return m;
    }

    private static long toLong(Object v) { if (v == null) return 0; if (v instanceof Number n) return n.longValue(); try { return Long.parseLong(v.toString()); } catch (Exception e) { return 0; } }
    private static double toDouble(Object v) { if (v == null) return 0; if (v instanceof Number n) return n.doubleValue(); try { return Double.parseDouble(v.toString()); } catch (Exception e) { return 0; } }
}
