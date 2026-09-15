package com.landhub.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/** Module 1 - a logged-in user viewing/editing their own profile. */
@Controller
@org.springframework.web.bind.annotation.RequestMapping("/profile")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public String viewProfile(@AuthenticationPrincipal AppUserPrincipal principal, Model model) {
        model.addAttribute("user", principal.getUser());
        return "auth/profile";
    }

    @PostMapping("/update")
    public String updateProfile(@AuthenticationPrincipal AppUserPrincipal principal,
                                 @RequestParam String fullName,
                                 @RequestParam String phone,
                                 Model model) {
        User updated = userService.updateProfile(principal.getUser().getId(), fullName, phone);
        model.addAttribute("user", updated);
        model.addAttribute("success", "Profile updated successfully.");
        return "auth/profile";
    }

    @PostMapping("/change-password")
    public String changePassword(@AuthenticationPrincipal AppUserPrincipal principal,
                                  @RequestParam String currentPassword,
                                  @RequestParam String newPassword,
                                  Model model) {
        model.addAttribute("user", principal.getUser());
        if (!userService.matches(currentPassword, principal.getUser().getPassword())) {
            model.addAttribute("error", "Current password is incorrect.");
            return "auth/profile";
        }
        userService.changePassword(principal.getUser().getId(), newPassword);
        model.addAttribute("success", "Password changed successfully. Please log in again next time with the new password.");
        return "auth/profile";
    }
}
