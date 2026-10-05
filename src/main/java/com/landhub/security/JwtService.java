package com.landhub.security;

import com.landhub.config.AppProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(AppProperties props) {
        // Ensure key is at least 256 bits for HS256
        byte[] keyBytes = props.getJwtSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = props.getJwtExpirationMs();
    }

    public String sign(Long userId, String role, String email, String fullName) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .claim("email", email)
                .claim("name", fullName)
                .issuer("landhub.lk")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public Claims verify(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer("landhub.lk")
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public String getRole(Claims claims) {
        return claims.get("role", String.class);
    }

    public String getEmail(Claims claims) {
        return claims.get("email", String.class);
    }

    public String getName(Claims claims) {
        return claims.get("name", String.class);
    }
}
