package com.smartcampus.service;

import com.smartcampus.dto.CreateUserRequest;
import com.smartcampus.dto.UpdateUserRequest;
import com.smartcampus.dto.UserDto;

import java.util.List;

public interface UserService {
    List<UserDto> getAllUsers();
    void deleteUser(Long id);
    UserDto createUser(CreateUserRequest request);
    UserDto updateUser(Long id, UpdateUserRequest request);
}
