-- ==========================================================================
--  LandHub Sri Lanka — Normalized MySQL 8 Schema (3NF)
--  Web-Based Land Sales & Property Management System
--
--  Usage:  mysql -u root -p < docs/schema.mysql.sql
-- ==========================================================================

DROP DATABASE IF EXISTS landhub_lk;
CREATE DATABASE landhub_lk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE landhub_lk;

-- --------------------------------------------------------------------------
-- 1. USERS  (Member 1 — User & Authentication Management)
-- --------------------------------------------------------------------------
CREATE TABLE users (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(80)  NOT NULL,
  email          VARCHAR(120) NOT NULL,
  phone          VARCHAR(20)  NULL COMMENT 'Sri Lankan format +94 XX XXX XXXX',
  password_hash  VARCHAR(72)  NOT NULL COMMENT 'BCrypt',
  role           ENUM('ADMIN','SELLER','BUYER','AGENT') NOT NULL,
  nic            VARCHAR(20)  NULL COMMENT 'National Identity Card number',
  avatar         VARCHAR(255) NULL,
  language       ENUM('en','si','ta') NOT NULL DEFAULT 'en',
  status         ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE buyers (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT UNSIGNED NOT NULL,
  preferred_district VARCHAR(40) NULL,
  budget_max         DECIMAL(15,2) NULL COMMENT 'LKR',
  UNIQUE KEY uq_buyers_user (user_id),
  CONSTRAINT fk_buyers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sellers (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  company_name    VARCHAR(120) NULL,
  business_reg_no VARCHAR(40)  NULL,
  bank_account    VARCHAR(40)  NULL,
  rating_avg      DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count    INT UNSIGNED NOT NULL DEFAULT 0,
  verified        TINYINT(1)   NOT NULL DEFAULT 0,
  UNIQUE KEY uq_sellers_user (user_id),
  CONSTRAINT fk_sellers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_sellers_rating CHECK (rating_avg BETWEEN 0 AND 5)
) ENGINE=InnoDB;

CREATE TABLE agents (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  agency_name       VARCHAR(120) NULL,
  licence_no        VARCHAR(40)  NULL,
  service_districts VARCHAR(255) NULL,
  commission_pct    DECIMAL(5,2) NOT NULL DEFAULT 2.50,
  UNIQUE KEY uq_agents_user (user_id),
  CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 2. LOCATIONS  — Province > District > City/Town > Area
-- --------------------------------------------------------------------------
CREATE TABLE locations (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(80) NOT NULL,
  name_si   VARCHAR(120) NULL,
  name_ta   VARCHAR(120) NULL,
  level     ENUM('PROVINCE','DISTRICT','CITY','AREA') NOT NULL,
  parent_id BIGINT UNSIGNED NULL,
  lat       DECIMAL(10,7) NULL,
  lng       DECIMAL(10,7) NULL,
  KEY idx_locations_parent (parent_id),
  KEY idx_locations_level  (level),
  CONSTRAINT fk_locations_parent FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 3. LANDS  (Member 2 — Land Listing Management)
--    Canonical size unit = PERCH (1 perch = 272.25 sq.ft = 25.29 sq.m)
-- --------------------------------------------------------------------------
CREATE TABLE lands (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id       BIGINT UNSIGNED NOT NULL,
  agent_id        BIGINT UNSIGNED NULL,
  title           VARCHAR(150) NOT NULL,
  title_si        VARCHAR(200) NULL,
  title_ta        VARCHAR(200) NULL,
  description     TEXT NOT NULL,
  land_type       ENUM('Residential','Agricultural','Commercial','Coconut','Tea','Rubber',
                       'Paddy','Beach','Industrial','Bare','Plantation','Investment') NOT NULL,
  province        VARCHAR(40) NOT NULL,
  district        VARCHAR(40) NOT NULL,
  city            VARCHAR(60) NOT NULL,
  area            VARCHAR(80) NULL,
  address         VARCHAR(200) NULL,
  perches         DECIMAL(12,2) NOT NULL COMMENT 'canonical size',
  price           DECIMAL(15,2) NOT NULL COMMENT 'LKR total',
  price_per_perch DECIMAL(15,2) NOT NULL COMMENT 'LKR, derived',
  negotiable      TINYINT(1) NOT NULL DEFAULT 0,
  lat             DECIMAL(10,7) NULL,
  lng             DECIMAL(10,7) NULL,
  electricity     TINYINT(1) NOT NULL DEFAULT 0,
  water           TINYINT(1) NOT NULL DEFAULT 0,
  main_road       TINYINT(1) NOT NULL DEFAULT 0,
  internet        TINYINT(1) NOT NULL DEFAULT 0,
  telephone       TINYINT(1) NOT NULL DEFAULT 0,
  drainage        TINYINT(1) NOT NULL DEFAULT 0,
  clear_deed      TINYINT(1) NOT NULL DEFAULT 0,
  survey_plan     TINYINT(1) NOT NULL DEFAULT 0,
  near_school     TINYINT(1) NOT NULL DEFAULT 0,
  near_hospital   TINYINT(1) NOT NULL DEFAULT 0,
  near_highway    TINYINT(1) NOT NULL DEFAULT 0,
  near_railway    TINYINT(1) NOT NULL DEFAULT 0,
  nearest_highway VARCHAR(60) NULL COMMENT 'e.g. Southern Expressway (E01)',
  nearby          JSON NULL COMMENT 'nearby facility tags',
  status          ENUM('PENDING','ACTIVE','REJECTED','RESERVED','SOLD','REMOVED') NOT NULL DEFAULT 'PENDING',
  verification    ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
  views           INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_lands_seller   (seller_id),
  KEY idx_lands_district (district),
  KEY idx_lands_province (province),
  KEY idx_lands_price    (price),
  KEY idx_lands_ppp      (price_per_perch),
  KEY idx_lands_type     (land_type),
  KEY idx_lands_status   (status),
  KEY idx_lands_search   (district, land_type, status, price),
  FULLTEXT KEY ft_lands (title, description),
  CONSTRAINT fk_lands_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lands_agent  FOREIGN KEY (agent_id)  REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_lands_perches CHECK (perches > 0),
  CONSTRAINT chk_lands_price   CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE land_images (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  land_id    BIGINT UNSIGNED NOT NULL,
  url        VARCHAR(255) NOT NULL,
  is_cover   TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  KEY idx_images_land (land_id),
  CONSTRAINT fk_images_land FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 4. DOCUMENT VERIFICATION  (Member 5)
-- --------------------------------------------------------------------------
CREATE TABLE land_documents (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  land_id     BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  doc_type    ENUM('DEED','TITLE_CERTIFICATE','SURVEY_PLAN','LAND_REGISTRY','OWNERSHIP','OTHER_LEGAL') NOT NULL,
  file_name   VARCHAR(160) NOT NULL,
  file_path   VARCHAR(255) NULL,
  status      ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
  remarks     VARCHAR(500) NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_docs_land   (land_id),
  KEY idx_docs_status (status),
  CONSTRAINT fk_docs_land     FOREIGN KEY (land_id)     REFERENCES lands(id) ON DELETE CASCADE,
  CONSTRAINT fk_docs_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_docs_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 5. BOOKINGS & PAYMENTS  (Member 4)
-- --------------------------------------------------------------------------
CREATE TABLE bookings (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  land_id        BIGINT UNSIGNED NOT NULL,
  buyer_id       BIGINT UNSIGNED NOT NULL,
  seller_id      BIGINT UNSIGNED NOT NULL,
  buyer_name     VARCHAR(80) NOT NULL,
  contact_no     VARCHAR(20) NOT NULL,
  email          VARCHAR(120) NOT NULL,
  preferred_date DATE NULL,
  message        VARCHAR(800) NULL,
  status         ENUM('PENDING','APPROVED','REJECTED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_bookings_land   (land_id),
  KEY idx_bookings_buyer  (buyer_id),
  KEY idx_bookings_seller (seller_id),
  KEY idx_bookings_status (status),
  CONSTRAINT fk_bookings_land   FOREIGN KEY (land_id)   REFERENCES lands(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_buyer  FOREIGN KEY (buyer_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payments (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  payer_id   BIGINT UNSIGNED NOT NULL,
  amount     DECIMAL(15,2) NOT NULL,
  currency   CHAR(3) NOT NULL DEFAULT 'LKR',
  method     ENUM('BANK_TRANSFER','CARD','ONLINE','GATEWAY') NOT NULL,
  status     ENUM('PENDING','SUCCESSFUL','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  reference  VARCHAR(40) NOT NULL,
  invoice_no VARCHAR(30) NOT NULL,
  is_sandbox TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'demo payments only',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_ref     (reference),
  UNIQUE KEY uq_payments_invoice (invoice_no),
  KEY idx_payments_payer  (payer_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_payer   FOREIGN KEY (payer_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 6. REVIEWS, WISHLIST, MESSAGING, NOTIFICATIONS  (Members 3, 5, 6)
-- --------------------------------------------------------------------------
CREATE TABLE reviews (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  land_id    BIGINT UNSIGNED NULL,
  seller_id  BIGINT UNSIGNED NOT NULL,
  buyer_id   BIGINT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  comment    VARCHAR(1000) NULL,
  status     ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_reviews_seller (seller_id),
  KEY idx_reviews_status (status),
  CONSTRAINT fk_reviews_land   FOREIGN KEY (land_id)   REFERENCES lands(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_buyer  FOREIGN KEY (buyer_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE wishlist (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  land_id    BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, land_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_land FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE recently_viewed (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id   BIGINT UNSIGNED NOT NULL,
  land_id   BIGINT UNSIGNED NOT NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_recent (user_id, land_id),
  CONSTRAINT fk_recent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recent_land FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE messages (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation VARCHAR(60) NOT NULL COMMENT 'landId:minUserId:maxUserId',
  land_id      BIGINT UNSIGNED NULL,
  sender_id    BIGINT UNSIGNED NOT NULL,
  receiver_id  BIGINT UNSIGNED NOT NULL,
  body         VARCHAR(1500) NOT NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_messages_conv     (conversation),
  KEY idx_messages_receiver (receiver_id, is_read),
  CONSTRAINT fk_messages_land     FOREIGN KEY (land_id)     REFERENCES lands(id) ON DELETE SET NULL,
  CONSTRAINT fk_messages_sender   FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       VARCHAR(40) NOT NULL,
  title      VARCHAR(120) NOT NULL,
  body       VARCHAR(400) NULL,
  link       VARCHAR(160) NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_user (user_id, is_read),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reports (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_type  VARCHAR(40) NOT NULL,
  generated_by BIGINT UNSIGNED NULL,
  params       JSON NULL,
  payload      JSON NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_reports_type (report_type),
  CONSTRAINT fk_reports_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 7. VIEWS for reporting (Member 6)
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_district_stats AS
SELECT district, province, COUNT(*) AS listings,
       ROUND(AVG(price_per_perch)) AS avg_price_per_perch,
       ROUND(AVG(perches), 2) AS avg_perches
FROM lands WHERE status IN ('ACTIVE','RESERVED')
GROUP BY district, province;

CREATE OR REPLACE VIEW v_seller_performance AS
SELECT u.id AS seller_id, u.full_name, s.company_name,
       COUNT(DISTINCT l.id) AS total_listings,
       SUM(l.views) AS total_views,
       COUNT(DISTINCT b.id) AS total_reservations,
       s.rating_avg, s.rating_count
FROM users u
JOIN sellers s ON s.user_id = u.id
LEFT JOIN lands l ON l.seller_id = u.id
LEFT JOIN bookings b ON b.seller_id = u.id
GROUP BY u.id, u.full_name, s.company_name, s.rating_avg, s.rating_count;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       COUNT(*) AS transactions, SUM(amount) AS revenue_lkr
FROM payments WHERE status = 'SUCCESSFUL'
GROUP BY month ORDER BY month;

-- --------------------------------------------------------------------------
-- 8. Trigger: keep price_per_perch consistent
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_lands_ppp_ins BEFORE INSERT ON lands FOR EACH ROW
BEGIN
  SET NEW.price_per_perch = ROUND(NEW.price / NEW.perches);
END$$
CREATE TRIGGER trg_lands_ppp_upd BEFORE UPDATE ON lands FOR EACH ROW
BEGIN
  SET NEW.price_per_perch = ROUND(NEW.price / NEW.perches);
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 9. Sample seed (fictional demo data)
-- --------------------------------------------------------------------------
INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
 ('Admin Nimal Perera','admin@landhub.lk','+94 11 234 5678','$2a$10$DEMOHASHREPLACEME','ADMIN'),
 ('Sunil Rajapaksha','sunil@landhub.lk','+94 77 123 4567','$2a$10$DEMOHASHREPLACEME','SELLER'),
 ('Dilani Fernando','dilani@landhub.lk','+94 70 334 1122','$2a$10$DEMOHASHREPLACEME','BUYER');

INSERT INTO sellers (user_id, company_name, verified) VALUES (2, 'Sunil Lands & Properties', 1);
INSERT INTO buyers  (user_id, preferred_district, budget_max) VALUES (3, 'Colombo', 15000000);

INSERT INTO lands (seller_id,title,description,land_type,province,district,city,area,perches,price,price_per_perch,
                   main_road,electricity,water,clear_deed,survey_plan,status,verification)
VALUES
 (2,'20 Perch Residential Land for Sale in Piliyandala','Flat 20 perch block 1.2 km from Piliyandala town.',
  'Residential','Western Province','Colombo','Piliyandala','Kesbewa Road',20,9500000,475000,1,1,1,1,1,'ACTIVE','VERIFIED'),
 (2,'15 Perch Land with Clear Deed in Kadawatha','Quiet lane off Ganemulla Road, 900 m to the E04 interchange.',
  'Residential','Western Province','Gampaha','Kadawatha','Ganemulla Road',15,7250000,483333,1,1,1,1,1,'ACTIVE','VERIFIED'),
 (2,'30 Perch Land with Hill View in Kandy','Elevated Hantana block overlooking the Kandy valley.',
  'Residential','Central Province','Kandy','Kandy','Hantana',30,12500000,416667,1,1,1,1,1,'ACTIVE','VERIFIED'),
 (2,'25 Perch Land Close to Galle Fort','Level block in Dangedara, 2.5 km from the Galle Fort.',
  'Residential','Southern Province','Galle','Galle','Dangedara',25,8750000,350000,1,1,1,1,1,'ACTIVE','VERIFIED');
