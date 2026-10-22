package com.smarttea.lk.config;

import com.smarttea.lk.auth.AuthUser;
import com.smarttea.lk.auth.AuthUserRepository;
import com.smarttea.lk.service.AuthService;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class AuthConfig {

    private final AuthUserRepository users;
    private final AuthService authService;
    private final SmartteaAuthProperties authProperties;

    public AuthConfig(AuthUserRepository users, AuthService authService, SmartteaAuthProperties authProperties) {
        this.users = users;
        this.authService = authService;
        this.authProperties = authProperties;
    }

    @PostConstruct
    void seedDemoUser() {
        if (!authProperties.isSeedDemoUser() || !users.isEmpty()) {
            return;
        }
        String hash = authService.passwordEncoder().encode(authProperties.getDemoPassword());
        users.saveSeed(
                new AuthUser(
                        "demo-user",
                        AuthUserRepository.normalizeEmail(authProperties.getDemoEmail()),
                        authProperties.getDemoFullName(),
                        hash));
    }
}
