package com.smarttea.lk.auth;

import java.time.Instant;

public record AuthSession(String token, String userId, Instant expiresAt) {
    public boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }
}
