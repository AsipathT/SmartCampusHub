package com.smartcampus.service;

import com.smartcampus.dto.CreateUserRequest;
import com.smartcampus.dto.UpdateUserRequest;
import com.smartcampus.dto.UserDto;
import com.smartcampus.model.entity.User;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        userRepository.delete(user);
    }

    @Override
    public UserDto createUser(CreateUserRequest request) {
        String role = request.getRole();
        if (!"ADMIN".equals(role) && !"USER".equals(role)
                && !"LECTURER".equals(role) && !"MAINTENANCE_STAFF".equals(role)) {
            throw new IllegalArgumentException("Role must be ADMIN, USER, LECTURER, or MAINTENANCE_STAFF.");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        String email = request.getEmail().toLowerCase().trim();

        if ("USER".equals(role) && !email.endsWith("@my.sliit.lk")) {
            throw new IllegalArgumentException("Student accounts require a @my.sliit.lk email.");
        }

        if (("ADMIN".equals(role) || "LECTURER".equals(role) || "MAINTENANCE_STAFF".equals(role))
                && !email.endsWith("@smartcampus.edu")) {
            throw new IllegalArgumentException("Admin, Lecturer, and Maintenance Staff accounts require a @smartcampus.edu email.");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        String username = email.split("@")[0].toLowerCase();

        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("A user with this username already exists.");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        return toDto(userRepository.save(user));
    }

    @Override
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getRole() != null) {
            if (!"ADMIN".equals(request.getRole()) && !"USER".equals(request.getRole())
                    && !"LECTURER".equals(request.getRole()) && !"MAINTENANCE_STAFF".equals(request.getRole())) {
                throw new IllegalArgumentException("Role must be ADMIN, USER, LECTURER, or MAINTENANCE_STAFF.");
            }
            user.setRole(request.getRole());
        }

        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage().trim().isEmpty() ? null : request.getProfileImage().trim());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().toLowerCase().trim();
            if (!newEmail.equals(user.getEmail())) {
                String effectiveRole = request.getRole() != null ? request.getRole() : user.getRole();
                if ("USER".equals(effectiveRole) && !newEmail.endsWith("@my.sliit.lk")) {
                    throw new IllegalArgumentException("Student accounts require a @my.sliit.lk email.");
                }
                if (("ADMIN".equals(effectiveRole) || "LECTURER".equals(effectiveRole) || "MAINTENANCE_STAFF".equals(effectiveRole))
                        && !newEmail.endsWith("@smartcampus.edu")) {
                    throw new IllegalArgumentException("Admin, Lecturer, and Maintenance Staff accounts require a @smartcampus.edu email.");
                }
                userRepository.findByEmail(newEmail).ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new IllegalArgumentException("An account with this email already exists.");
                    }
                });
                String newUsername = newEmail.split("@")[0].toLowerCase();
                userRepository.findByUsername(newUsername).ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new IllegalArgumentException("A user with this username already exists.");
                    }
                });
                user.setEmail(newEmail);
                user.setUsername(newUsername);
            }
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("Passwords do not match.");
            }
            if (request.getPassword().length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters.");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return toDto(userRepository.save(user));
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImage(user.getProfileImage())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
