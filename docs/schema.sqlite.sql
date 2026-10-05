-- ============================================================
-- LandHub Sri Lanka — normalized schema (SQLite runtime mirror
-- of docs/schema.mysql.sql).  3NF, PK/FK/constraints/indexes.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('ADMIN','SELLER','BUYER','AGENT','SUPPORT')),
  nic           TEXT,
  avatar        TEXT,
  language      TEXT    NOT NULL DEFAULT 'en' CHECK (language IN ('en','si','ta')),
  status        TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS buyers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_district TEXT,
  budget_max       REAL
);

CREATE TABLE IF NOT EXISTS sellers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name   TEXT,
  business_reg_no TEXT,
  bank_account   TEXT,
  rating_avg     REAL NOT NULL DEFAULT 0,
  rating_count   INTEGER NOT NULL DEFAULT 0,
  verified       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  agency_name   TEXT,
  licence_no    TEXT,
  service_districts TEXT,
  commission_pct REAL NOT NULL DEFAULT 2.5
);

-- Province -> District -> City/Town -> Area  (self-referencing hierarchy)
CREATE TABLE IF NOT EXISTS locations (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  name_si   TEXT,
  name_ta   TEXT,
  level     TEXT NOT NULL CHECK (level IN ('PROVINCE','DISTRICT','CITY','AREA')),
  parent_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
  lat       REAL,
  lng       REAL
);
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_level  ON locations(level);

CREATE TABLE IF NOT EXISTS lands (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  title_si        TEXT,
  title_ta        TEXT,
  description     TEXT NOT NULL,
  land_type       TEXT NOT NULL CHECK (land_type IN
      ('Residential','Agricultural','Commercial','Coconut','Tea','Rubber',
       'Paddy','Beach','Industrial','Bare','Plantation','Investment')),
  province        TEXT NOT NULL,
  district        TEXT NOT NULL,
  city            TEXT NOT NULL,
  area            TEXT,
  address         TEXT,
  perches         REAL NOT NULL CHECK (perches > 0),
  price           REAL NOT NULL CHECK (price >= 0),
  price_per_perch REAL NOT NULL,
  negotiable      INTEGER NOT NULL DEFAULT 0,
  lat             REAL, lng REAL,
  electricity     INTEGER NOT NULL DEFAULT 0,
  water           INTEGER NOT NULL DEFAULT 0,
  main_road       INTEGER NOT NULL DEFAULT 0,
  internet        INTEGER NOT NULL DEFAULT 0,
  telephone       INTEGER NOT NULL DEFAULT 0,
  drainage        INTEGER NOT NULL DEFAULT 0,
  clear_deed      INTEGER NOT NULL DEFAULT 0,
  survey_plan     INTEGER NOT NULL DEFAULT 0,
  near_school     INTEGER NOT NULL DEFAULT 0,
  near_hospital   INTEGER NOT NULL DEFAULT 0,
  near_highway    INTEGER NOT NULL DEFAULT 0,
  near_railway    INTEGER NOT NULL DEFAULT 0,
  nearest_highway TEXT,
  nearby          TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','ACTIVE','REJECTED','RESERVED','SOLD','REMOVED')),
  verification    TEXT NOT NULL DEFAULT 'PENDING'
                  CHECK (verification IN ('PENDING','VERIFIED','REJECTED')),
  views           INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lands_district ON lands(district);
CREATE INDEX IF NOT EXISTS idx_lands_price    ON lands(price);
CREATE INDEX IF NOT EXISTS idx_lands_type     ON lands(land_type);
CREATE INDEX IF NOT EXISTS idx_lands_status   ON lands(status);
CREATE INDEX IF NOT EXISTS idx_lands_seller   ON lands(seller_id);

CREATE TABLE IF NOT EXISTS land_images (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  land_id  INTEGER NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  url      TEXT NOT NULL,
  is_cover INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_land ON land_images(land_id);

CREATE TABLE IF NOT EXISTS land_documents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  land_id     INTEGER NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL CHECK (doc_type IN
      ('DEED','TITLE_CERTIFICATE','SURVEY_PLAN','LAND_REGISTRY','OWNERSHIP','OTHER_LEGAL')),
  file_name   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','VERIFIED','REJECTED')),
  remarks     TEXT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_docs_land ON land_documents(land_id);

CREATE TABLE IF NOT EXISTS bookings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  land_id       INTEGER NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  buyer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_name    TEXT NOT NULL,
  contact_no    TEXT NOT NULL,
  email         TEXT NOT NULL,
  preferred_date TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED','COMPLETED')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer ON bookings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_land  ON bookings(land_id);

CREATE TABLE IF NOT EXISTS payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id  INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      REAL NOT NULL CHECK (amount > 0),
  currency    TEXT NOT NULL DEFAULT 'LKR',
  method      TEXT NOT NULL CHECK (method IN ('BANK_TRANSFER','CARD','ONLINE','GATEWAY')),
  status      TEXT NOT NULL DEFAULT 'PENDING'
              CHECK (status IN ('PENDING','SUCCESSFUL','FAILED','REFUNDED')),
  reference   TEXT NOT NULL UNIQUE,
  invoice_no  TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  land_id    INTEGER REFERENCES lands(id) ON DELETE CASCADE,
  seller_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  status     TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);

CREATE TABLE IF NOT EXISTS wishlist (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  land_id  INTEGER NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, land_id)
);

CREATE TABLE IF NOT EXISTS recently_viewed (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  land_id  INTEGER NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, land_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation TEXT NOT NULL,          -- canonical "landId:minUser:maxUser"
  land_id      INTEGER REFERENCES lands(id) ON DELETE SET NULL,
  sender_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  is_read      INTEGER NOT NULL DEFAULT 0,
  edited       INTEGER NOT NULL DEFAULT 0,
  edited_at    TEXT,
  deleted      INTEGER NOT NULL DEFAULT 0,
  deleted_at   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation);

CREATE TABLE IF NOT EXISTS notifications (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type     TEXT NOT NULL,
  title    TEXT NOT NULL,
  body     TEXT,
  link     TEXT,
  is_read  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS inquiries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  land_id         INTEGER REFERENCES lands(id) ON DELETE SET NULL,
  subject         TEXT NOT NULL,
  message         TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'GENERAL'
                  CHECK (category IN ('GENERAL','LAND_INQUIRY','RESERVATION','PAYMENT','COMPLAINT','OTHER')),
  status          TEXT NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','PENDING_CLARIFICATION','RESOLVED')),
  assigned_staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer ON inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status   ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_staff    ON inquiries(assigned_staff_id);

CREATE TABLE IF NOT EXISTS inquiry_responses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id  INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'RESPONSE'
               CHECK (message_type IN ('RESPONSE','CLARIFICATION_REQUEST','CLARIFICATION_REPLY')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inqresp_inquiry ON inquiry_responses(inquiry_id);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL,
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  params      TEXT,
  payload     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
