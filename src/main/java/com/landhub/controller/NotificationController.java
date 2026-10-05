package com.landhub.controller;

import com.landhub.security.UserPrincipal;
import com.landhub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@AuthenticationPrincipal UserPrincipal principal) {
        var items = notificationService.list(principal.getId(), false);
        long unread = notificationService.unreadCount(principal.getId());
        return ResponseEntity.ok(Map.of("items", items, "unread", unread));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markRead(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> remove(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.remove(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}
