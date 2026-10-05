package com.landhub.controller;

import com.landhub.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(chatbotService.process((String) body.get("message")));
    }
}
