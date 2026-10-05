# LandHub Sri Lanka — System Architecture & UML Reference

> Web-Based Land Sales and Property Management System
> University Software Engineering group project · 6-member team

---

## 1. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│  Responsive SPA (HTML5 · CSS3 · Vanilla JS · hash router)                │
│  index.html → core.js (API/State/i18n/UI) → chrome.js → pages-*.js       │
│  Reusable components: LandCard · Charts · UI.modal · Forms               │
│  Languages: EN · සිංහල · தமிழ்      Devices: 375 → 1920 px               │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │  HTTPS / JSON  (JWT Bearer)
┌───────────────────────────────▼──────────────────────────────────────────┐
│                            API LAYER (Express)                           │
│  securityHeaders → rateLimit → json → router → auth(JWT+RBAC) →          │
│  validate() → CONTROLLER → errorHandler (global exception handler)       │
│  /api/auth /users /lands /locations /bookings /payments /documents       │
│  /reviews /wishlist /messages /notifications /admin /chatbot             │
└───────────────────────────────┬──────────────────────────────────────────┘
┌───────────────────────────────▼──────────────────────────────────────────┐
│                          SERVICE LAYER (business rules)                  │
│  auth.service · land.service · booking.service · payment.service         │
│  document.service · notification.service                                 │
│  Rules: perch conversion · ppp derivation · reservation state machine    │
│         verification rule (deed|title + survey plan) · review eligibility│
└───────────────────────────────┬──────────────────────────────────────────┘
┌───────────────────────────────▼──────────────────────────────────────────┐
│                       REPOSITORY / PERSISTENCE LAYER                     │
│  user.repository · land.repository (prepared statements only)            │
└───────────────────────────────┬──────────────────────────────────────────┘
┌───────────────────────────────▼──────────────────────────────────────────┐
│  DATABASE — MySQL 8 (docs/schema.mysql.sql) · SQLite mirror for demo     │
│  15 normalized tables · PK/FK · CHECK constraints · indexes · views      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Pattern:** Layered / MVC-style separation. Controllers never touch SQL; services never
touch HTTP; repositories never contain business rules. Every module is independently testable.

---

## 2. Use Case Diagram (textual)

```
                        ┌─────────────────────────────────┐
                        │      LandHub Sri Lanka          │
   ┌────────┐           │                                 │
   │ GUEST  │──────────▶│ Search Lands                    │
   └────────┘           │ View Land Details               │
        │               │ Explore Provinces/Districts     │
        │               │ Ask AI Assistant                │
        │  «extends»    │ Register / Login                │
        ▼               │                                 │
   ┌────────┐           │ Save to Wishlist                │
   │ BUYER  │──────────▶│ Compare Properties (≤4)         │
   └────────┘           │ Reserve Land                    │
        │               │ Make Sandbox Payment            │
        │               │ Download PDF Invoice            │
        │               │ Message Seller                  │
        │               │ Write Review        «requires   │
        │               │                      completed  │
        │               │                      booking»   │
   ┌────────┐           │                                 │
   │ SELLER │──────────▶│ Post Land Listing               │
   └────────┘           │ Edit / Delete Listing           │
        │               │ Upload Images                   │
        │               │ Upload Documents                │
        │               │ Manage Reservations             │
        │               │ View Analytics (own)            │
        │               │                                 │
   ┌────────┐           │                                 │
   │ AGENT  │──────────▶│ (all SELLER cases) +            │
   └────────┘           │ Manage Client Listings          │
                        │                                 │
   ┌────────┐           │ Approve/Reject Listings         │
   │ ADMIN  │──────────▶│ Verify Documents                │
   └────────┘           │ Manage Users & Roles            │
                        │ Moderate Reviews                │
                        │ Manage Payments                 │
                        │ View Analytics & Reports        │
                        └─────────────────────────────────┘
```

---

## 3. Class Diagram (domain model)

