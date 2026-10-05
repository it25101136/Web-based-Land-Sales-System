package com.landhub.util;

import java.util.Map;

/**
 * Sri Lankan land measurement conversions.
 * Base unit = PERCH. 1 perch = 25.2929 m² = 272.25 ft²
 * 1 acre = 160 perches; 1 rood = 40 perches
 */
public final class MeasurementUtil {

    public static final double PERCH_SQFT = 272.25;
    public static final double PERCH_SQM = 25.29285264;
    public static final int PERCHES_PER_ACRE = 160;
    public static final int PERCHES_PER_ROOD = 40;

    private MeasurementUtil() {}

    public static double toPerches(double value, String unit) {
        return switch (unit.toLowerCase()) {
            case "perch", "perches" -> value;
            case "rood", "roods" -> value * PERCHES_PER_ROOD;
            case "acre", "acres" -> value * PERCHES_PER_ACRE;
            case "sqft" -> value / PERCH_SQFT;
            case "sqm" -> value / PERCH_SQM;
            default -> throw new IllegalArgumentException("Unknown source unit: " + unit);
        };
    }

    public static double convert(double value, String from, String to) {
        double perches = toPerches(value, from);
        return switch (to.toLowerCase()) {
            case "perch", "perches" -> perches;
            case "rood", "roods" -> perches / PERCHES_PER_ROOD;
            case "acre", "acres" -> perches / PERCHES_PER_ACRE;
            case "sqft" -> perches * PERCH_SQFT;
            case "sqm" -> perches * PERCH_SQM;
            default -> throw new IllegalArgumentException("Unknown target unit: " + to);
        };
    }

    public static String formatPerches(double perches) {
        double p = perches;
        if (p >= PERCHES_PER_ACRE) {
            int acres = (int) (p / PERCHES_PER_ACRE);
            double rem = p - acres * PERCHES_PER_ACRE;
            int roods = (int) (rem / PERCHES_PER_ROOD);
            double rp = Math.round((rem - roods * PERCHES_PER_ROOD) * 100.0) / 100.0;
            StringBuilder s = new StringBuilder();
            s.append(acres).append(" Acre").append(acres > 1 ? "s" : "");
            if (roods > 0) s.append(" ").append(roods).append(" Rood").append(roods > 1 ? "s" : "");
            if (rp > 0) s.append(" ").append(rp).append(" Perches");
            return s.toString();
        }
        double rounded = Math.round(p * 100.0) / 100.0;
        return rounded + " Perch" + (rounded == 1.0 ? "" : "es");
    }

    public static Map<String, Object> breakdown(double perches) {
        double rounded = Math.round(perches * 100.0) / 100.0;
        return Map.of(
            "perches", rounded,
            "roods", Math.round(convert(perches, "perch", "roods") * 1000.0) / 1000.0,
            "acres", Math.round(convert(perches, "perch", "acres") * 10000.0) / 10000.0,
            "sqft", (long) Math.round(convert(perches, "perch", "sqft")),
            "sqm", (long) Math.round(convert(perches, "perch", "sqm")),
            "display", formatPerches(perches)
        );
    }
}
