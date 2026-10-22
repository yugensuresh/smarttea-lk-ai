package com.smarttea.lk.auth;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class AuthTokenStore {

    private final Map<String, AuthSession> sessions = new ConcurrentHashMap<>();

    public AuthSession createSession(String userId, long ttlSeconds) {
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(Math.max(60, ttlSeconds));
        AuthSession session = new AuthSession(token, userId, expiresAt);
        sessions.put(token, session);
        return session;
    }

    public Optional<AuthSession> findValid(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        AuthSession session = sessions.get(token.trim());
        if (session == null || session.isExpired(Instant.now())) {
            if (session != null) {
                sessions.remove(token.trim());
            }
            return Optional.empty();
        }
        return Optional.of(session);
    }

    public void revoke(String token) {
        if (token != null) {
            sessions.remove(token.trim());
        }
    }
}
