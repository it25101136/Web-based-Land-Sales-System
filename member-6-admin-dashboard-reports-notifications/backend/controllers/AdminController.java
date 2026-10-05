package controllers;

import com.landhub.security.UserPrincipal;
import services.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        return ResponseEntity.ok(adminService.overview());
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> analytics() {
        return ResponseEntity.ok(adminService.analytics());
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> users(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(Map.of("items", adminService.listUsers(role, q)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(adminService.updateUser(id, principal.getId(), body));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminService.deleteUser(id, principal.getId()));
    }

    @PostMapping("/accounts")
    public ResponseEntity<Map<String, Object>> createAccount(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createAccount(body));
    }

    @GetMapping("/lands")
    public ResponseEntity<Map<String, Object>> lands(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page) {
        return ResponseEntity.ok(adminService.listLands(status, limit, page));
    }

    @PutMapping("/lands/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyLand(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(adminService.verifyLand(id, (String) body.get("verification")));
    }

    @PutMapping("/lands/{id}/status")
    public ResponseEntity<Map<String, Object>> updateLandStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(adminService.updateLandStatus(id, principal.getId(), (String) body.get("status")));
    }

    @GetMapping("/reports/live")
    public ResponseEntity<Map<String, Object>> liveReports(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ResponseEntity.ok(adminService.liveReports(from, to));
    }

    @PostMapping("/reports")
    public ResponseEntity<Map<String, Object>> generateReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.generateReport(principal.getId(), (String) body.get("report_type")));
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> reports() {
        return ResponseEntity.ok(Map.of("items", adminService.listReports()));
    }

    @DeleteMapping("/reports/{id}")
    public ResponseEntity<Map<String, String>> deleteReport(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.deleteReport(id));
    }
}

