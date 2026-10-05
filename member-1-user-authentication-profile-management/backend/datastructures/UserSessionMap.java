package datastructures;

/**
 * Custom Hash Table implementation for caching active user sessions
 * and authentication tokens with O(1) average lookup time.
 * Demonstrates collision handling via separate chaining.
 */
public class UserSessionMap<K, V> {

    private static class Entry<K, V> {
        final K key;
        V value;
        Entry<K, V> next;

        Entry(K key, V value, Entry<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private static final int DEFAULT_CAPACITY = 16;
    private static final float LOAD_FACTOR = 0.75f;

    @SuppressWarnings("unchecked")
    private Entry<K, V>[] buckets = (Entry<K, V>[]) new Entry[DEFAULT_CAPACITY];
    private int size = 0;

    private int getBucketIndex(K key) {
        if (key == null) return 0;
        return Math.abs(key.hashCode()) % buckets.length;
    }

    public void put(K key, V value) {
        if (size >= buckets.length * LOAD_FACTOR) {
            resize();
        }
        int index = getBucketIndex(key);
        Entry<K, V> head = buckets[index];

        while (head != null) {
            if ((head.key == null && key == null) || (head.key != null && head.key.equals(key))) {
                head.value = value;
                return;
            }
            head = head.next;
        }

        Entry<K, V> newEntry = new Entry<>(key, value, buckets[index]);
        buckets[index] = newEntry;
        size++;
    }

    public V get(K key) {
        int index = getBucketIndex(key);
        Entry<K, V> head = buckets[index];
        while (head != null) {
            if ((head.key == null && key == null) || (head.key != null && head.key.equals(key))) {
                return head.value;
            }
            head = head.next;
        }
        return null;
    }

    public boolean remove(K key) {
        int index = getBucketIndex(key);
        Entry<K, V> head = buckets[index];
        Entry<K, V> prev = null;

        while (head != null) {
            if ((head.key == null && key == null) || (head.key != null && head.key.equals(key))) {
                if (prev != null) {
                    prev.next = head.next;
                } else {
                    buckets[index] = head.next;
                }
                size--;
                return true;
            }
            prev = head;
            head = head.next;
        }
        return false;
    }

    public boolean containsKey(K key) {
        return get(key) != null;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    @SuppressWarnings("unchecked")
    private void resize() {
        Entry<K, V>[] oldBuckets = buckets;
        buckets = (Entry<K, V>[]) new Entry[oldBuckets.length * 2];
        size = 0;

        for (Entry<K, V> head : oldBuckets) {
            while (head != null) {
                put(head.key, head.value);
                head = head.next;
            }
        }
    }
}

