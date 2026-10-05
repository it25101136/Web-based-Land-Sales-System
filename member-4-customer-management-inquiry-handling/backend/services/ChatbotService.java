package services;

import models.Land;
import models.LandStatus;
import data.LandRepository;
import com.landhub.util.MeasurementUtil;
import com.landhub.util.SriLankaData;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final LandRepository landRepo;
    private final LandService landService;

    private static final String DISCLAIMER = "This is automated assistance, not legal or financial advice. Always consult a qualified lawyer or surveyor before purchasing property in Sri Lanka.";

    private static final Pattern PRICE_RS = Pattern.compile("(?:rs\\.?|lkr)\\s*([\\d,.]+)\\s*(m(?:illion)?|k)?", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRICE_UNDER = Pattern.compile("under\\s+(?:rs\\.?|lkr)?\\s*([\\d,.]+)\\s*(m(?:illion)?|k)?", Pattern.CASE_INSENSITIVE);
    private static final Pattern PERCH_PAT = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*perch", Pattern.CASE_INSENSITIVE);

    public Map<String, Object> process(String message) {
        if (message == null || message.isBlank()) {
            return Map.of("text", "Please ask me about property in Sri Lanka.", "disclaimer", DISCLAIMER);
        }
        String lower = message.toLowerCase();

        // FAQ: what is a perch?
        if (lower.contains("what is a perch") || lower.contains("what's a perch") || lower.contains("perch meaning")) {
            return Map.of("text",
                    "A perch is the standard Sri Lankan land measurement unit. 1 perch = 272.25 sq.ft = 25.29 sq.m. " +
                    "There are 160 perches in 1 acre, and 40 perches in 1 rood.",
                    "disclaimer", DISCLAIMER);
        }

        // FAQ: documents
        if (lower.contains("document") && (lower.contains("check") || lower.contains("buy") || lower.contains("need"))) {
            return Map.of("text",
                    "Before buying land in Sri Lanka, always verify: (1) The deed (à¶´à¶©à·” à¶”à¶´à·Šà¶´à·”à·€) with a survey plan, " +
                    "(2) Land Registry extract, (3) No encumbrances certificate, (4) Local authority building line certificate, " +
                    "(5) Title search report from a qualified lawyer. A licensed surveyor should confirm boundaries.",
                    "disclaimer", DISCLAIMER + " Always engage a qualified lawyer for legal advice.");
        }

        // Property search
        Map<String, Object> filters = extractFilters(lower);
        String text;

        if (filters.isEmpty() && !lower.contains("land") && !lower.contains("property")) {
            text = "I can help you find property in Sri Lanka. Try asking: \"Show me residential land in Colombo under Rs. 10 million\" " +
                   "or \"Find tea land in Nuwara Eliya\".";
            return Map.of("text", text, "disclaimer", DISCLAIMER);
        }

        // Search
        Map<String, Object> searchParams = new LinkedHashMap<>(filters);
        searchParams.put("limit", 5);
        Map<String, Object> results = landService.search(searchParams);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) results.get("items");
        long total = (long) results.get("total");

        if (items.isEmpty()) {
            text = "I couldn't find any properties matching your criteria. Try broadening your search.";
        } else {
            text = "I found " + total + " propert" + (total == 1 ? "y" : "ies") + " matching your request. Here are the top results:";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("text", text);
        response.put("filters", filters);
        response.put("results", items);
        response.put("total", total);
        response.put("disclaimer", DISCLAIMER);
        return response;
    }

    private Map<String, Object> extractFilters(String lower) {
        Map<String, Object> filters = new LinkedHashMap<>();

        // Land type
        for (String type : SriLankaData.LAND_TYPES) {
            if (lower.contains(type.toLowerCase())) {
                filters.put("land_type", type);
                break;
            }
        }

        // District
        for (String d : SriLankaData.allDistricts()) {
            if (lower.contains(d.toLowerCase())) {
                filters.put("district", d);
                break;
            }
        }

        // City â†’ resolve to district
        if (!filters.containsKey("district")) {
            for (var entry : SriLankaData.CITIES.entrySet()) {
                for (String city : entry.getValue()) {
                    if (lower.contains(city.toLowerCase())) {
                        filters.put("city", city);
                        filters.put("district", entry.getKey());
                        break;
                    }
                }
                if (filters.containsKey("city")) break;
            }
        }

        // Price
        Matcher underM = PRICE_UNDER.matcher(lower);
        if (underM.find()) {
            filters.put("max_price", parsePrice(underM.group(1), underM.group(2)));
        } else {
            Matcher priceM = PRICE_RS.matcher(lower);
            if (priceM.find()) {
                long price = parsePrice(priceM.group(1), priceM.group(2));
                if (lower.contains("under") || lower.contains("below") || lower.contains("less than") || lower.contains("max")) {
                    filters.put("max_price", price);
                } else {
                    filters.put("max_price", price);
                }
            }
        }

        // Perches
        Matcher perchM = PERCH_PAT.matcher(lower);
        if (perchM.find()) {
            double p = Double.parseDouble(perchM.group(1));
            filters.put("min_perches", p);
        }

        return filters;
    }

    private long parsePrice(String numStr, String suffix) {
        double n = Double.parseDouble(numStr.replace(",", ""));
        if (suffix != null) {
            String s = suffix.toLowerCase();
            if (s.startsWith("m")) n *= 1_000_000;
            else if (s.startsWith("k")) n *= 1_000;
        }
        return (long) n;
    }
}