```
┌──────────────────────┐          ┌────────────────────────┐
│ User                 │          │ Land                   │
├──────────────────────┤          ├────────────────────────┤
│ -id: Long            │ 1      * │ -id: Long              │
│ -fullName: String    │──────────│ -title: String         │
│ -email: String «uq»  │  sells   │ -description: String   │
│ -phone: String       │          │ -landType: LandType    │
│ -passwordHash        │          │ -province/district/city│
│ -role: Role          │          │ -perches: Decimal      │
│ -language: Lang      │          │ -price: Decimal (LKR)  │
│ -status: Status      │          │ -pricePerPerch: Decimal│
├──────────────────────┤          │ -lat/lng: Decimal      │
│ +register()          │          │ -status: ListingStatus │
│ +login()             │          │ -verification: VerState│
│ +changePassword()    │          ├────────────────────────┤
└─────┬────────┬───────┘          │ +computePerPerch()     │
      │        │                  │ +isVerified(): bool    │
  ┌───▼──┐ ┌───▼────┐             └───┬──────────┬─────────┘
  │Buyer │ │ Seller │                 │1        *│
  ├──────┤ ├────────┤            ┌────▼─────┐ ┌──▼──────────┐
  │pref  │ │company │            │LandImage │ │LandDocument │
  │budget│ │ratingAvg│           ├──────────┤ ├─────────────┤
  └──────┘ └────────┘            │url       │ │docType      │
  ┌──────┐                       │isCover   │ │status       │
  │Agent │                       └──────────┘ │remarks      │
  ├──────┤                                    │reviewedBy   │
  │agency│                                    └─────────────┘
  │licence│
  └──────┘

┌──────────────┐ 1   * ┌───────────┐        ┌──────────────┐
│ Booking      │───────│ Payment   │        │ Review       │
├──────────────┤       ├───────────┤        ├──────────────┤
│ -landId      │       │-amount    │        │-rating: 1..5 │
│ -buyerId     │       │-currency  │        │-comment      │
│ -sellerId    │       │-method    │        │-status       │
│ -preferredDate│      │-status    │        ├──────────────┤
│ -status      │       │-invoiceNo │        │+moderate()   │
├──────────────┤       ├───────────┤        └──────────────┘
│+approve()    │       │+toInvoice │
│+reject()     │       │  Pdf()    │   ┌──────────┐ ┌────────────┐
│+cancel()     │       └───────────┘   │ Message  │ │Notification│
│+complete()   │                       └──────────┘ └────────────┘
└──────────────┘

«enum» Role          = ADMIN | SELLER | BUYER | AGENT
«enum» ListingStatus = PENDING | ACTIVE | REJECTED | RESERVED | SOLD | REMOVED
«enum» VerState      = PENDING | VERIFIED | REJECTED
«enum» BookingStatus = PENDING | APPROVED | REJECTED | CANCELLED | COMPLETED
«enum» PaymentStatus = PENDING | SUCCESSFUL | FAILED | REFUNDED
«enum» LandType      = Residential | Agricultural | Commercial | Coconut | Tea |
                       Rubber | Paddy | Beach | Industrial | Bare | Plantation | Investment
```

---

## 4. ER Diagram (crow's foot, textual)

```
users ──1:1── buyers
users ──1:1── sellers
users ──1:1── agents
users ──1:N── lands            (seller_id)
users ──0:N── lands            (agent_id, nullable)
lands ──1:N── land_images
lands ──1:N── land_documents ──N:1── users (uploaded_by / reviewed_by)
lands ──1:N── bookings ──1:N── payments
users ──1:N── bookings         (buyer_id, seller_id)
lands ──1:N── reviews ──N:1── users (buyer_id, seller_id)
users ──N:M── lands via wishlist
users ──N:M── lands via recently_viewed
users ──1:N── messages         (sender_id, receiver_id)
users ──1:N── notifications
users ──0:N── reports          (generated_by)
locations ──1:N── locations    (self-referencing: PROVINCE→DISTRICT→CITY→AREA)
```

---

## 5. Sequence Diagram — Reserve & Pay for Land

