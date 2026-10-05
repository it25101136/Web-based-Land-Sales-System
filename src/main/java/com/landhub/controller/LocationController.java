package com.landhub.controller;

import com.landhub.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> hierarchy() {
        return ResponseEntity.ok(locationService.hierarchy());
    }

    @GetMapping("/districts/{district}/cities")
    public ResponseEntity<Map<String, Object>> cities(@PathVariable String district) {
        return ResponseEntity.ok(locationService.districtCities(district));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        return ResponseEntity.ok(locationService.summary());
    }

    @GetMapping("/convert")
    public ResponseEntity<Map<String, Object>> convert(
            @RequestParam double value,
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(locationService.convert(value, from, to));
    }
}
