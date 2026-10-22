package com.smarttea.lk.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "smarttea.auth")
public class SmartteaAuthProperties {

    /** Access token lifetime when “remember me” is off (seconds). */
    private long tokenTtlSeconds = 86_400;

    /** Access token lifetime when “remember me” is on (seconds). */
    private long longTokenTtlSeconds = 2_592_000;

    private boolean seedDemoUser = true;
    private String demoEmail = "demo@smarttea.lk";
    private String demoPassword = "demo1234";
    private String demoFullName = "Demo Estate Manager";

    public long getTokenTtlSeconds() {
        return tokenTtlSeconds;
    }

    public void setTokenTtlSeconds(long tokenTtlSeconds) {
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    public long getLongTokenTtlSeconds() {
        return longTokenTtlSeconds;
    }

    public void setLongTokenTtlSeconds(long longTokenTtlSeconds) {
        this.longTokenTtlSeconds = longTokenTtlSeconds;
    }

    public boolean isSeedDemoUser() {
        return seedDemoUser;
    }

    public void setSeedDemoUser(boolean seedDemoUser) {
        this.seedDemoUser = seedDemoUser;
    }

    public String getDemoEmail() {
        return demoEmail;
    }

    public void setDemoEmail(String demoEmail) {
        this.demoEmail = demoEmail;
    }

    public String getDemoPassword() {
        return demoPassword;
    }

    public void setDemoPassword(String demoPassword) {
        this.demoPassword = demoPassword;
    }

    public String getDemoFullName() {
        return demoFullName;
    }

    public void setDemoFullName(String demoFullName) {
        this.demoFullName = demoFullName;
    }
}
