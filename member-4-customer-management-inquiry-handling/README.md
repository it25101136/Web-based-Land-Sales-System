# 💬 Member 4: Customer Management & Inquiry Handling

## 📌 Module Overview
This module centralizes client relationship handling, customer support, inquiry resolution pipelines, clarification messages between buyers and sellers, and the AI property assistant.

---

## 🗂️ Component Structure
```
member-4-customer-management-inquiry-handling/
├── backend/
│   ├── controllers/
│   │   ├── CustomerController.java      # Customer CRM listings, buyer/seller profiles
│   │   ├── InquiryController.java       # Inquiries, threaded responses, clarification tickets
│   │   ├── MessageController.java       # Private buyer-seller messaging threads
│   │   └── ChatbotController.java       # AI property assistant NLP processing
│   ├── data/
│   │   ├── InquiryRepository.java       # Spring Data JPA repository for inquiries
│   │   ├── InquiryResponseRepository.java# Repository for clarification responses
│   │   └── MessageRepository.java       # Repository for buyer-seller message threads
│   ├── datastructures/
│   │   ├── InquiryPriorityQueue.java    # Priority Queue for inquiries ordered by SLA urgency
│   │   └── MessageThreadLinkedList.java # Doubly Linked List for chronological message threads
│   ├── models/
│   │   ├── Inquiry.java                 # Customer inquiry ticket entity
│   │   ├── InquiryResponse.java         # Threaded reply and clarification entity
│   │   └── Message.java                 # Buyer-seller private chat entity
│   └── services/
│       ├── CustomerService.java         # Customer verification & account metrics
│       ├── InquiryService.java          # Ticket lifecycle, ticket assignment & status
│       ├── MessageService.java          # Thread retrieval and unread counters
│       └── ChatbotService.java          # Intent extraction & listing recommendations
├── frontend/
│   └── CustomerInquiryManagement.js     # CRM table, Inquiry ticket thread, Floating AI chatbot UI
├── styles/
│   └── customer-inquiry-handling.css    # CRM styling, message bubbles, chatbot floating window
└── README.md                            # Member documentation
```

---

## 🔌 REST API Endpoints
| HTTP Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/customers` | Search and filter registered customers & clients | Admin / Agent |
| `GET` | `/api/inquiries` | List inquiries (filter by customer, land, or status) | Authenticated |
| `POST` | `/api/inquiries` | Submit new inquiry regarding a property | Public / Buyer |
| `POST` | `/api/inquiries/:id/reply` | Add clarification or staff response to an inquiry | Authenticated |
| `GET` | `/api/messages` | Fetch conversation threads for authenticated user | Authenticated |
| `POST` | `/api/messages` | Send direct in-platform message to buyer or seller | Authenticated |
| `POST` | `/api/chatbot` | Natural language question answering on active listings | Public |

---

## 🧠 Custom Data Structures Implemented
1. **`InquiryPriorityQueue`**: A custom Priority Queue that stratifies customer inquiries into HIGH, MEDIUM, and LOW urgency tiers while preserving FIFO order within each tier for SLA guarantees.
2. **`MessageThreadLinkedList`**: A Doubly Linked List providing efficient $O(1)$ bidirectional traversal and insertion of real-time messaging histories between buyers and sellers.
