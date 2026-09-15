package com.landhub.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Module 1 - User Authentication & Profile Management.
 * Implements the Create / Read / Update / Delete operations described
 * for this module in the project proposal.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** CREATE - register a new user account (buyer or seller from the public registration form). */
    public User register(String fullName, String email, String rawPassword, String phone, Role role) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account already exists with this email address.");
        }
        User user = new User(fullName, email, passwordEncoder.encode(rawPassword), phone, role);
        return userRepository.save(user);
    }

    /** READ - fetch the account for the currently logged-in user. */
    public User getByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id " + id));
    }

    /** READ (admin) - search / list all accounts. */
    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<User> findByRole(Role role) {
        return userRepository.findByRole(role);
    }

    /** UPDATE - edit profile details. */
    public User updateProfile(Long id, String fullName, String phone) {
        User user = getById(id);
        user.setFullName(fullName);
        user.setPhone(phone);
        return userRepository.save(user);
    }

    /** UPDATE - change password (requires current password to be verified by the caller/controller). */
    public void changePassword(Long id, String newRawPassword) {
        User user = getById(id);
        user.setPassword(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
    }

    /** UPDATE (admin only) - change a user's role/permissions. */
    public User updateRole(Long id, Role role) {
        User user = getById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    /** DELETE (soft) - suspend an account so it can no longer log in. */
    public void suspend(Long id) {
        User user = getById(id);
        user.setStatus(AccountStatus.SUSPENDED);
        userRepository.save(user);
    }

    /** UPDATE - reactivate a previously suspended account. */
    public void activate(Long id) {
        User user = getById(id);
        user.setStatus(AccountStatus.ACTIVE);
        userRepository.save(user);
    }

    /** DELETE - permanently remove an account. */
    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
