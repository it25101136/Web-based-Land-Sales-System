package com.landhub.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/** Module 1 - handles the public-facing login and registration pages. */
@Controller
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/login")
    public String loginPage() {
        return "auth/login";
    }

    @GetMapping("/register")
    public String registerPage(Model model) {
        model.addAttribute("form", new RegisterForm());
        return "auth/register";
    }

    @PostMapping("/register")
    public String register(@ModelAttribute("form") RegisterForm form, Model model) {
        try {
            Role role = "SELLER".equalsIgnoreCase(form.getAccountType()) ? Role.SELLER : Role.BUYER;
            userService.register(form.getFullName(), form.getEmail(), form.getPassword(), form.getPhone(), role);
            model.addAttribute("success", "Account created! You can now log in.");
            model.addAttribute("form", new RegisterForm());
            return "auth/login";
        } catch (IllegalArgumentException ex) {
            model.addAttribute("error", ex.getMessage());
            return "auth/register";
        }
    }

    /** Simple form-backing object for the registration page. */
    public static class RegisterForm {
        @NotBlank private String fullName;
        @Email @NotBlank private String email;
        @Size(min = 6, message = "Password must be at least 6 characters") private String password;
        private String phone;
        private String accountType = "BUYER";

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAccountType() { return accountType; }
        public void setAccountType(String accountType) { this.accountType = accountType; }
    }
}
