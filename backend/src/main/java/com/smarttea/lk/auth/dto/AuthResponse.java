package com.smarttea.lk.auth.dto;

public record AuthResponse(
        String accessToken, String tokenType, long expiresIn, AuthUserView user) {}
