package com.smarttea.lk.auth;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class AuthUserRepository {

    private final Map<String, AuthUser> byId = new ConcurrentHashMap<>();
    private final Map<String, String> idByEmail = new ConcurrentHashMap<>();

    public Optional<AuthUser> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        String key = normalizeEmail(email);
        String id = idByEmail.get(key);
        if (id == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(byId.get(id));
    }

    public Optional<AuthUser> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    public AuthUser save(String email, String fullName, String passwordHash) {
        String normalized = normalizeEmail(email);
        if (idByEmail.containsKey(normalized)) {
            throw new EmailAlreadyRegisteredException();
        }
        String id = UUID.randomUUID().toString();
        AuthUser user = new AuthUser(id, normalized, fullName.trim(), passwordHash);
        byId.put(id, user);
        idByEmail.put(normalized, id);
        return user;
    }

    public void saveSeed(AuthUser user) {
        byId.put(user.id(), user);
        idByEmail.put(user.email(), user.id());
    }

    public boolean isEmpty() {
        return byId.isEmpty();
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
