package controllers;

import com.landhub.security.UserPrincipal;
import services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = authService.register(
                (String) body.get("full_name"),
                (String) body.get("email"),
                (String) body.get("phone"),
                (String) body.getOrDefault("role", "BUYER"),
                (String) body.get("password"),
                (String) body.get("nic"),
                (String) body.get("company_name"),
                (String) body.get("agency_name"),
                (String) body.get("language")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(authService.login(
                (String) body.get("email"), (String) body.get("password")));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(authService.forgotPassword((String) body.get("email")));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(authService.changePassword(
                principal.getId(), (String) body.get("current_password"), (String) body.get("new_password")));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of(
                "id", principal.getId(), "role", principal.getRole(),
                "email", principal.getEmail(), "name", principal.getFullName()));
    }
}

