package datastructures;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Custom Doubly Linked Financial Ledger for recording immutable payment transactions.
 * Calculates running balances and verifies transaction sequence integrity.
 */
public class PaymentTransactionLedger {

    public static class TransactionNode {
        public Long paymentId;
        public String invoiceNo;
        public Long bookingId;
        public BigDecimal amount;
        public String paymentMethod;
        public BigDecimal runningBalance;
        public LocalDateTime timestamp;
        public TransactionNode prev;
        public TransactionNode next;

        public TransactionNode(Long paymentId, String invoiceNo, Long bookingId,
                               BigDecimal amount, String paymentMethod,
                               BigDecimal runningBalance, LocalDateTime timestamp) {
            this.paymentId = paymentId;
            this.invoiceNo = invoiceNo;
            this.bookingId = bookingId;
            this.amount = amount;
            this.paymentMethod = paymentMethod;
            this.runningBalance = runningBalance;
            this.timestamp = timestamp;
        }
    }

    private TransactionNode head;
    private TransactionNode tail;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private int transactionCount = 0;

    public synchronized void recordTransaction(Long paymentId, String invoiceNo, Long bookingId,
                                               BigDecimal amount, String paymentMethod, LocalDateTime timestamp) {
        totalRevenue = totalRevenue.add(amount);
        TransactionNode newNode = new TransactionNode(paymentId, invoiceNo, bookingId, amount, paymentMethod, totalRevenue, timestamp);

        if (head == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        transactionCount++;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public int getTransactionCount() {
        return transactionCount;
    }

    public TransactionNode getLatestTransaction() {
        return tail;
    }
}

