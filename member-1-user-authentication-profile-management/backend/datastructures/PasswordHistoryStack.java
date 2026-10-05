package datastructures;

/**
 * Custom LIFO Stack implementation for enforcing password history policy.
 * Prevents users from reusing their last N passwords during password changes.
 */
public class PasswordHistoryStack {

    private static class Node {
        String passwordHash;
        Node next;

        Node(String passwordHash, Node next) {
            this.passwordHash = passwordHash;
            this.next = next;
        }
    }

    private Node top;
    private int size;
    private final int maxHistory;

    public PasswordHistoryStack(int maxHistory) {
        this.maxHistory = maxHistory;
        this.top = null;
        this.size = 0;
    }

    public void push(String passwordHash) {
        top = new Node(passwordHash, top);
        size++;

        // Trim bottom if exceeds max allowed history
        if (size > maxHistory) {
            Node current = top;
            for (int i = 1; i < maxHistory; i++) {
                current = current.next;
            }
            if (current != null) {
                current.next = null;
                size = maxHistory;
            }
        }
    }

    public String peek() {
        return top != null ? top.passwordHash : null;
    }

    public boolean contains(String passwordHash) {
        Node current = top;
        while (current != null) {
            if (current.passwordHash.equals(passwordHash)) {
                return true;
            }
            current = current.next;
        }
        return false;
    }

    public int size() {
        return size;
    }
}

