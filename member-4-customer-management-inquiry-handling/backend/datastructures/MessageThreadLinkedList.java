package datastructures;

import java.time.LocalDateTime;

/**
 * Custom Doubly Linked List for rendering chronological buyer-seller chat threads
 * and inquiry clarification histories. Allows bidirectional traversal.
 */
public class MessageThreadLinkedList {

    public static class MessageNode {
        public Long messageId;
        public Long senderId;
        public Long receiverId;
        public String content;
        public LocalDateTime timestamp;
        public MessageNode prev;
        public MessageNode next;

        public MessageNode(Long messageId, Long senderId, Long receiverId, String content, LocalDateTime timestamp) {
            this.messageId = messageId;
            this.senderId = senderId;
            this.receiverId = receiverId;
            this.content = content;
            this.timestamp = timestamp;
        }
    }

    private MessageNode head;
    private MessageNode tail;
    private int size;

    public void append(Long messageId, Long senderId, Long receiverId, String content, LocalDateTime timestamp) {
        MessageNode newNode = new MessageNode(messageId, senderId, receiverId, content, timestamp);
        if (head == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        size++;
    }

    public MessageNode getHead() {
        return head;
    }

    public MessageNode getTail() {
        return tail;
    }

    public int size() {
        return size;
    }
}