```
Buyer      SPA        API/Auth   BookingSvc  NotifSvc  PaymentSvc   DB
 │          │             │          │          │          │         │
 │ click Reserve          │          │          │          │         │
 ├─────────▶│             │          │          │          │         │
 │          │ POST /api/bookings (JWT)          │          │         │
 │          ├────────────▶│          │          │          │         │
 │          │             │ verify JWT + role   │          │         │
 │          │             ├─────────▶│          │          │         │
 │          │             │          │ validate land avail │         │
 │          │             │          ├────────────────────────────-─▶│
 │          │             │          │ INSERT booking (PENDING)      │
 │          │             │          ├────────────────────────────-─▶│
 │          │             │          ├─────────▶│ notify seller+buyer│
 │          │  201 booking│◀─────────┤          │          │         │
 │ ◀────────┤             │          │          │          │         │
 │                                                                    │
Seller      │ PUT /api/bookings/:id/status {APPROVED}                 │
 ├─────────▶├────────────▶│─────────▶│ state machine check           │
 │          │             │          │ UPDATE booking, land→RESERVED │
 │          │             │          ├─────────▶│ notify both        │
 │                                                                    │
Buyer       │ POST /api/payments {booking_id, amount, method}         │
 ├─────────▶├────────────▶│────────────────────────────▶│            │
 │          │             │              sandbox decision (demo rule) │
 │          │             │              INSERT payment + invoice_no ▶│
 │          │             │              booking→COMPLETED           │
 │          │ 201 payment │◀────────────────────────────┤            │
 │ GET /api/payments/:id/invoice → application/pdf                    │
 │ ◀──────── PDF invoice (LKR)                                        │
```

---

## 6. Activity Diagram — Document Verification

```
        ( Seller has a listing )
                  │
                  ▼
        [Upload deed / title certificate]
                  │
                  ▼
        [Upload survey plan]
                  │
                  ▼
        [Upload land registry extract]  (optional)
                  │
                  ▼
        (( Status = PENDING ))  ──▶ notify all ADMINs
                  │
                  ▼
        ┌── Admin reviews each document ──┐
        │                                 │
    [Verify]                          [Reject + remarks]
        │                                 │
        ▼                                 ▼
  doc.status=VERIFIED               doc.status=REJECTED
        │                                 │
        └──────────────┬──────────────────┘
                       ▼
          ◇ (deed OR title) AND survey_plan
            both VERIFIED?
             │yes              │no
             ▼                 ▼
   land.verification    ◇ any REJECTED?
      = VERIFIED         │yes        │no
             │           ▼           ▼
             │      = REJECTED   = PENDING
             └───────────┴───────────┘
                       ▼
            notify seller · badge updates
                       ▼
        ( ✓ Verified Property shown to buyers )
        ⚠ administrative check only — not legal certification
```

---

## 7. Component Diagram

```
┌─────────────────────────── FRONTEND ────────────────────────────┐
│ core.js ─ API client · State · i18n(en/si/ta) · UI kit · LandCard│
│ chrome.js ─ Navbar · Footer · AI Chatbot                         │
│ charts.js ─ SVG bar/line/donut/hbar                              │
│ forms.js ─ contact · reserve · pay · review · upload · edit      │
│ pages-public.js · pages-auth.js · pages-dash.js · app.js(router) │
└──────────────────────────────┬───────────────────────────────────┘
                               │ REST/JSON
┌──────────────────────────────▼───────────────────────────────────┐
│  «component» AuthModule       «component» LandModule             │
│  «component» SearchModule     «component» BookingPaymentModule   │
│  «component» DocumentReviewModule  «component» AdminReportModule │
│  «shared» NotificationService · Validator · ApiError · PdfWriter │
└──────────────────────────────┬───────────────────────────────────┘
                    ┌──────────▼──────────┐
                    │  «database» MySQL 8 │
                    └─────────────────────┘
```

---

## 8. Deployment Diagram

