package com.landhub.controller;

import com.landhub.exception.ApiException;
import com.landhub.security.UserPrincipal;
import com.landhub.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> categories() {
        return ResponseEntity.ok(Map.of(
                "categories", InquiryService.CATEGORIES,
                "statuses", InquiryService.STATUSES
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(@AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole()) && !"SUPPORT".equals(principal.getRole())) {
            throw ApiException.forbidden("Staff access required");
        }
        return ResponseEntity.ok(inquiryService.stats());
    }

    @GetMapping("/mine")
    public ResponseEntity<Map<String, Object>> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("items", inquiryService.listByCustomer(principal.getId())));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {

        if (!"ADMIN".equals(principal.getRole()) && !"SUPPORT".equals(principal.getRole())) {
            throw ApiException.forbidden("Staff access required");
        }
        return ResponseEntity.ok(Map.of("items", inquiryService.listAll(status, category, q, limit, offset)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        Map<String, Object> inquiry = inquiryService.findById(id);
        if (inquiry == null) throw ApiException.notFound("Inquiry not found");

        Long customerId = (Long) inquiry.get("customer_id");
        if (!"ADMIN".equals(principal.getRole()) && !"SUPPORT".equals(principal.getRole())
                && !customerId.equals(principal.getId())) {
            throw ApiException.forbidden("You can only view your own inquiries");
        }

        return ResponseEntity.ok(Map.of(
                "inquiry", inquiry,
                "responses", inquiryService.getResponses(id)
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inquiryService.create(principal.getId(), body));
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<Map<String, Object>> respond(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {

        if (!"ADMIN".equals(principal.getRole()) && !"SUPPORT".equals(principal.getRole())) {
            throw ApiException.forbidden("Staff access required");
        }
        return ResponseEntity.ok(inquiryService.respond(principal.getId(), id, (String) body.get("message")));
    }

    @PostMapping("/{id}/clarify")
    public ResponseEntity<Map<String, Object>> clarify(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {

        if (!"ADMIN".equals(principal.getRole()) && !"SUPPORT".equals(principal.getRole())) {
            throw ApiException.forbidden("Staff access required");
        }
        return ResponseEntity.ok(inquiryService.requestClarification(principal.getId(), id, (String) body.get("message")));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<Map<String, Object>> reply(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {

        return ResponseEntity.ok(inquiryService.clarificationReply(principal.getId(), id, (String) body.get("message")));
    }
}
