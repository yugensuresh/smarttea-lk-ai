package com.smarttea.lk.service;

import com.smarttea.lk.auth.AuthSession;
import com.smarttea.lk.auth.AuthTokenStore;
import com.smarttea.lk.auth.AuthUser;
import com.smarttea.lk.auth.AuthUserRepository;
import com.smarttea.lk.auth.EmailAlreadyRegisteredException;
import com.smarttea.lk.auth.dto.AuthResponse;
import com.smarttea.lk.auth.dto.AuthUserView;
import com.smarttea.lk.auth.dto.LoginRequest;
import com.smarttea.lk.auth.dto.RegisterRequest;
import com.smarttea.lk.config.SmartteaAuthProperties;
import java.time.Duration;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AuthUserRepository users;
    private final AuthTokenStore tokens;
    private final SmartteaAuthProperties properties;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(AuthUserRepository users, AuthTokenStore tokens, SmartteaAuthProperties properties) {
        this.users = users;
        this.tokens = tokens;
        this.properties = properties;
    }

    public AuthResponse register(RegisterRequest request) {
        String hash = passwordEncoder.encode(request.password());
        AuthUser user;
        try {
            user = users.save(request.email(), request.fullName(), hash);
        } catch (EmailAlreadyRegisteredException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        return issueToken(user, false);
    }

    public AuthResponse login(LoginRequest request) {
        AuthUser user =
                users.findByEmail(request.email())
                        .orElseThrow(
                                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        return issueToken(user, request.rememberMe());
    }

    public AuthUserView me(String bearerToken) {
        String token = extractBearer(bearerToken);
        AuthSession session =
                tokens.findValid(token)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired session."));
        AuthUser user =
                users.findById(session.userId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
        return AuthUserView.from(user);
    }

    public void logout(String bearerToken) {
        tokens.revoke(extractBearer(bearerToken));
    }

    public PasswordEncoder passwordEncoder() {
        return passwordEncoder;
    }

    private AuthResponse issueToken(AuthUser user, boolean rememberMe) {
        long ttl =
                rememberMe ? properties.getLongTokenTtlSeconds() : properties.getTokenTtlSeconds();
        AuthSession session = tokens.createSession(user.id(), ttl);
        return new AuthResponse(session.token(), "Bearer", ttl, AuthUserView.from(user));
    }

    static String extractBearer(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header is required.");
        }
        String value = authorizationHeader.trim();
        if (value.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = value.substring(7).trim();
            if (!token.isEmpty()) {
                return token;
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header must be Bearer <token>.");
    }

    /** For tests and diagnostics. */
    public Instant sessionExpiry(String bearerToken) {
        String token = extractBearer(bearerToken);
        return tokens.findValid(token).map(AuthSession::expiresAt).orElse(null);
    }

    public Duration tokenTtl(boolean rememberMe) {
        return Duration.ofSeconds(
                rememberMe ? properties.getLongTokenTtlSeconds() : properties.getTokenTtlSeconds());
    }
}
