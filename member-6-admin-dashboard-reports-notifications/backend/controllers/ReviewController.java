package controllers;

import com.landhub.security.UserPrincipal;
import services.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.create(principal.getId(), body));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("items", reviewService.forUser(principal.getId(), principal.getRole())));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Map<String, Object>> forSeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(reviewService.listForSeller(sellerId));
    }

    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> pending(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("items", reviewService.pending()));
    }

    @PutMapping("/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderate(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(reviewService.moderate(id, (String) body.get("status")));
    }
}

