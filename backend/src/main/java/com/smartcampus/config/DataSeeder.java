package com.smartcampus.config;

import com.smartcampus.model.entity.User;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    /**
     * On startup:
     * 1. Ensures the admin account exists with a BCrypt password.
     * 2. Backfills any rows where full_name is NULL (legacy rows).
     * 3. Re-hashes any legacy plain-text passwords.
     */
    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            final String ADMIN_EMAIL    = "admin@smartcampus.edu";
            final String ADMIN_PASSWORD = "Admin@2024";

            // ── Step 1: Ensure admin exists ──────────────────────────────────
            Optional<User> existingAdmin = userRepository.findByEmail(ADMIN_EMAIL);

            if (existingAdmin.isEmpty()) {
                User admin = User.builder()
                        .fullName("System Administrator")
                        .username("admin")
                        .email(ADMIN_EMAIL)
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
                        .role("ADMIN")
                        .build();
                userRepository.save(admin);
                System.out.println("✅ Admin account created: " + ADMIN_EMAIL + " / " + ADMIN_PASSWORD);

            } else {
                User admin = existingAdmin.get();
                boolean changed = false;

                // Backfill fullName if NULL
                if (admin.getFullName() == null || admin.getFullName().isBlank()) {
                    admin.setFullName("System Administrator");
                    changed = true;
                }

                // Re-hash plain-text password
                if (!admin.getPassword().startsWith("$2a$") && !admin.getPassword().startsWith("$2b$")) {
                    admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                    System.out.println("🔑 Admin password upgraded to BCrypt hash");
                    changed = true;
                }

                if (changed) userRepository.save(admin);
            }

            // ── Step 2: Backfill fullName for other legacy users ──────────────
            userRepository.findAll().stream()
                .filter(u -> !u.getEmail().equals(ADMIN_EMAIL))
                .forEach(u -> {
                    boolean changed = false;

                    // Set a default fullName if NULL
                    if (u.getFullName() == null || u.getFullName().isBlank()) {
                        String derivedName = u.getUsername() != null
                            ? u.getUsername().substring(0, 1).toUpperCase() + u.getUsername().substring(1)
                            : "Student";
                        u.setFullName(derivedName);
                        changed = true;
                    }

                    // Re-hash plain-text passwords
                    if (!u.getPassword().startsWith("$2a$") && !u.getPassword().startsWith("$2b$")) {
                        System.out.println("⚠️  Re-hashing plain-text password for: " + u.getEmail());
                        u.setPassword(passwordEncoder.encode(u.getPassword())); // hash the existing plain text
                        changed = true;
                    }

                    if (changed) userRepository.save(u);
                });
        };
    }
}
