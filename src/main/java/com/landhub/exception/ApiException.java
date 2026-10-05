package com.landhub.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import java.util.Map;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus httpStatus;
    private final Map<String, String> details;

    public ApiException(HttpStatus httpStatus, String message, Map<String, String> details) {
        super(message);
        this.httpStatus = httpStatus;
        this.details = details;
    }

    public ApiException(HttpStatus httpStatus, String message) {
        this(httpStatus, message, null);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message != null ? message : "Bad request");
    }

    public static ApiException badRequest(String message, Map<String, String> details) {
        return new ApiException(HttpStatus.BAD_REQUEST, message != null ? message : "Bad request", details);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message != null ? message : "Authentication required");
    }

    public static ApiException unauthorized() {
        return unauthorized(null);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message != null ? message : "Access denied");
    }

    public static ApiException forbidden() {
        return forbidden(null);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message != null ? message : "Resource not found");
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message != null ? message : "Conflict");
    }
}
