package com.landhub.util;

import java.util.*;

/**
 * Master reference data for Sri Lanka: 9 provinces, 25 districts,
 * cities/towns per district, expressways and land types.
 * Exact port of src/data/srilanka.js
 */
public final class SriLankaData {

    private SriLankaData() {}

    public static final List<Map<String, String>> PROVINCES = List.of(
        Map.of("name", "Western Province", "si", "බස්නාහිර පළාත", "ta", "மேல் மாகாணம்"),
        Map.of("name", "Central Province", "si", "මධ්‍යම පළාත", "ta", "மத்திய மாகாணம்"),
        Map.of("name", "Southern Province", "si", "දකුණු පළාත", "ta", "தென் மாகாணம்"),
        Map.of("name", "Northern Province", "si", "උතුරු පළාත", "ta", "வட மாகாணம்"),
        Map.of("name", "Eastern Province", "si", "නැගෙනහිර පළාත", "ta", "கிழக்கு மாகாணம்"),
        Map.of("name", "North Western Province", "si", "වයඹ පළාත", "ta", "வட மேல் மாகாணம்"),
        Map.of("name", "North Central Province", "si", "උතුරු මැද පළාත", "ta", "வட மத்திய மாகாணம்"),
        Map.of("name", "Uva Province", "si", "ඌව පළාත", "ta", "ஊவா மாகாணம்"),
        Map.of("name", "Sabaragamuwa Province", "si", "සබරගමුව පළාත", "ta", "சபரகமுவ மாகாணம்")
    );

    public static final Map<String, List<String>> DISTRICTS = new LinkedHashMap<>();
    static {
        DISTRICTS.put("Western Province", List.of("Colombo", "Gampaha", "Kalutara"));
        DISTRICTS.put("Central Province", List.of("Kandy", "Matale", "Nuwara Eliya"));
        DISTRICTS.put("Southern Province", List.of("Galle", "Matara", "Hambantota"));
        DISTRICTS.put("Northern Province", List.of("Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"));
        DISTRICTS.put("Eastern Province", List.of("Batticaloa", "Ampara", "Trincomalee"));
        DISTRICTS.put("North Western Province", List.of("Kurunegala", "Puttalam"));
        DISTRICTS.put("North Central Province", List.of("Anuradhapura", "Polonnaruwa"));
        DISTRICTS.put("Uva Province", List.of("Badulla", "Monaragala"));
        DISTRICTS.put("Sabaragamuwa Province", List.of("Ratnapura", "Kegalle"));
    }

    public static final Map<String, String> DISTRICT_SI = Map.ofEntries(
        Map.entry("Colombo", "කොළඹ"), Map.entry("Gampaha", "ගම්පහ"), Map.entry("Kalutara", "කළුතර"),
        Map.entry("Kandy", "මහනුවර"), Map.entry("Matale", "මාතලේ"), Map.entry("Nuwara Eliya", "නුවරඑළිය"),
        Map.entry("Galle", "ගාල්ල"), Map.entry("Matara", "මාතර"), Map.entry("Hambantota", "හම්බන්තොට"),
        Map.entry("Jaffna", "යාපනය"), Map.entry("Kilinochchi", "කිලිනොච්චිය"), Map.entry("Mannar", "මන්නාරම"),
        Map.entry("Vavuniya", "වවුනියාව"), Map.entry("Mullaitivu", "මුලතිව්"), Map.entry("Batticaloa", "මඩකලපුව"),
        Map.entry("Ampara", "අම්පාර"), Map.entry("Trincomalee", "ත්‍රිකුණාමලය"), Map.entry("Kurunegala", "කුරුණෑගල"),
        Map.entry("Puttalam", "පුත්තලම"), Map.entry("Anuradhapura", "අනුරාධපුර"), Map.entry("Polonnaruwa", "පොළොන්නරුව"),
        Map.entry("Badulla", "බදුල්ල"), Map.entry("Monaragala", "මොණරාගල"), Map.entry("Ratnapura", "රත්නපුර"),
        Map.entry("Kegalle", "කෑගල්ල")
    );

