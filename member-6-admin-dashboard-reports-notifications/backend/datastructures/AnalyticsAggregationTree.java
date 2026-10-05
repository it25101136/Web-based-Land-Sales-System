package datastructures;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom Multi-Way Tree data structure for Hierarchical Analytics Aggregation.
 * Aggregates listing counts and sales volume hierarchically:
 * National Level -> Province Level -> District Level -> City Level.
 */
public class AnalyticsAggregationTree {

    public static class AnalyticsNode {
        public String name;
        public String level; // COUNTRY, PROVINCE, DISTRICT, CITY
        public int listingCount;
        public BigDecimal totalVolume;
        public List<AnalyticsNode> children = new ArrayList<>();

        public AnalyticsNode(String name, String level) {
            this.name = name;
            this.level = level;
            this.listingCount = 0;
            this.totalVolume = BigDecimal.ZERO;
        }

        public void addListing(BigDecimal price) {
            this.listingCount++;
            if (price != null) {
                this.totalVolume = this.totalVolume.add(price);
            }
        }
    }

    private final AnalyticsNode root = new AnalyticsNode("Sri Lanka", "COUNTRY");

    public AnalyticsNode getRoot() {
        return root;
    }

    public synchronized AnalyticsNode findOrCreateChild(AnalyticsNode parent, String childName, String level) {
        for (AnalyticsNode child : parent.children) {
            if (child.name.equalsIgnoreCase(childName)) {
                return child;
            }
        }
        AnalyticsNode newChild = new AnalyticsNode(childName, level);
        parent.children.add(newChild);
        return newChild;
    }

    /**
     * Recursively roll up child statistics to parent nodes.
     */
    public synchronized void rollup(AnalyticsNode node) {
        if (node == null || node.children.isEmpty()) return;

        int totalCount = 0;
        BigDecimal totalVolume = BigDecimal.ZERO;

        for (AnalyticsNode child : node.children) {
            rollup(child);
            totalCount += child.listingCount;
            totalVolume = totalVolume.add(child.totalVolume);
        }

        node.listingCount = totalCount;
        node.totalVolume = totalVolume;
    }
}

