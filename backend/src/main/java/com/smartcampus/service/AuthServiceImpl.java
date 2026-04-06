package com.smartcampus.service;

import com.smartcampus.dto.AuthResponse;
import com.smartcampus.dto.LoginRequest;
import com.smartcampus.dto.RegisterRequest;
import com.smartcampus.model.entity.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    // ── REGISTER ──────────────────────────────────────────────────────────────
    @Override
    public AuthResponse register(RegisterRequest request) {

        // 1. Confirm password match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // 2. Enforce SLIIT student email domain
        if (!request.getEmail().toLowerCase().endsWith("@my.sliit.lk")) {
            throw new IllegalArgumentException(
                "Registration is restricted to SLIIT students. Please use your @my.sliit.lk email."
            );
        }

        // 3. Check for duplicate email
        if (userRepository.findByEmail(request.getEmail().toLowerCase()).isPresent()) {
            throw new IllegalArgumentException(
                "An account with this email already exists. Please login instead."
            );
        }

        // 4. Derive username from student ID (part before @)
        String username = request.getEmail().split("@")[0].toLowerCase();

        // 5. Check username uniqueness (edge case)
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException(
                "An account for this student ID already exists. Please login instead."
            );
        }

        // 6. Build and persist user
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .username(username)
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .build();

        User saved = userRepository.save(user);

        // 7. Generate a simple opaque session token (UUID-based)
        String token = UUID.randomUUID().toString();

        return AuthResponse.builder()
                .token(token)
                .id(String.valueOf(saved.getId()))
                .fullName(saved.getFullName())
                .profileImage(saved.getProfileImage())
                .email(saved.getEmail())
                .role(saved.getRole())
                .message("Registration successful! Welcome to Smart Campus Hub.")
                .build();
    }

    // ── EMAIL CHECK ────────────────────────────────────────────────────────────
    public boolean emailExists(String email) {
        return userRepository.findByEmail(email.toLowerCase()).isPresent();
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    @Override
    public AuthResponse login(LoginRequest request) {

        // 1. Look up user by email (case-insensitive)
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException(
                    "No account found with this email. Please register first."
                ));

        // 2. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password. Please try again.");
        }

        // 3. Generate a simple opaque session token
        String token = UUID.randomUUID().toString();

        return AuthResponse.builder()
                .token(token)
                .id(String.valueOf(user.getId()))
                .fullName(user.getFullName())
                .profileImage(user.getProfileImage())
                .email(user.getEmail())
                .role(user.getRole())
                .message("Welcome back, " + user.getFullName() + "! You have successfully logged into Smart Campus Hub.")
                .build();
    }

    // ── UPDATE PROFILE ─────────────────────────────────────────────────────────
    @Override
    public AuthResponse updateProfile(Long userId, String fullName, String profileImage) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean updated = false;
        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
            updated = true;
        }
        if (profileImage != null && !profileImage.trim().isEmpty()) {
            user.setProfileImage(profileImage.trim());
            updated = true;
        }

        User saved = updated ? userRepository.save(user) : user;

        if (updated) {
            notificationService.createAsyncNotification(
                saved.getId(), 
                "You recently updated your profile details.", 
                "PROFILE"
            );
        }

        return AuthResponse.builder()
                .token("") // keep existing token on frontend
                .id(String.valueOf(saved.getId()))
                .fullName(saved.getFullName())
                .profileImage(saved.getProfileImage())
                .email(saved.getEmail())
                .role(saved.getRole())
                .message("Profile updated successfully")
                .build();
    }
}
