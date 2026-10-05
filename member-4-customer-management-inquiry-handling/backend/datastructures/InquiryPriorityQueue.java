package datastructures;

import java.time.LocalDateTime;

/**
 * Custom Priority Queue for managing Customer Inquiries.
 * Inquiries are prioritized by urgency (HIGH, MEDIUM, LOW) and arrival timestamp
 * to guarantee SLA response times.
 */
public class InquiryPriorityQueue {

    public enum PriorityLevel {
        HIGH(3), MEDIUM(2), LOW(1);
        final int weight;
        PriorityLevel(int weight) { this.weight = weight; }
    }

    public static class InquiryNode {
        public Long inquiryId;
        public String customerEmail;
        public String subject;
        public PriorityLevel priority;
        public LocalDateTime createdAt;
        public InquiryNode next;

        public InquiryNode(Long inquiryId, String customerEmail, String subject, PriorityLevel priority, LocalDateTime createdAt) {
            this.inquiryId = inquiryId;
            this.customerEmail = customerEmail;
            this.subject = subject;
            this.priority = priority;
            this.createdAt = createdAt;
        }

        public boolean hasHigherPriorityThan(InquiryNode other) {
            if (this.priority.weight != other.priority.weight) {
                return this.priority.weight > other.priority.weight;
            }
            return this.createdAt.isBefore(other.createdAt);
        }
    }

    private InquiryNode head;
    private int size;

    public synchronized void enqueue(Long id, String email, String subject, PriorityLevel priority, LocalDateTime createdAt) {
        InquiryNode newNode = new InquiryNode(id, email, subject, priority, createdAt);
        if (head == null || newNode.hasHigherPriorityThan(head)) {
            newNode.next = head;
            head = newNode;
        } else {
            InquiryNode current = head;
            while (current.next != null && !newNode.hasHigherPriorityThan(current.next)) {
                current = current.next;
            }
            newNode.next = current.next;
            current.next = newNode;
        }
        size++;
    }

    public synchronized InquiryNode dequeue() {
        if (head == null) return null;
        InquiryNode result = head;
        head = head.next;
        size--;
        return result;
    }

    public synchronized InquiryNode peek() {
        return head;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}

