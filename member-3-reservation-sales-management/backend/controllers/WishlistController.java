package controllers;

import com.landhub.security.UserPrincipal;
import services.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("items", wishlistService.list(principal.getId())));
    }

    @PostMapping("/{landId}")
    public ResponseEntity<Map<String, String>> add(
            @PathVariable Long landId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wishlistService.add(principal.getId(), landId));
    }

    @DeleteMapping("/{landId}")
    public ResponseEntity<Map<String, String>> remove(
            @PathVariable Long landId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(wishlistService.remove(principal.getId(), landId));
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> compare(
            @RequestParam String ids,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Long::parseLong).collect(Collectors.toList());
        return ResponseEntity.ok(wishlistService.compare(principal.getId(), idList));
    }

    @GetMapping("/recently-viewed")
    public ResponseEntity<Map<String, Object>> recentlyViewed(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(wishlistService.recentlyViewed(principal.getId()));
    }
}

