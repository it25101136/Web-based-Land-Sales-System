package com.landhub.controller;

import com.landhub.exception.ApiException;
import com.landhub.security.UserPrincipal;
import com.landhub.service.LandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/lands")
@RequiredArgsConstructor
public class LandController {

    private final LandService landService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(@RequestParam Map<String, String> params) {
        Map<String, Object> filters = new LinkedHashMap<>(params);
        // Convert "true"/"false" strings to booleans for verified
        if ("true".equals(params.get("verified"))) filters.put("verified", true);
        return ResponseEntity.ok(landService.search(filters));
    }

    @GetMapping("/featured")
    public ResponseEntity<Map<String, Object>> featured() {
        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("verified", true);
        filters.put("sort", "popular");
        filters.put("limit", 6);
        return ResponseEntity.ok(landService.search(filters));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(landService.get(id, viewerId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        if (!"SELLER".equals(principal.getRole()) && !"AGENT".equals(principal.getRole()) && !"ADMIN".equals(principal.getRole()))
            throw ApiException.forbidden("Only sellers and agents can create listings");
        return ResponseEntity.status(HttpStatus.CREATED).body(landService.create(principal.getId(), body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(landService.update(id, principal.getId(), principal.getRole(), body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(landService.remove(id, principal.getId(), principal.getRole()));
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<Map<String, String>> addImages(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> urls = (List<String>) body.get("urls");
        Map<String, Object> updateBody = Map.of("images", urls != null ? urls : List.of());
        landService.update(id, principal.getId(), principal.getRole(), new LinkedHashMap<>(updateBody));
        return ResponseEntity.ok(Map.of("message", "Images updated"));
    }

    @GetMapping("/seller/{sellerId}/stats")
    public ResponseEntity<Map<String, Object>> sellerStats(
            @PathVariable Long sellerId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(landService.sellerStats(sellerId));
    }
}
