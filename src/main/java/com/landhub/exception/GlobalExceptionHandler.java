package com.landhub.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                ex.getMessage(),
                ex.getDetails(),
                request.getRequestURI(),
                Instant.now().toString()
        );
        return ResponseEntity.status(ex.getHttpStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> details = new HashMap<>();
        for (FieldError err : ex.getBindingResult().getFieldErrors()) {
            details.put(err.getField(), err.getDefaultMessage());
        }
        ErrorResponse body = new ErrorResponse(
                "Validation failed",
                details,
                request.getRequestURI(),
                Instant.now().toString()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoResourceFoundException ex, HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/")) {
            ErrorResponse body = new ErrorResponse(
                    "Endpoint " + path + " does not exist",
                    null,
                    path,
                    Instant.now().toString()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
        // Non-API paths: let the SPA fallback handle them
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                new ErrorResponse("Not found", null, path, Instant.now().toString())
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex, HttpServletRequest request) {
        String msg = ex.getMessage();
        if (ex.getClass().getSimpleName().contains("ClientAbort")
                || ex.getClass().getSimpleName().contains("AsyncRequestNotUsable")
                || (msg != null && (msg.contains("aborted by the software") || msg.contains("Broken pipe")))) {
            return null;
        }

        ex.printStackTrace();
        ErrorResponse body = new ErrorResponse(
                "Internal server error",
                null,
                request.getRequestURI(),
                Instant.now().toString()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
