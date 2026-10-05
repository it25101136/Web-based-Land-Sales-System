package datastructures;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom Binary Search Tree (BST) for indexing Land listings by total price.
 * Enables fast logarithmic search and range queries (e.g. lands between LKR 5M and 15M).
 */
public class LandBinarySearchTree {

    public static class LandNode {
        public Long landId;
        public String title;
        public BigDecimal price;
        public BigDecimal perches;
        public LandNode left;
        public LandNode right;

        public LandNode(Long landId, String title, BigDecimal price, BigDecimal perches) {
            this.landId = landId;
            this.title = title;
            this.price = price;
            this.perches = perches;
        }
    }

    private LandNode root;
    private int count;

    public void insert(Long landId, String title, BigDecimal price, BigDecimal perches) {
        root = insertRec(root, landId, title, price, perches);
        count++;
    }

    private LandNode insertRec(LandNode current, Long landId, String title, BigDecimal price, BigDecimal perches) {
        if (current == null) {
            return new LandNode(landId, title, price, perches);
        }
        if (price.compareTo(current.price) < 0) {
            current.left = insertRec(current.left, landId, title, price, perches);
        } else {
            current.right = insertRec(current.right, landId, title, price, perches);
        }
        return current;
    }

    /**
     * Efficient range query returning all lands within [minPrice, maxPrice] in ascending order.
     */
    public List<LandNode> searchPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        List<LandNode> results = new ArrayList<>();
        rangeRec(root, minPrice, maxPrice, results);
        return results;
    }

    private void rangeRec(LandNode node, BigDecimal min, BigDecimal max, List<LandNode> results) {
        if (node == null) return;

        if (min == null || node.price.compareTo(min) > 0) {
            rangeRec(node.left, min, max, results);
        }

        boolean withinMin = (min == null || node.price.compareTo(min) >= 0);
        boolean withinMax = (max == null || node.price.compareTo(max) <= 0);
        if (withinMin && withinMax) {
            results.add(node);
        }

        if (max == null || node.price.compareTo(max) < 0) {
            rangeRec(node.right, min, max, results);
        }
    }

    public int getCount() {
        return count;
    }
}

