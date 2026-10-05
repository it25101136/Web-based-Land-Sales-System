package com.landhub.controller;

import com.landhub.security.UserPrincipal;
import com.landhub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> profile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.profile(principal.getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), body));
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.dashboard(principal.getId()));
    }

    @GetMapping("/sellers/{id}/public")
    public ResponseEntity<Map<String, Object>> publicSellerProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.publicSellerProfile(id));
    }
}
