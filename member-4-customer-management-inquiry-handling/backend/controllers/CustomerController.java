package controllers;

import com.landhub.exception.ApiException;
import com.landhub.security.UserPrincipal;
import services.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(@AuthenticationPrincipal UserPrincipal principal) {
        verifyStaff(principal);
        return ResponseEntity.ok(customerService.stats());
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {

        verifyStaff(principal);
        var items = customerService.list(status, q, limit, offset);
        long total = customerService.count(status, q);
        return ResponseEntity.ok(Map.of("items", items, "total", total));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        verifyStaff(principal);
        Map<String, Object> customer = customerService.findById(id);
        if (customer == null) throw ApiException.notFound("Customer not found");
        return ResponseEntity.ok(customer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {

        verifyStaff(principal);
        return ResponseEntity.ok(customerService.update(id, body));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> setStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {

        verifyStaff(principal);
        String status = (String) body.get("status");
        if (status == null || status.isBlank()) {
            throw ApiException.badRequest("Status is required");
        }
        return ResponseEntity.ok(customerService.setStatus(id, status));
    }

    private void verifyStaff(UserPrincipal principal) {
        if (principal == null || (!"ADMIN".equals(principal.getRole()) && !"SUPPORT".equals(principal.getRole()))) {
            throw ApiException.forbidden("Staff access required");
        }
    }
}

