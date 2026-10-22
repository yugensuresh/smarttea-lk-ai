package com.smarttea.lk.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({SmartteaMlProperties.class, SmartteaAuthProperties.class})
public class SmartteaMlConfig {}
