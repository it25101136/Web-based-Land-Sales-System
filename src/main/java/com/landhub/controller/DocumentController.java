package com.landhub.controller;

import com.landhub.security.UserPrincipal;
import com.landhub.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.upload(principal.getId(), body));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> all(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("items", documentService.all()));
    }

    @GetMapping("/mine")
    public ResponseEntity<Map<String, Object>> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("items", documentService.mine(principal.getId())));
    }

    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> pending(@AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole()))
            throw com.landhub.exception.ApiException.forbidden("Admin access required");
        return ResponseEntity.ok(Map.of("items", documentService.pending()));
    }

    @GetMapping("/land/{landId}")
    public ResponseEntity<Map<String, Object>> forLand(@PathVariable Long landId) {
        return ResponseEntity.ok(Map.of("items", documentService.forLand(landId)));
    }

    @GetMapping("/types")
    public ResponseEntity<Map<String, Object>> types() {
        return ResponseEntity.ok(documentService.types());
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<Map<String, Object>> review(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(documentService.review(
                id, principal.getId(), (String) body.get("status"), (String) body.get("remarks")));
    }
}