```
┌───────────────┐   HTTPS   ┌──────────────────────────────────────┐
│ Client Device │──────────▶│  «node» Web/App Server               │
│ Desktop·Tablet│           │  Nginx (TLS, static, reverse proxy)  │
│ Mobile Browser│◀──────────│      └─▶ Node.js 20 · Express        │
└───────────────┘           │            PM2 process manager        │
        │                   └───────────────┬──────────────────────┘
        │ tiles/embed                       │ TCP 3306
        ▼                          ┌────────▼─────────┐
┌────────────────┐                 │ «node» DB Server │
│ Google Maps API│                 │  MySQL 8 (InnoDB)│
└────────────────┘                 │  daily backups   │
                                   └──────────────────┘
                                   ┌──────────────────┐
                                   │ «node» File Store│
                                   │ /uploads (images,│
                                   │  documents)      │
                                   └──────────────────┘
```

---

## 9. State Machines

**Listing:** `PENDING ──admin approve──▶ ACTIVE ──booking approved──▶ RESERVED ──completed──▶ SOLD`
`PENDING ──admin reject──▶ REJECTED` · any ──▶ `REMOVED`

**Reservation:** `PENDING ──seller──▶ APPROVED ──payment──▶ COMPLETED`
`PENDING ──seller──▶ REJECTED` · `PENDING|APPROVED ──buyer──▶ CANCELLED`

**Payment:** `PENDING ──admin confirm──▶ SUCCESSFUL ──▶ REFUNDED` · `PENDING ──▶ FAILED`

**Document:** `PENDING ──▶ VERIFIED | REJECTED`

---

## 10. Six-Member Module Ownership

| # | Member module | Frontend | Controller | Service | Repository | Entities | REST base |
|---|---|---|---|---|---|---|---|
| 1 | User & Authentication | `pages-auth.js` (login, register, forgot, profile) | `auth.controller`, `user.controller` | `auth.service` | `user.repository` | users, buyers, sellers, agents | `/api/auth`, `/api/users` |
| 2 | Land Listing | `pages-auth.js#sell`, `pages-public.js#land` | `land.controller` | `land.service` | `land.repository` | lands, land_images | `/api/lands` |
| 3 | Buyer, Search & Wishlist | `pages-public.js#buy`, `#locations`, `pages-auth.js#wishlist/compare` | `location.controller`, `wishlist.controller`, `message.controller` | (search in `land.service`) | `land.repository` | wishlist, recently_viewed, locations | `/api/locations`, `/api/wishlist`, `/api/messages` |
| 4 | Booking & Payment | `pages-dash.js#bookings/payments`, `forms.js#reserve/pay` | `booking.controller`, `payment.controller` | `booking.service`, `payment.service` | inline prepared statements | bookings, payments | `/api/bookings`, `/api/payments` |
| 5 | Document Verification & Reviews | `pages-dash.js#documents/reviews`, `forms.js#uploadDoc/review` | `document.controller`, `review.controller` | `document.service` | inline prepared statements | land_documents, reviews | `/api/documents`, `/api/reviews` |
| 6 | Admin Dashboard & Reporting | `pages-dash.js#admin*/reports`, `charts.js` | `admin.controller`, `notification.controller` | `notification.service` | `user.repository`, `land.repository` | reports, notifications | `/api/admin`, `/api/notifications` |

Each member owns a vertical slice: their own UI components, controller, service, repository
access, database entities and REST endpoints — enabling parallel Git branches with minimal
merge conflicts.

---

## 11. Non-Functional Requirements Coverage

| NFR | Implementation |
|---|---|
| Security | JWT (HS256, 8 h, issuer-checked), BCrypt hashing, RBAC middleware, parameterised SQL, HTML escaping on write, security headers, rate limiting, protected admin routes |
| Reliability | Global exception handler, structured JSON errors, FK/CHECK constraints, 109 automated tests |
| Performance | Indexed search columns, composite `idx_lands_search`, pagination (≤60/page), lazy image loading, skeleton loading states |
| Usability | Trilingual UI, mobile-first responsive breakpoints 375→1920 px, keyboard-accessible forms, toast feedback |
| Maintainability | Layered architecture, one folder per module, no framework lock-in, documented REST contract (`/api/docs`) |
| Portability | Node 18+, MySQL 8 or SQLite, zero native build steps beyond `npm install` |
