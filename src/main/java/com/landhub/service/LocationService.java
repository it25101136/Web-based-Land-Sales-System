package com.landhub.service;

import com.landhub.repository.LandRepository;
import com.landhub.util.MeasurementUtil;
import com.landhub.util.SriLankaData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LandRepository landRepo;

    public Map<String, Object> hierarchy() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("provinces", SriLankaData.PROVINCES);
        m.put("districts", SriLankaData.DISTRICTS);
        m.put("cities", SriLankaData.CITIES);
        m.put("district_si", SriLankaData.DISTRICT_SI);
        m.put("district_ta", SriLankaData.DISTRICT_TA);
        m.put("coords", SriLankaData.DISTRICT_COORDS);
        m.put("expressways", SriLankaData.EXPRESSWAYS);
        m.put("land_types", SriLankaData.LAND_TYPES);
        m.put("nearby_places", SriLankaData.NEARBY_PLACES);
        return m;
    }

    public Map<String, Object> districtCities(String district) {
        List<String> cities = SriLankaData.CITIES.getOrDefault(district, List.of());
        return Map.of("district", district, "cities", cities);
    }

    public Map<String, Object> summary() {
        Map<String, Object> m = new LinkedHashMap<>();
        List<Object[]> rows = landRepo.districtCounts();

        // Aggregate per province
        Map<String, List<Map<String, Object>>> provinceMap = new LinkedHashMap<>();
        long total = 0;
        for (Object[] r : rows) {
            String district = (String) r[0];
            String province = (String) r[1];
            long count = ((Number) r[2]).longValue();
            long avgPpp = ((Number) r[3]).longValue();
            total += count;

            provinceMap.computeIfAbsent(province, k -> new ArrayList<>()).add(Map.of(
                    "district", district, "count", count, "avg_ppp", avgPpp
            ));
        }

        List<Map<String, Object>> provinces = new ArrayList<>();
        for (var entry : provinceMap.entrySet()) {
            long pCount = entry.getValue().stream().mapToLong(d -> (long) d.get("count")).sum();
            provinces.add(Map.of("province", entry.getKey(), "count", pCount, "districts", entry.getValue()));
        }

        m.put("provinces", provinces);
        m.put("total", total);
        return m;
    }

    public Map<String, Object> convert(double value, String from, String to) {
        double result = MeasurementUtil.convert(value, from, to);
        long rounded = Math.round(result);
        return Map.of("value", value, "from", from, "to", to, "result", rounded);
    }
}