    public static final Map<String, String> DISTRICT_TA = Map.ofEntries(
        Map.entry("Colombo", "கொழும்பு"), Map.entry("Gampaha", "கம்பஹா"), Map.entry("Kalutara", "களுத்துறை"),
        Map.entry("Kandy", "கண்டி"), Map.entry("Matale", "மாத்தளை"), Map.entry("Nuwara Eliya", "நுவரெலியா"),
        Map.entry("Galle", "காலி"), Map.entry("Matara", "மாத்தறை"), Map.entry("Hambantota", "அம்பாந்தோட்டை"),
        Map.entry("Jaffna", "யாழ்ப்பாணம்"), Map.entry("Kilinochchi", "கிளிநொச்சி"), Map.entry("Mannar", "மன்னார்"),
        Map.entry("Vavuniya", "வவுனியா"), Map.entry("Mullaitivu", "முல்லைத்தீவு"), Map.entry("Batticaloa", "மட்டக்களப்பு"),
        Map.entry("Ampara", "அம்பாறை"), Map.entry("Trincomalee", "திருகோணமலை"), Map.entry("Kurunegala", "குருணாகல்"),
        Map.entry("Puttalam", "புத்தளம்"), Map.entry("Anuradhapura", "அனுராதபுரம்"), Map.entry("Polonnaruwa", "பொலநறுவை"),
        Map.entry("Badulla", "பதுளை"), Map.entry("Monaragala", "மொணராகலை"), Map.entry("Ratnapura", "இரத்தினபுரி"),
        Map.entry("Kegalle", "கேகாலை")
    );

    public static final Map<String, List<String>> CITIES = new LinkedHashMap<>();
    static {
        CITIES.put("Colombo", List.of("Colombo 05","Colombo 07","Dehiwala","Mount Lavinia","Nugegoda","Maharagama","Piliyandala","Kottawa","Homagama","Battaramulla","Malabe","Kolonnawa","Moratuwa","Kesbewa"));
        CITIES.put("Gampaha", List.of("Negombo","Gampaha","Kadawatha","Ja-Ela","Wattala","Minuwangoda","Nittambuwa","Kiribathgoda","Veyangoda","Katunayake"));
        CITIES.put("Kalutara", List.of("Kalutara","Panadura","Horana","Beruwala","Aluthgama","Matugama","Bandaragama","Wadduwa"));
        CITIES.put("Kandy", List.of("Kandy","Peradeniya","Katugastota","Gampola","Kundasale","Digana","Pilimathalawa","Akurana"));
        CITIES.put("Matale", List.of("Matale","Dambulla","Sigiriya","Ukuwela","Galewela","Rattota"));
        CITIES.put("Nuwara Eliya", List.of("Nuwara Eliya","Hatton","Talawakele","Ginigathhena","Walapane","Kotmale"));
        CITIES.put("Galle", List.of("Galle","Hikkaduwa","Unawatuna","Ambalangoda","Karapitiya","Baddegama","Elpitiya","Habaraduwa"));
        CITIES.put("Matara", List.of("Matara","Weligama","Mirissa","Akuressa","Dikwella","Hakmana","Kamburupitiya"));
        CITIES.put("Hambantota", List.of("Hambantota","Tangalle","Tissamaharama","Ambalantota","Beliatta","Sooriyawewa"));
        CITIES.put("Jaffna", List.of("Jaffna","Nallur","Chavakachcheri","Point Pedro","Chunnakam","Manipay"));
        CITIES.put("Kilinochchi", List.of("Kilinochchi","Paranthan","Poonakary","Pallai"));
        CITIES.put("Mannar", List.of("Mannar","Nanattan","Murunkan","Pesalai"));
        CITIES.put("Vavuniya", List.of("Vavuniya","Nedunkerny","Cheddikulam","Omanthai"));
        CITIES.put("Mullaitivu", List.of("Mullaitivu","Oddusuddan","Puthukkudiyiruppu","Mankulam"));
        CITIES.put("Batticaloa", List.of("Batticaloa","Kattankudy","Eravur","Valaichchenai","Kaluwanchikudy"));
        CITIES.put("Ampara", List.of("Ampara","Kalmunai","Akkaraipattu","Sainthamaruthu","Pottuvil","Arugam Bay"));
        CITIES.put("Trincomalee", List.of("Trincomalee","Kinniya","Nilaveli","Kantale","Muttur"));
        CITIES.put("Kurunegala", List.of("Kurunegala","Kuliyapitiya","Narammala","Polgahawela","Wariyapola","Mawathagama","Melsiripura"));
        CITIES.put("Puttalam", List.of("Puttalam","Chilaw","Wennappuwa","Marawila","Nattandiya","Anamaduwa"));
        CITIES.put("Anuradhapura", List.of("Anuradhapura","Kekirawa","Mihintale","Medawachchiya","Thambuttegama","Eppawala"));
        CITIES.put("Polonnaruwa", List.of("Polonnaruwa","Hingurakgoda","Medirigiriya","Manampitiya"));
        CITIES.put("Badulla", List.of("Badulla","Bandarawela","Ella","Haputale","Welimada","Mahiyanganaya","Diyatalawa"));
        CITIES.put("Monaragala", List.of("Monaragala","Wellawaya","Bibile","Buttala","Kataragama"));
        CITIES.put("Ratnapura", List.of("Ratnapura","Embilipitiya","Balangoda","Pelmadulla","Eheliyagoda","Kuruwita"));
        CITIES.put("Kegalle", List.of("Kegalle","Mawanella","Warakapola","Rambukkana","Ruwanwella","Dehiowita"));
    }

