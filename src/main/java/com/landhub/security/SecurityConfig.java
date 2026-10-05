package com.landhub.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.landhub.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;

import java.time.Instant;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(fo -> fo.sameOrigin())
                .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                .contentTypeOptions(cto -> {})
                .referrerPolicy(rp -> rp.policy(
                    org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER_WHEN_DOWNGRADE))
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/forgot-password").permitAll()
                .requestMatchers("/api/health", "/api/docs").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/lands", "/api/lands/featured", "/api/lands/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/locations", "/api/locations/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/documents/types", "/api/documents/land/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/seller/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/sellers/*/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/inquiries/categories").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/chatbot").permitAll()
                // Static resources
                .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/img/**", "/pages/**", "/uploads/**", "/favicon.ico", "/*.html").permitAll()
                // Admin and Support endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/customers/**").hasAnyRole("ADMIN", "SUPPORT")
                // Everything else needs authentication
                .anyRequest().authenticated()
            )
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType("application/json");
                    ErrorResponse body = new ErrorResponse(
                        "Authentication required", null, req.getRequestURI(), Instant.now().toString());
                    new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                        .writeValue(res.getWriter(), body);
                })
                .accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    res.setContentType("application/json");
                    ErrorResponse body = new ErrorResponse(
                        "Access denied", null, req.getRequestURI(), Instant.now().toString());
                    new ObjectMapper().setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                        .writeValue(res.getWriter(), body);
                })
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
