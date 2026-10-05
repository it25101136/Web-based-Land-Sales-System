# 🤝 Member 3: Reservation & Sales Management

## 📌 Module Overview
This module governs the property acquisition lifecycle between buyers and sellers. It manages land booking reservations, reservation acceptance/rejection workflows, wishlist persistence, side-by-side property comparison (up to 4 lands), and buyer browsing history tracking.

---

## 🗂️ Component Structure
```
member-3-reservation-sales-management/
├── backend/
│   ├── controllers/
│   │   ├── BookingController.java       # Land reservation lifecycle (Create, Status updates, List)
│   │   └── WishlistController.java      # Saved listings, 4-property comparison, Recently viewed
│   ├── data/
│   │   ├── BookingRepository.java       # JPA repository for reservation records
│   │   ├── WishlistRepository.java      # JPA repository for buyer saved lands
│   │   └── RecentlyViewedRepository.java# Repository for tracking user browsing history
│   ├── datastructures/
│   │   ├── ReservationQueue.java        # Custom Priority Queue for concurrent booking requests
│   │   └── PropertyComparisonList.java  # Bounded comparison list structure (Max 4 properties)
│   ├── models/
│   │   ├── Booking.java                 # Booking entity with state transitions
│   │   ├── Wishlist.java                # Wishlist entity mapping user to land
│   │   ├── RecentlyViewed.java          # Browsing trail entity with timestamps
│   │   └── BookingStatus.java           # Enum (PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED)
│   └── services/
│       ├── BookingService.java          # State machine, clash prevention, seller notifications
│       └── WishlistService.java         # Wishlist management and comparison matrix builder
├── frontend/
│   └── ReservationSalesManagement.js    # Reserve modal, Bookings dashboard, Comparison matrix UI
├── styles/
│   └── reservation-sales-management.css # Status badges, comparison table, booking modals
└── README.md                            # Member documentation
```

---

## 🔄 Reservation State Machine
```
[PENDING] ──seller approves──▶ [APPROVED] ──payment completed──▶ [COMPLETED]
    │                             │
    ├──seller declines──▶ [REJECTED]
    │
    └──buyer cancels───▶ [CANCELLED]
```

---

## 🔌 REST API Endpoints
| HTTP Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/bookings` | List user reservations (as buyer or seller) | Authenticated |
| `POST` | `/api/bookings` | Create new reservation request on a land | Buyer |
| `PUT` | `/api/bookings/:id/status` | Update booking status (`APPROVED`, `REJECTED`, `CANCELLED`) | Buyer / Seller |
| `GET` | `/api/wishlist` | Fetch buyer's saved properties | Buyer |
| `POST` | `/api/wishlist/:landId` | Add property to wishlist | Buyer |
| `DELETE` | `/api/wishlist/:landId` | Remove property from wishlist | Buyer |

---

## 🧠 Custom Data Structures Implemented
1. **`ReservationQueue`**: A custom Priority Queue that arbitrates concurrent reservation inquiries on a property by ranking verified buyers first followed by chronologically earliest requests.
2. **`PropertyComparisonList`**: A bounded list data structure that strictly enforces a 4-property maximum limit and organizes attributes for side-by-side comparative analysis.
