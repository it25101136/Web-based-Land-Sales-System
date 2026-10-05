package services;

import models.*;
import models.Role;
import models.UserStatus;
import com.landhub.exception.ApiException;
import data.*;
import com.landhub.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final BuyerRepository buyerRepo;
    private final SellerRepository sellerRepo;
    private final AgentRepository agentRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    private static final Pattern LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");

    private boolean strongEnough(String pw) {
        return pw != null && pw.length() >= 8 && LETTER.matcher(pw).find() && DIGIT.matcher(pw).find();
    }

    @Transactional
    public Map<String, Object> register(String fullName, String email, String phone, String role,
                                         String password, String nic, String companyName,
                                         String agencyName, String language) {
        email = email.trim().toLowerCase();
        if (userRepo.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        if (!strongEnough(password)) {
            throw ApiException.badRequest("Validation failed",
                    Map.of("password", "Password must be 8+ characters and include a letter and a number"));
        }
        Role r = Role.valueOf(role.toUpperCase());
        if (r == Role.ADMIN) {
            throw ApiException.forbidden("Administrator accounts are provisioned internally");
        }

        User user = userRepo.save(User.builder()
                .fullName(fullName).email(email).phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(r).nic(nic)
                .language(language != null ? com.landhub.entity.enums.Language.valueOf(language) : com.landhub.entity.enums.Language.en)
                .build());

        if (r == Role.BUYER) buyerRepo.save(Buyer.builder().userId(user.getId()).build());
        if (r == Role.SELLER) sellerRepo.save(Seller.builder().userId(user.getId()).companyName(companyName).build());
        if (r == Role.AGENT) agentRepo.save(Agent.builder().userId(user.getId()).agencyName(agencyName).build());

        notificationService.push(user.getId(), "WELCOME", "Welcome to LandHub Sri Lanka",
                "Your " + r.name().toLowerCase() + " account is ready. Ayubowan!", "/dashboard");

        String token = jwtService.sign(user.getId(), user.getRole().name(), user.getEmail(), user.getFullName());
        return Map.of("token", token, "user", userToMap(user));
    }

    public Map<String, Object> login(String email, String password) {
        email = (email != null ? email : "").trim().toLowerCase();
        User user = userRepo.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(password != null ? password : "", user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.forbidden("This account has been suspended. Contact support.");
        }
        String token = jwtService.sign(user.getId(), user.getRole().name(), user.getEmail(), user.getFullName());
        return Map.of("token", token, "user", userToMap(user));
    }

    public Map<String, String> forgotPassword(String email) {
        email = (email != null ? email : "").trim().toLowerCase();
        userRepo.findByEmailIgnoreCase(email).ifPresent(user ->
            notificationService.push(user.getId(), "PASSWORD_RESET", "Password reset requested",
                    "A password reset was requested for your account.", "/login")
        );
        return Map.of("message", "If that email is registered, reset instructions have been sent.");
    }

    @Transactional
    public Map<String, String> changePassword(Long userId, String currentPw, String newPw) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> ApiException.badRequest("User not found"));
        if (!passwordEncoder.matches(currentPw != null ? currentPw : "", user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        if (!strongEnough(newPw)) {
            throw ApiException.badRequest("New password must be 8+ characters with a letter and a number");
        }
        user.setPasswordHash(passwordEncoder.encode(newPw));
        userRepo.save(user);
        return Map.of("message", "Password updated successfully");
    }

    public Map<String, Object> userToMap(User u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("full_name", u.getFullName());
        m.put("email", u.getEmail());
        m.put("phone", u.getPhone());
        m.put("role", u.getRole().name());
        m.put("nic", u.getNic());
        m.put("avatar", u.getAvatar());
        m.put("language", u.getLanguage().name());
        m.put("status", u.getStatus().name());
        m.put("created_at", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        return m;
    }
}

