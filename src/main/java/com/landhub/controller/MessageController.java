package com.landhub.controller;

import com.landhub.security.UserPrincipal;
import com.landhub.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> send(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.send(principal.getId(), body));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> conversations(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(messageService.getConversations(principal.getId()));
    }

    @GetMapping("/thread")
    public ResponseEntity<Map<String, Object>> thread(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("with") Long otherId,
            @RequestParam(value = "land_id", required = false) Long landId) {
        return ResponseEntity.ok(messageService.thread(principal.getId(), otherId, landId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> edit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(messageService.edit(principal.getId(), id, (String) body.get("body")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(messageService.delete(principal.getId(), id));
    }
}
