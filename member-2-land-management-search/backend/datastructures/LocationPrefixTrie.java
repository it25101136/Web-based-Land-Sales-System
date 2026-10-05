package datastructures;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Custom Trie (Prefix Tree) data structure for Sri Lankan location auto-complete.
 * Enables instant O(m) prefix searches across Sri Lankan provinces, districts, and cities.
 */
public class LocationPrefixTrie {

    private static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEndOfWord;
        String fullLocationName;
        String locationType; // PROVINCE, DISTRICT, CITY

        TrieNode() {}
    }

    private final TrieNode root = new TrieNode();

    public void insert(String locationName, String type) {
        if (locationName == null || locationName.trim().isEmpty()) return;
        TrieNode current = root;
        String clean = locationName.trim().toLowerCase();

        for (char c : clean.toCharArray()) {
            current = current.children.computeIfAbsent(c, k -> new TrieNode());
        }
        current.isEndOfWord = true;
        current.fullLocationName = locationName.trim();
        current.locationType = type;
    }

    /**
     * Returns up to limit auto-complete suggestions matching prefix.
     */
    public List<String> autocomplete(String prefix, int limit) {
        List<String> results = new ArrayList<>();
        if (prefix == null || prefix.trim().isEmpty()) return results;

        TrieNode current = root;
        String clean = prefix.trim().toLowerCase();

        for (char c : clean.toCharArray()) {
            current = current.children.get(c);
            if (current == null) {
                return results; // No matches found
            }
        }

        collectWords(current, results, limit);
        return results;
    }

    private void collectWords(TrieNode node, List<String> results, int limit) {
        if (node == null || results.size() >= limit) return;

        if (node.isEndOfWord) {
            results.add(node.fullLocationName + " (" + node.locationType + ")");
        }

        for (TrieNode child : node.children.values()) {
            collectWords(child, results, limit);
            if (results.size() >= limit) break;
        }
    }
}

