# 💳 Member 5: Payment & Finance Management

## 📌 Module Overview
This module administers financial transactions, sandbox payments, payment gateway simulation, invoice and receipt generation with automated PDF rendering in Sri Lankan Rupees (LKR), transaction audit ledgers, and revenue settlement metrics.

---

## 🗂️ Component Structure
```
member-5-payment-finance-management/
├── backend/
│   ├── controllers/
│   │   └── PaymentController.java       # Process payment checkout, fetch invoice, admin status override
│   ├── data/
│   │   └── PaymentRepository.java       # Spring Data JPA repository for payment entities
│   ├── datastructures/
│   │   ├── PaymentTransactionLedger.java# Doubly-linked transaction ledger with running balances
│   │   └── RevenueMinMaxHeap.java       # Custom Max-Heap for real-time highest value transaction tracking
│   ├── models/
│   │   ├── Payment.java                 # Payment entity (Invoice number, amount, method, status)
│   │   ├── PaymentMethod.java           # Enum (BANK_TRANSFER, CREDIT_CARD, ONLINE_GATEWAY)
│   │   └── PaymentStatus.java           # Enum (PENDING, SUCCESSFUL, FAILED, REFUNDED)
│   └── services/
│       ├── PaymentService.java          # Sandbox payment state transitions, invoice numbering
│       └── PdfService.java              # Dynamic PDF invoice generator (OpenPDF / iText)
├── frontend/
│   └── PaymentFinanceManagement.js      # Sandbox checkout modal, Payment history, PDF trigger UI
├── styles/
│   └── payment-finance-management.css   # Checkout styling, payment method cards, invoice summary
└── README.md                            # Member documentation
```

---

## 🔌 REST API Endpoints
| HTTP Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/payments` | List user transaction history | Authenticated |
| `POST` | `/api/payments` | Process sandbox payment for an approved booking | Buyer |
| `GET` | `/api/payments/:id/invoice` | Generate and download official PDF invoice | Authenticated |
| `PUT` | `/api/payments/:id/status` | Update payment status (Admin verification/refund) | Admin |

---

## 🧠 Custom Data Structures Implemented
1. **`PaymentTransactionLedger`**: A custom Doubly Linked Financial Ledger that records every transaction sequentially, maintaining an immutable running balance and transaction timeline.
2. **`RevenueMinMaxHeap`**: A Binary Max-Heap that efficiently manages high-value land transactions in $O(\log n)$ insertion/extraction time to produce real-time executive revenue telemetry.
