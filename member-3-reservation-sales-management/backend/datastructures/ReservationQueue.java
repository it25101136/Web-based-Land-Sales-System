package datastructures;

import java.time.LocalDateTime;

/**
 * Custom Priority Queue implementation for managing concurrent Land Reservation requests.
 * Prioritizes requests based on verified buyer status and earliest submission timestamp.
 */
public class ReservationQueue {

    public static class RequestNode {
        public Long bookingId;
        public Long landId;
        public Long buyerId;
        public boolean isVerifiedBuyer;
        public LocalDateTime requestTime;
        public RequestNode next;

        public RequestNode(Long bookingId, Long landId, Long buyerId, boolean isVerifiedBuyer, LocalDateTime requestTime) {
            this.bookingId = bookingId;
            this.landId = landId;
            this.buyerId = buyerId;
            this.isVerifiedBuyer = isVerifiedBuyer;
            this.requestTime = requestTime;
        }

        // Higher priority if verified buyer, otherwise earlier timestamp
        public boolean hasHigherPriorityThan(RequestNode other) {
            if (this.isVerifiedBuyer != other.isVerifiedBuyer) {
                return this.isVerifiedBuyer; // verified gets higher priority
            }
            return this.requestTime.isBefore(other.requestTime);
        }
    }

    private RequestNode head;
    private int size;

    public synchronized void enqueue(Long bookingId, Long landId, Long buyerId, boolean isVerifiedBuyer, LocalDateTime requestTime) {
        RequestNode newNode = new RequestNode(bookingId, landId, buyerId, isVerifiedBuyer, requestTime);

        if (head == null || newNode.hasHigherPriorityThan(head)) {
            newNode.next = head;
            head = newNode;
        } else {
            RequestNode current = head;
            while (current.next != null && !newNode.hasHigherPriorityThan(current.next)) {
                current = current.next;
            }
            newNode.next = current.next;
            current.next = newNode;
        }
        size++;
    }

    public synchronized RequestNode dequeue() {
        if (head == null) return null;
        RequestNode result = head;
        head = head.next;
        size--;
        return result;
    }

    public synchronized RequestNode peek() {
        return head;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}

