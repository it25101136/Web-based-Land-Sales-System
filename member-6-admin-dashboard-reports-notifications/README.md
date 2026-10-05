# 📊 Member 6: Admin Dashboard, Reports & Notifications

## 📌 Module Overview
This module serves as the command center for platform administrators. It provides executive KPI monitoring, SVG visualization charts, the legal document verification workflow (verifying Deeds, Title Certificates, and Survey Plans), seller review moderation, system-wide notifications, and downloadable executive reports.

---

## 🗂️ Component Structure
```
member-6-admin-dashboard-reports-notifications/
├── backend/
│   ├── controllers/
│   │   ├── AdminController.java         # Platform KPIs, user administration, reporting
│   │   ├── DocumentController.java      # Legal document upload and verification queue
│   │   ├── NotificationController.java  # Persistent notifications and unread counters
│   │   └── ReviewController.java        # Seller ratings and customer reviews moderation
│   ├── data/
│   │   ├── LandDocumentRepository.java  # Spring Data JPA repository for deed/survey plans
│   │   ├── NotificationRepository.java  # Repository for user in-app notifications
│   │   ├── ReportRepository.java        # Repository for generated analytical reports
│   │   └── ReviewRepository.java        # Repository for 1-5 star property reviews
│   ├── datastructures/
│   │   ├── NotificationHeap.java        # Custom Max-Heap for prioritizing unread notifications
│   │   └── AnalyticsAggregationTree.java# Multi-Way Tree for National/Provincial/District rollups
│   ├── models/
│   │   ├── LandDocument.java            # Document entity (Deed, Survey Plan, Title cert)
│   │   ├── Notification.java            # User notification alert entity
│   │   ├── Report.java                  # System report snapshot entity
│   │   ├── Review.java                  # Seller/land review entity
│   │   ├── DocType.java                 # Enum (DEED, TITLE_CERTIFICATE, SURVEY_PLAN, OTHER)
│   │   ├── Verification.java            # Enum (PENDING, VERIFIED, REJECTED)
│   │   └── ReviewStatus.java            # Enum (PENDING, APPROVED, REJECTED)
│   └── services/
│       ├── AdminService.java            # KPI aggregation and statistical metrics
│       ├── DocumentService.java         # Document verification business rule check
│       ├── NotificationService.java     # Notification dispatching and read tracking
│       └── ReviewService.java           # Review eligibility verification & moderation
├── frontend/
│   └── AdminDashboardReportsNotifications.js # KPI overview, SVG charts, Doc Queue, Bell Menu UI
├── styles/
│   └── admin-dashboard-reports-notifications.css # Admin shell, KPI cards, SVG chart styling
└── README.md                            # Member documentation
```

---

## ⚖️ Legal Document Verification Rule
A land property receives the verified badge **✓ Verified Property** if and only if:
$$\text{IsVerified} = (\text{Deed} = \text{VERIFIED} \lor \text{TitleCert} = \text{VERIFIED}) \land (\text{SurveyPlan} = \text{VERIFIED})$$

---

## 🔌 REST API Endpoints
| HTTP Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/overview` | Platform KPI stats (active listings, revenue, users) | Admin |
| `GET` | `/api/documents/pending` | Queue of pending legal deeds and survey plans | Admin |
| `POST` | `/api/documents/:id/review` | Approve (`VERIFIED`) or reject (`REJECTED`) document | Admin |
| `GET` | `/api/notifications` | Fetch user alerts and notification history | Authenticated |
| `PUT` | `/api/notifications/:id/read`| Mark specific notification as read | Authenticated |
| `POST` | `/api/reviews/:id/moderate` | Admin approve or decline seller review | Admin |

---

## 🧠 Custom Data Structures Implemented
1. **`NotificationHeap`**: A custom Max-Heap data structure that extracts unread and chronologically newest notifications with $O(\log n)$ performance.
2. **`AnalyticsAggregationTree`**: A Multi-Way Tree that rolls up property volume and sales figures hierarchically from cities to districts, provinces, and national totals.
