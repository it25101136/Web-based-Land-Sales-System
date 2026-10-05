package com.landhub.util;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * LKR formatting helpers matching the JS money.js output.
 */
public final class MoneyUtil {

    private MoneyUtil() {}

    public static String lkr(BigDecimal amount) {
        if (amount == null) return "Rs. 0";
        long n = amount.longValue();
        NumberFormat nf = NumberFormat.getIntegerInstance(Locale.US);
        return "Rs. " + nf.format(n);
    }

    public static String lkr(double amount) {
        return lkr(BigDecimal.valueOf(amount));
    }

    public static String lkrShort(BigDecimal amount) {
        if (amount == null) return "Rs. 0";
        double n = amount.doubleValue();
        if (n >= 1e9) {
            String v = String.format("%.2f", n / 1e9).replaceAll("\\.00$", "");
            return "Rs. " + v + "B";
        }
        if (n >= 1e6) {
            String v = String.format("%.2f", n / 1e6).replaceAll("\\.00$", "");
            return "Rs. " + v + "M";
        }
        if (n >= 1e3) {
            return "Rs. " + Math.round(n / 1e3) + "K";
        }
        return lkr(amount);
    }
}
