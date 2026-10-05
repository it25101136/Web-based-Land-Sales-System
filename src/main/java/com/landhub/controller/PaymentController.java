package com.landhub.controller;

import com.landhub.security.UserPrincipal;
import com.landhub.service.PaymentService;
import com.landhub.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PdfService pdfService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.create(principal.getId(), body));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@AuthenticationPrincipal UserPrincipal principal) {
        List<Map<String, Object>> items = paymentService.listFor(principal.getId(), principal.getRole());
        return ResponseEntity.ok(Map.of("items", items));
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> invoice(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        byte[] pdf = pdfService.generateInvoice(id, principal.getId());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "invoice_" + id + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(paymentService.updateStatus(id, principal.getId(), (String) body.get("status")));
    }
}
