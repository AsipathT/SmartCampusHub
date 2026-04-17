package com.smartcampus.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String fullName;
    private String email;
    private String password;
    private String confirmPassword;
    private String role;
}
