package com.smarttea.lk.auth.dto;

import com.smarttea.lk.auth.AuthUser;

public record AuthUserView(String id, String email, String fullName) {
    public static AuthUserView from(AuthUser user) {
        return new AuthUserView(user.id(), user.email(), user.fullName());
    }
}
