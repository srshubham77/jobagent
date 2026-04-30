package com.jobagent.tracker.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CurrentUserIdResolver.MissingUserIdException.class)
    public ResponseEntity<Map<String, String>> handleMissingUserId(CurrentUserIdResolver.MissingUserIdException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
