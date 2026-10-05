package datastructures;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom Max-Heap for prioritizing and sorting System Notifications.
 * Prioritizes unread notifications and orders by arrival timestamp.
 */
public class NotificationHeap {

    public static class NotificationItem {
        public Long id;
        public String title;
        public String message;
        public boolean isRead;
        public LocalDateTime timestamp;

        public NotificationItem(Long id, String title, String message, boolean isRead, LocalDateTime timestamp) {
            this.id = id;
            this.title = title;
            this.message = message;
            this.isRead = isRead;
            this.timestamp = timestamp;
        }

        public boolean hasHigherPriorityThan(NotificationItem other) {
            // Unread notifications take precedence
            if (this.isRead != other.isRead) {
                return !this.isRead;
            }
            return this.timestamp.isAfter(other.timestamp);
        }
    }

    private final List<NotificationItem> heap = new ArrayList<>();

    public synchronized void push(Long id, String title, String message, boolean isRead, LocalDateTime timestamp) {
        NotificationItem item = new NotificationItem(id, title, message, isRead, timestamp);
        heap.add(item);
        siftUp(heap.size() - 1);
    }

    public synchronized NotificationItem pop() {
        if (heap.isEmpty()) return null;
        NotificationItem max = heap.get(0);
        NotificationItem last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            siftDown(0);
        }
        return max;
    }

    public synchronized NotificationItem peek() {
        return heap.isEmpty() ? null : heap.get(0);
    }

    private void siftUp(int index) {
        int parent = (index - 1) / 2;
        while (index > 0 && heap.get(index).hasHigherPriorityThan(heap.get(parent))) {
            swap(index, parent);
            index = parent;
            parent = (index - 1) / 2;
        }
    }

    private void siftDown(int index) {
        int left = 2 * index + 1;
        while (left < heap.size()) {
            int maxIdx = index;
            if (heap.get(left).hasHigherPriorityThan(heap.get(maxIdx))) {
                maxIdx = left;
            }
            int right = 2 * index + 2;
            if (right < heap.size() && heap.get(right).hasHigherPriorityThan(heap.get(maxIdx))) {
                maxIdx = right;
            }
            if (maxIdx == index) break;
            swap(index, maxIdx);
            index = maxIdx;
            left = 2 * index + 1;
        }
    }

    private void swap(int i, int j) {
        NotificationItem temp = heap.get(i);
        heap.set(i, heap.get(j));
        heap.set(j, temp);
    }

    public int size() {
        return heap.size();
    }

    public boolean isEmpty() {
        return heap.isEmpty();
    }
}

