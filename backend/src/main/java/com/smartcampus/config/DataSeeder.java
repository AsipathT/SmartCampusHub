package com.smartcampus.config;

import com.smartcampus.model.entity.User;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = User.builder()
                        .username("admin")
                        .password("admin")
                        .email("admin@smartcampus.edu")
                        .role("ADMIN")
                        .build();
                userRepository.save(admin);

                User student = User.builder()
                        .username("student")
                        .password("student")
                        .email("student@smartcampus.edu")
                        .role("STUDENT")
                        .build();
                userRepository.save(student);
            }
        };
    }
}
