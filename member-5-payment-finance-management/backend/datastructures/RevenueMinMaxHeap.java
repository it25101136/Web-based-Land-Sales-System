package datastructures;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom Binary Max-Heap implementation for real-time tracking of top revenue transactions
 * and financial extremes across the LandHub platform.
 */
public class RevenueMinMaxHeap {

    public static class TransactionItem {
        public Long paymentId;
        public BigDecimal amount;
        public String description;

        public TransactionItem(Long paymentId, BigDecimal amount, String description) {
            this.paymentId = paymentId;
            this.amount = amount;
            this.description = description;
        }
    }

    private final List<TransactionItem> heap = new ArrayList<>();

    public synchronized void insert(Long paymentId, BigDecimal amount, String description) {
        TransactionItem item = new TransactionItem(paymentId, amount, description);
        heap.add(item);
        siftUp(heap.size() - 1);
    }

    public synchronized TransactionItem extractMax() {
        if (heap.isEmpty()) return null;
        TransactionItem max = heap.get(0);
        TransactionItem last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            siftDown(0);
        }
        return max;
    }

    public synchronized TransactionItem peekMax() {
        return heap.isEmpty() ? null : heap.get(0);
    }

    private void siftUp(int index) {
        int parent = (index - 1) / 2;
        while (index > 0 && heap.get(index).amount.compareTo(heap.get(parent).amount) > 0) {
            swap(index, parent);
            index = parent;
            parent = (index - 1) / 2;
        }
    }

    private void siftDown(int index) {
        int left = 2 * index + 1;
        while (left < heap.size()) {
            int maxIdx = index;
            if (heap.get(left).amount.compareTo(heap.get(maxIdx).amount) > 0) {
                maxIdx = left;
            }
            int right = 2 * index + 2;
            if (right < heap.size() && heap.get(right).amount.compareTo(heap.get(maxIdx).amount) > 0) {
                maxIdx = right;
            }
            if (maxIdx == index) break;
            swap(index, maxIdx);
            index = maxIdx;
            left = 2 * index + 1;
        }
    }

    private void swap(int i, int j) {
        TransactionItem temp = heap.get(i);
        heap.set(i, heap.get(j));
        heap.set(j, temp);
    }

    public int size() {
        return heap.size();
    }
}

