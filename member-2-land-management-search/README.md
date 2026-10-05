# 🏞️ Member 2: Land Management & Search

## 📌 Module Overview
This module manages the core inventory of land properties across all 25 Sri Lankan districts. It handles land listing creation, multi-attribute searching, per-perch price calculations, photo uploads, expressway accessibility tagging, and hierarchical location management.

---

## 🗂️ Component Structure
```
member-2-land-management-search/
├── backend/
│   ├── controllers/
│   │   ├── LandController.java          # REST endpoints for land search, filter, and CRUD
│   │   └── LocationController.java      # Endpoints for Sri Lanka Province/District/City hierarchy
│   ├── data/
│   │   ├── LandRepository.java          # Spring Data JPA repository for Land queries
│   │   ├── LandImageRepository.java     # Repository for property galleries & cover photos
│   │   └── LocationRepository.java      # Repository for locations with self-referencing hierarchy
│   ├── datastructures/
│   │   ├── LandBinarySearchTree.java    # Custom BST for logarithmic price-range indexing
│   │   └── LocationPrefixTrie.java      # Custom Trie for instant O(m) location auto-complete
│   ├── models/
│   │   ├── Land.java                    # Core Land listing entity
│   │   ├── LandImage.java               # Image entity for land photos
│   │   ├── Location.java                # Location entity (Province, District, City)
│   │   ├── LandType.java                # Enum (Residential, Agricultural, Commercial, etc.)
│   │   ├── LandStatus.java              # Enum (PENDING, ACTIVE, RESERVED, SOLD, REJECTED)
│   │   └── LocationLevel.java           # Enum (PROVINCE, DISTRICT, CITY, AREA)
│   └── services/
│       ├── LandService.java             # Price-per-perch auto-derivation, search filtering
│       └── LocationService.java         # Location tree traversal and expressway exit mapping
├── frontend/
│   └── LandManagementSearch.js          # Search bar, multi-filter panels, card views, listing form
├── styles/
│   └── land-management-search.css       # Property card grid, filter badges, unit conversion styling
└── README.md                            # Member documentation
```

---

## 🔌 REST API Endpoints
| HTTP Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/lands` | Search properties with filters (district, price, perch, highway) | Public |
| `GET` | `/api/lands/:id` | Fetch complete property specs & image gallery | Public |
| `POST` | `/api/lands` | Create new land listing with documents & images | Seller / Agent |
| `PUT` | `/api/lands/:id` | Update land details, status, or pricing | Seller / Admin |
| `DELETE` | `/api/lands/:id` | Remove property listing | Seller / Admin |
| `GET` | `/api/locations` | Get complete Sri Lanka province/district/city hierarchy | Public |

---

## 🧠 Custom Data Structures Implemented
1. **`LandBinarySearchTree`**: A Binary Search Tree that keys listings by total price in LKR, allowing logarithmic $O(\log n)$ price-bracket lookups and sorted in-order traversals.
2. **`LocationPrefixTrie`**: A Trie (Prefix Tree) storing Sri Lankan cities, towns, and districts to power instant, zero-latency auto-complete suggestions.
