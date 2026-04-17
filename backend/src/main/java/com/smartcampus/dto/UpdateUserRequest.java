package com.smartcampus.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String email;
    private String role;
    private String profileImage;
    private String password;
    private String confirmPassword;
}
