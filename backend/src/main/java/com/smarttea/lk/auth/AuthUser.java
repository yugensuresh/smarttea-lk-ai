package com.smarttea.lk.auth;

public record AuthUser(String id, String email, String fullName, String passwordHash) {}
