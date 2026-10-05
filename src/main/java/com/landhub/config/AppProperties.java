package com.landhub.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {

    private String jwtSecret = "landhub-sl-dev-secret-change-in-production";
    private long jwtExpirationMs = 28800000; // 8 hours
    private int bcryptRounds = 10;
    private String currency = "LKR";
    private String defaultLang = "en";
    private String uploadDir = "./uploads";
}