    public static final Map<String, double[]> DISTRICT_COORDS = Map.ofEntries(
        Map.entry("Colombo", new double[]{6.9271, 79.8612}), Map.entry("Gampaha", new double[]{7.0873, 79.9990}),
        Map.entry("Kalutara", new double[]{6.5854, 79.9607}), Map.entry("Kandy", new double[]{7.2906, 80.6337}),
        Map.entry("Matale", new double[]{7.4675, 80.6234}), Map.entry("Nuwara Eliya", new double[]{6.9497, 80.7891}),
        Map.entry("Galle", new double[]{6.0535, 80.2210}), Map.entry("Matara", new double[]{5.9549, 80.5550}),
        Map.entry("Hambantota", new double[]{6.1241, 81.1185}), Map.entry("Jaffna", new double[]{9.6615, 80.0255}),
        Map.entry("Kilinochchi", new double[]{9.3803, 80.3770}), Map.entry("Mannar", new double[]{8.9810, 79.9044}),
        Map.entry("Vavuniya", new double[]{8.7514, 80.4971}), Map.entry("Mullaitivu", new double[]{9.2671, 80.8142}),
        Map.entry("Batticaloa", new double[]{7.7170, 81.7000}), Map.entry("Ampara", new double[]{7.2917, 81.6747}),
        Map.entry("Trincomalee", new double[]{8.5874, 81.2152}), Map.entry("Kurunegala", new double[]{7.4863, 80.3623}),
        Map.entry("Puttalam", new double[]{8.0362, 79.8283}), Map.entry("Anuradhapura", new double[]{8.3114, 80.4037}),
        Map.entry("Polonnaruwa", new double[]{7.9403, 81.0188}), Map.entry("Badulla", new double[]{6.9934, 81.0550}),
        Map.entry("Monaragala", new double[]{6.8728, 81.3509}), Map.entry("Ratnapura", new double[]{6.6828, 80.3992}),
        Map.entry("Kegalle", new double[]{7.2513, 80.3464})
    );

    public static final List<String> EXPRESSWAYS = List.of(
        "Southern Expressway (E01)", "Central Expressway (E04)",
        "Colombo–Katunayake Expressway (E03)", "Outer Circular Expressway (E02)",
        "Ruwanpura Expressway (E06)"
    );

    public static final List<String> LAND_TYPES = List.of(
        "Residential", "Agricultural", "Commercial", "Coconut", "Tea", "Rubber",
        "Paddy", "Beach", "Industrial", "Bare", "Plantation", "Investment"
    );

    public static final List<String> NEARBY_PLACES = List.of(
        "School", "Hospital", "Bank", "Supermarket", "Railway Station",
        "Bus Stand", "Temple", "Expressway Interchange", "University", "Police Station"
    );

    /** Find the province that contains a given district. */
    public static String findProvince(String district) {
        for (var entry : DISTRICTS.entrySet()) {
            if (entry.getValue().contains(district)) return entry.getKey();
        }
        return null;
    }

    /** Get all districts as a flat list. */
    public static List<String> allDistricts() {
        return DISTRICTS.values().stream().flatMap(List::stream).toList();
    }

    /** Get all cities as a flat list. */
    public static List<String> allCities() {
        return CITIES.values().stream().flatMap(List::stream).toList();
    }
}
