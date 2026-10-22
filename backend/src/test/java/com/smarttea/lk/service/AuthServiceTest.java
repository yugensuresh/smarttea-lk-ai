package com.smarttea.lk.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.smarttea.lk.auth.AuthUserRepository;
import com.smarttea.lk.auth.AuthTokenStore;
import com.smarttea.lk.auth.dto.LoginRequest;
import com.smarttea.lk.auth.dto.RegisterRequest;
import com.smarttea.lk.config.SmartteaAuthProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class AuthServiceTest {

    private AuthService authService;

    @BeforeEach
    void setUp() {
        SmartteaAuthProperties props = new SmartteaAuthProperties();
        authService = new AuthService(new AuthUserRepository(), new AuthTokenStore(), props);
    }

    @Test
    void registerAndLoginRoundTrip() {
        authService.register(new RegisterRequest("Ada Lovelace", "ada@example.com", "password123"));
        var response = authService.login(new LoginRequest("ada@example.com", "password123", false));
        assertNotNull(response.accessToken());
        assertEquals("ada@example.com", response.user().email());
    }

    @Test
    void loginRejectsBadPassword() {
        authService.register(new RegisterRequest("Ada Lovelace", "ada@example.com", "password123"));
        assertThrows(
                ResponseStatusException.class,
                () -> authService.login(new LoginRequest("ada@example.com", "wrongpass1", false)));
    }
}
