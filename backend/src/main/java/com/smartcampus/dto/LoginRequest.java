package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Pattern(
        regexp = "^[a-zA-Z0-9._%+\\-]+@(my\\.sliit\\.lk|smartcampus\\.edu)$",
        message = "Invalid email format"
    )
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
