package datastructures;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom Bounded List data structure for comparing up to 4 properties side-by-side.
 * Enforces maximum capacity constraints and provides matrix comparison utilities.
 */
public class PropertyComparisonList {

    public static class ComparedProperty {
        public Long landId;
        public String title;
        public String district;
        public String landType;
        public BigDecimal perches;
        public BigDecimal price;
        public BigDecimal pricePerPerch;

        public ComparedProperty(Long landId, String title, String district, String landType,
                                BigDecimal perches, BigDecimal price, BigDecimal pricePerPerch) {
            this.landId = landId;
            this.title = title;
            this.district = district;
            this.landType = landType;
            this.perches = perches;
            this.price = price;
            this.pricePerPerch = pricePerPerch;
        }
    }

    private static final int MAX_PROPERTIES = 4;
    private final List<ComparedProperty> items = new ArrayList<>();

    public boolean addProperty(ComparedProperty prop) {
        if (items.size() >= MAX_PROPERTIES) {
            return false; // Reached max limit of 4 properties
        }
        for (ComparedProperty p : items) {
            if (p.landId.equals(prop.landId)) {
                return false; // Already in comparison list
            }
        }
        return items.add(prop);
    }

    public boolean removeProperty(Long landId) {
        return items.removeIf(p -> p.landId.equals(landId));
    }

    public List<ComparedProperty> getProperties() {
        return new ArrayList<>(items);
    }

    public int getCount() {
        return items.size();
    }

    public void clear() {
        items.clear();
    }
}

