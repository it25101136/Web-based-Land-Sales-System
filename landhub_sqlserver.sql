-- ============================================================================
-- LandHub Sri Lanka — Production Microsoft SQL Server / T-SQL Database Schema
-- Database Name: landhub_lk
-- Target Environment: Microsoft SQL Server 2017+ / 2019 / 2022 / 2025 / Azure SQL
-- Executable in: SQL Server Management Studio (SSMS) / sqlcmd
-- Total Core Tables: 18 (including dbo.inquiries & dbo.inquiry_responses)
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- ============================================================================
-- DATABASE CREATION (Safe & Idempotent)
-- ============================================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'landhub_lk')
BEGIN
    PRINT 'Creating database [landhub_lk]...';
    CREATE DATABASE [landhub_lk];
END
ELSE
BEGIN
    PRINT 'Database [landhub_lk] already exists.';
END
GO

USE [landhub_lk];
GO

-- Ensure standard ANSI settings
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
GO

-- ============================================================================
-- 1. TABLE: dbo.users
-- Member 1 — User & Authentication Management
-- Supported roles: ADMIN, SELLER, BUYER, AGENT, SUPPORT
-- ============================================================================
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id            BIGINT IDENTITY(1,1) NOT NULL,
        full_name     NVARCHAR(80)         NOT NULL,
        email         NVARCHAR(120)        NOT NULL,
        phone         NVARCHAR(20)         NULL, -- Sri Lankan format e.g. +94 77 123 4567
        password_hash VARCHAR(72)          NOT NULL, -- BCrypt hashed
        role          VARCHAR(20)          NOT NULL,
        nic           NVARCHAR(20)         NULL, -- National Identity Card
        avatar        NVARCHAR(255)        NULL,
        language      VARCHAR(10)          NOT NULL CONSTRAINT DF_users_language DEFAULT 'en',
        status        VARCHAR(20)          NOT NULL CONSTRAINT DF_users_status DEFAULT 'ACTIVE',
        created_at    DATETIME2(3)         NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSDATETIME(),
        updated_at    DATETIME2(3)         NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_users PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_users_email UNIQUE NONCLUSTERED (email),
        CONSTRAINT CK_users_role CHECK (role IN ('ADMIN', 'SELLER', 'BUYER', 'AGENT', 'SUPPORT')),
        CONSTRAINT CK_users_language CHECK (language IN ('en', 'si', 'ta')),
        CONSTRAINT CK_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
    );

    CREATE NONCLUSTERED INDEX idx_users_role ON dbo.users (role);
    CREATE NONCLUSTERED INDEX idx_users_status ON dbo.users (status);

    PRINT 'Created table dbo.users.';
END
GO

-- ============================================================================
-- 2. TABLE: dbo.buyers
-- Extended profile for land buyers
-- ============================================================================
IF OBJECT_ID(N'dbo.buyers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.buyers (
        id                 BIGINT IDENTITY(1,1) NOT NULL,
        user_id            BIGINT               NOT NULL,
        preferred_district NVARCHAR(40)         NULL,
        budget_max         DECIMAL(15,2)        NULL, -- in LKR

        CONSTRAINT PK_buyers PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_buyers_user UNIQUE NONCLUSTERED (user_id),
        CONSTRAINT FK_buyers_users FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );

    PRINT 'Created table dbo.buyers.';
END
GO

-- ============================================================================
-- 3. TABLE: dbo.sellers
-- Extended profile for land sellers
-- ============================================================================
IF OBJECT_ID(N'dbo.sellers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sellers (
        id              BIGINT IDENTITY(1,1) NOT NULL,
        user_id         BIGINT               NOT NULL,
        company_name    NVARCHAR(120)        NULL,
        business_reg_no NVARCHAR(40)         NULL,
        bank_account    NVARCHAR(40)         NULL,
        rating_avg      DECIMAL(3,2)         NOT NULL CONSTRAINT DF_sellers_rating_avg DEFAULT 0.00,
        rating_count    INT                  NOT NULL CONSTRAINT DF_sellers_rating_count DEFAULT 0,
        verified        BIT                  NOT NULL CONSTRAINT DF_sellers_verified DEFAULT 0,

        CONSTRAINT PK_sellers PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_sellers_user UNIQUE NONCLUSTERED (user_id),
        CONSTRAINT FK_sellers_users FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE,
        CONSTRAINT CK_sellers_rating CHECK (rating_avg BETWEEN 0.00 AND 5.00)
    );

    PRINT 'Created table dbo.sellers.';
END
GO

-- ============================================================================
-- 4. TABLE: dbo.agents
-- Extended profile for licensed real-estate agents
-- ============================================================================
IF OBJECT_ID(N'dbo.agents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.agents (
        id                BIGINT IDENTITY(1,1) NOT NULL,
        user_id           BIGINT               NOT NULL,
        agency_name       NVARCHAR(120)        NULL,
        licence_no        NVARCHAR(40)         NULL,
        service_districts NVARCHAR(255)        NULL,
        commission_pct    DECIMAL(5,2)         NOT NULL CONSTRAINT DF_agents_commission_pct DEFAULT 2.50,

        CONSTRAINT PK_agents PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_agents_user UNIQUE NONCLUSTERED (user_id),
        CONSTRAINT FK_agents_users FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );

    PRINT 'Created table dbo.agents.';
END
GO

-- ============================================================================
-- 5. TABLE: dbo.locations
-- Province > District > City/Town > Area hierarchy
-- Multilingual: English, Sinhala (name_si), Tamil (name_ta)
-- ============================================================================
IF OBJECT_ID(N'dbo.locations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.locations (
        id        BIGINT IDENTITY(1,1) NOT NULL,
        name      NVARCHAR(80)         NOT NULL,
        name_si   NVARCHAR(120)        NULL,
        name_ta   NVARCHAR(120)        NULL,
        level     VARCHAR(20)          NOT NULL,
        parent_id BIGINT               NULL,
        lat       DECIMAL(10,7)        NULL,
        lng       DECIMAL(10,7)        NULL,

        CONSTRAINT PK_locations PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_locations_level CHECK (level IN ('PROVINCE', 'DISTRICT', 'CITY', 'AREA')),
        CONSTRAINT FK_locations_parent FOREIGN KEY (parent_id) REFERENCES dbo.locations (id) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX idx_locations_parent ON dbo.locations (parent_id);
    CREATE NONCLUSTERED INDEX idx_locations_level ON dbo.locations (level);

    PRINT 'Created table dbo.locations.';
END
GO

-- ============================================================================
-- 6. TABLE: dbo.lands
-- Member 2 — Land Listing Management
-- Canonical size unit = PERCH (1 perch = 272.25 sq.ft = 25.2929 sq.m)
-- ============================================================================
IF OBJECT_ID(N'dbo.lands', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.lands (
        id              BIGINT IDENTITY(1,1) NOT NULL,
        seller_id       BIGINT               NOT NULL,
        agent_id        BIGINT               NULL,
        title           NVARCHAR(150)        NOT NULL,
        title_si        NVARCHAR(200)        NULL,
        title_ta        NVARCHAR(200)        NULL,
        description     NVARCHAR(MAX)        NOT NULL,
        land_type       VARCHAR(30)          NOT NULL,
        province        NVARCHAR(40)         NOT NULL,
        district        NVARCHAR(40)         NOT NULL,
        city            NVARCHAR(60)         NOT NULL,
        area            NVARCHAR(80)         NULL,
        address         NVARCHAR(200)        NULL,
        perches         DECIMAL(12,2)        NOT NULL,
        price           DECIMAL(15,2)        NOT NULL, -- Total in LKR
        price_per_perch DECIMAL(15,2)        NOT NULL, -- Derived / verified by trigger
        negotiable      BIT                  NOT NULL CONSTRAINT DF_lands_negotiable DEFAULT 0,
        lat             DECIMAL(10,7)        NULL,
        lng             DECIMAL(10,7)        NULL,
        electricity     BIT                  NOT NULL CONSTRAINT DF_lands_electricity DEFAULT 0,
        water           BIT                  NOT NULL CONSTRAINT DF_lands_water DEFAULT 0,
        main_road       BIT                  NOT NULL CONSTRAINT DF_lands_main_road DEFAULT 0,
        internet        BIT                  NOT NULL CONSTRAINT DF_lands_internet DEFAULT 0,
        telephone       BIT                  NOT NULL CONSTRAINT DF_lands_telephone DEFAULT 0,
        drainage        BIT                  NOT NULL CONSTRAINT DF_lands_drainage DEFAULT 0,
        clear_deed      BIT                  NOT NULL CONSTRAINT DF_lands_clear_deed DEFAULT 0,
        survey_plan     BIT                  NOT NULL CONSTRAINT DF_lands_survey_plan DEFAULT 0,
        near_school     BIT                  NOT NULL CONSTRAINT DF_lands_near_school DEFAULT 0,
        near_hospital   BIT                  NOT NULL CONSTRAINT DF_lands_near_hospital DEFAULT 0,
        near_highway    BIT                  NOT NULL CONSTRAINT DF_lands_near_highway DEFAULT 0,
        near_railway    BIT                  NOT NULL CONSTRAINT DF_lands_near_railway DEFAULT 0,
        nearest_highway NVARCHAR(60)         NULL,
        nearby          NVARCHAR(MAX)        NULL, -- JSON array of nearby facilities
        status          VARCHAR(20)          NOT NULL CONSTRAINT DF_lands_status DEFAULT 'PENDING',
        verification    VARCHAR(20)          NOT NULL CONSTRAINT DF_lands_verification DEFAULT 'PENDING',
        views           INT                  NOT NULL CONSTRAINT DF_lands_views DEFAULT 0,
        created_at      DATETIME2(3)         NOT NULL CONSTRAINT DF_lands_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2(3)         NOT NULL CONSTRAINT DF_lands_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_lands PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_lands_seller FOREIGN KEY (seller_id) REFERENCES dbo.users (id) ON DELETE CASCADE,
        CONSTRAINT FK_lands_agent FOREIGN KEY (agent_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT CK_lands_perches CHECK (perches > 0),
        CONSTRAINT CK_lands_price CHECK (price >= 0),
        CONSTRAINT CK_lands_nearby_json CHECK (nearby IS NULL OR ISJSON(nearby) = 1),
        CONSTRAINT CK_lands_type CHECK (land_type IN (
            'Residential', 'Agricultural', 'Commercial', 'Coconut', 'Tea', 'Rubber',
            'Paddy', 'Beach', 'Industrial', 'Bare', 'Plantation', 'Investment'
        )),
        CONSTRAINT CK_lands_status CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'RESERVED', 'SOLD', 'REMOVED')),
        CONSTRAINT CK_lands_verification CHECK (verification IN ('PENDING', 'VERIFIED', 'REJECTED'))
    );

    CREATE NONCLUSTERED INDEX idx_lands_seller ON dbo.lands (seller_id);
    CREATE NONCLUSTERED INDEX idx_lands_district ON dbo.lands (district);
    CREATE NONCLUSTERED INDEX idx_lands_province ON dbo.lands (province);
    CREATE NONCLUSTERED INDEX idx_lands_price ON dbo.lands (price);
    CREATE NONCLUSTERED INDEX idx_lands_ppp ON dbo.lands (price_per_perch);
    CREATE NONCLUSTERED INDEX idx_lands_type ON dbo.lands (land_type);
    CREATE NONCLUSTERED INDEX idx_lands_status ON dbo.lands (status);
    CREATE NONCLUSTERED INDEX idx_lands_search ON dbo.lands (district, land_type, status, price);

    PRINT 'Created table dbo.lands.';
END
GO

-- ============================================================================
-- 7. TABLE: dbo.land_images
-- Photos and cover image for listings
-- ============================================================================
IF OBJECT_ID(N'dbo.land_images', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.land_images (
        id         BIGINT IDENTITY(1,1) NOT NULL,
        land_id    BIGINT               NOT NULL,
        url        NVARCHAR(255)        NOT NULL,
        is_cover   BIT                  NOT NULL CONSTRAINT DF_land_images_is_cover DEFAULT 0,
        sort_order INT                  NOT NULL CONSTRAINT DF_land_images_sort_order DEFAULT 0,

        CONSTRAINT PK_land_images PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_land_images_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX idx_images_land ON dbo.land_images (land_id);

    PRINT 'Created table dbo.land_images.';
END
GO

-- ============================================================================
-- 8. TABLE: dbo.land_documents
-- Member 5 — Legal Document Verification
-- ============================================================================
IF OBJECT_ID(N'dbo.land_documents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.land_documents (
        id          BIGINT IDENTITY(1,1) NOT NULL,
        land_id     BIGINT               NOT NULL,
        uploaded_by BIGINT               NOT NULL,
        doc_type    VARCHAR(30)          NOT NULL,
        file_name   NVARCHAR(160)        NOT NULL,
        file_path   NVARCHAR(255)        NULL,
        status      VARCHAR(20)          NOT NULL CONSTRAINT DF_land_documents_status DEFAULT 'PENDING',
        remarks     NVARCHAR(500)        NULL,
        reviewed_by BIGINT               NULL,
        reviewed_at DATETIME2(3)         NULL,
        created_at  DATETIME2(3)         NOT NULL CONSTRAINT DF_land_documents_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_land_documents PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_land_documents_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE CASCADE,
        CONSTRAINT FK_land_documents_uploader FOREIGN KEY (uploaded_by) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT FK_land_documents_reviewer FOREIGN KEY (reviewed_by) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT CK_land_documents_type CHECK (doc_type IN (
            'DEED', 'TITLE_CERTIFICATE', 'SURVEY_PLAN', 'LAND_REGISTRY', 'OWNERSHIP', 'OTHER_LEGAL'
        )),
        CONSTRAINT CK_land_documents_status CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED'))
    );

    CREATE NONCLUSTERED INDEX idx_docs_land ON dbo.land_documents (land_id);
    CREATE NONCLUSTERED INDEX idx_docs_status ON dbo.land_documents (status);

    PRINT 'Created table dbo.land_documents.';
END
GO

-- ============================================================================
-- 9. TABLE: dbo.bookings
-- Member 4 — Site Visit / Reservation Bookings
-- ============================================================================
IF OBJECT_ID(N'dbo.bookings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bookings (
        id             BIGINT IDENTITY(1,1) NOT NULL,
        land_id        BIGINT               NOT NULL,
        buyer_id       BIGINT               NOT NULL,
        seller_id      BIGINT               NOT NULL,
        buyer_name     NVARCHAR(80)         NOT NULL,
        contact_no     NVARCHAR(20)         NOT NULL,
        email          NVARCHAR(120)        NOT NULL,
        preferred_date DATE                 NULL,
        message        NVARCHAR(800)        NULL,
        status         VARCHAR(20)          NOT NULL CONSTRAINT DF_bookings_status DEFAULT 'PENDING',
        created_at     DATETIME2(3)         NOT NULL CONSTRAINT DF_bookings_created_at DEFAULT SYSDATETIME(),
        updated_at     DATETIME2(3)         NOT NULL CONSTRAINT DF_bookings_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_bookings PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_bookings_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE CASCADE,
        CONSTRAINT FK_bookings_buyer FOREIGN KEY (buyer_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT FK_bookings_seller FOREIGN KEY (seller_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT CK_bookings_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'))
    );

    CREATE NONCLUSTERED INDEX idx_bookings_land ON dbo.bookings (land_id);
    CREATE NONCLUSTERED INDEX idx_bookings_buyer ON dbo.bookings (buyer_id);
    CREATE NONCLUSTERED INDEX idx_bookings_seller ON dbo.bookings (seller_id);
    CREATE NONCLUSTERED INDEX idx_bookings_status ON dbo.bookings (status);

    PRINT 'Created table dbo.bookings.';
END
GO

-- ============================================================================
-- 10. TABLE: dbo.payments
-- Member 4 — Payments & Financial Transactions (LKR)
-- ============================================================================
IF OBJECT_ID(N'dbo.payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.payments (
        id         BIGINT IDENTITY(1,1) NOT NULL,
        booking_id BIGINT               NOT NULL,
        payer_id   BIGINT               NOT NULL,
        amount     DECIMAL(15,2)        NOT NULL,
        currency   CHAR(3)              NOT NULL CONSTRAINT DF_payments_currency DEFAULT 'LKR',
        method     VARCHAR(20)          NOT NULL,
        status     VARCHAR(20)          NOT NULL CONSTRAINT DF_payments_status DEFAULT 'PENDING',
        reference  NVARCHAR(40)         NOT NULL,
        invoice_no NVARCHAR(30)         NOT NULL,
        is_sandbox BIT                  NOT NULL CONSTRAINT DF_payments_is_sandbox DEFAULT 1,
        created_at DATETIME2(3)         NOT NULL CONSTRAINT DF_payments_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_payments PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_payments_reference UNIQUE NONCLUSTERED (reference),
        CONSTRAINT UQ_payments_invoice_no UNIQUE NONCLUSTERED (invoice_no),
        CONSTRAINT FK_payments_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings (id) ON DELETE CASCADE,
        CONSTRAINT FK_payments_payer FOREIGN KEY (payer_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT CK_payments_amount CHECK (amount > 0),
        CONSTRAINT CK_payments_method CHECK (method IN ('BANK_TRANSFER', 'CARD', 'ONLINE', 'GATEWAY')),
        CONSTRAINT CK_payments_status CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'))
    );

    CREATE NONCLUSTERED INDEX idx_payments_payer ON dbo.payments (payer_id);
    CREATE NONCLUSTERED INDEX idx_payments_status ON dbo.payments (status);

    PRINT 'Created table dbo.payments.';
END
GO

-- ============================================================================
-- 11. TABLE: dbo.reviews
-- Member 5 — Seller Reviews and Ratings (1 to 5 Stars)
-- ============================================================================
IF OBJECT_ID(N'dbo.reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.reviews (
        id         BIGINT IDENTITY(1,1) NOT NULL,
        land_id    BIGINT               NULL,
        seller_id  BIGINT               NOT NULL,
        buyer_id   BIGINT               NOT NULL,
        rating     TINYINT              NOT NULL,
        comment    NVARCHAR(1000)       NULL,
        status     VARCHAR(20)          NOT NULL CONSTRAINT DF_reviews_status DEFAULT 'PENDING',
        created_at DATETIME2(3)         NOT NULL CONSTRAINT DF_reviews_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_reviews PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_reviews_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE CASCADE,
        CONSTRAINT FK_reviews_seller FOREIGN KEY (seller_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT FK_reviews_buyer FOREIGN KEY (buyer_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT CK_reviews_rating CHECK (rating BETWEEN 1 AND 5),
        CONSTRAINT CK_reviews_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
    );

    CREATE NONCLUSTERED INDEX idx_reviews_seller ON dbo.reviews (seller_id);
    CREATE NONCLUSTERED INDEX idx_reviews_status ON dbo.reviews (status);

    PRINT 'Created table dbo.reviews.';
END
GO

-- ============================================================================
-- 12. TABLE: dbo.wishlist
-- Member 3 — Saved properties per buyer
-- ============================================================================
IF OBJECT_ID(N'dbo.wishlist', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.wishlist (
        id         BIGINT IDENTITY(1,1) NOT NULL,
        user_id    BIGINT               NOT NULL,
        land_id    BIGINT               NOT NULL,
        created_at DATETIME2(3)         NOT NULL CONSTRAINT DF_wishlist_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_wishlist PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_wishlist UNIQUE NONCLUSTERED (user_id, land_id),
        CONSTRAINT FK_wishlist_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE,
        CONSTRAINT FK_wishlist_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE NO ACTION
    );

    PRINT 'Created table dbo.wishlist.';
END
GO

-- ============================================================================
-- 13. TABLE: dbo.recently_viewed
-- Member 3 — Browsing history for registered buyers
-- ============================================================================
IF OBJECT_ID(N'dbo.recently_viewed', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.recently_viewed (
        id        BIGINT IDENTITY(1,1) NOT NULL,
        user_id   BIGINT               NOT NULL,
        land_id   BIGINT               NOT NULL,
        viewed_at DATETIME2(3)         NOT NULL CONSTRAINT DF_recently_viewed_viewed_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_recently_viewed PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_recently_viewed UNIQUE NONCLUSTERED (user_id, land_id),
        CONSTRAINT FK_recent_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE,
        CONSTRAINT FK_recent_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE NO ACTION
    );

    PRINT 'Created table dbo.recently_viewed.';
END
GO

-- ============================================================================
-- 14. TABLE: dbo.messages
-- Member 3/6 — Buyer <-> Seller secure messaging
-- Includes Edit / Soft-Delete features: edited, edited_at, deleted, deleted_at
-- ============================================================================
IF OBJECT_ID(N'dbo.messages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.messages (
        id           BIGINT IDENTITY(1,1) NOT NULL,
        conversation NVARCHAR(60)         NOT NULL, -- Format: landId:minUserId:maxUserId
        land_id      BIGINT               NULL,
        sender_id    BIGINT               NOT NULL,
        receiver_id  BIGINT               NOT NULL,
        body         NVARCHAR(1500)       NOT NULL,
        is_read      BIT                  NOT NULL CONSTRAINT DF_messages_is_read DEFAULT 0,
        edited       BIT                  NOT NULL CONSTRAINT DF_messages_edited DEFAULT 0,
        edited_at    DATETIME2(3)         NULL,
        deleted      BIT                  NOT NULL CONSTRAINT DF_messages_deleted DEFAULT 0,
        deleted_at   DATETIME2(3)         NULL,
        created_at   DATETIME2(3)         NOT NULL CONSTRAINT DF_messages_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_messages PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_messages_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE SET NULL,
        CONSTRAINT FK_messages_sender FOREIGN KEY (sender_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT FK_messages_receiver FOREIGN KEY (receiver_id) REFERENCES dbo.users (id) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX idx_messages_conv ON dbo.messages (conversation);
    CREATE NONCLUSTERED INDEX idx_messages_receiver ON dbo.messages (receiver_id, is_read);

    PRINT 'Created table dbo.messages.';
END
GO

-- ============================================================================
-- 15. TABLE: dbo.notifications
-- In-app notifications for users
-- ============================================================================
IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.notifications (
        id         BIGINT IDENTITY(1,1) NOT NULL,
        user_id    BIGINT               NOT NULL,
        type       NVARCHAR(40)         NOT NULL,
        title      NVARCHAR(120)        NOT NULL,
        body       NVARCHAR(400)        NULL,
        link       NVARCHAR(160)        NULL,
        is_read    BIT                  NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
        created_at DATETIME2(3)         NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_notifications PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX idx_notif_user ON dbo.notifications (user_id, is_read);

    PRINT 'Created table dbo.notifications.';
END
GO

-- ============================================================================
-- 16. TABLE: dbo.inquiries (CRITICAL CUSTOMER SUPPORT TABLE)
-- Customer Service / Support Inquiries workflow
-- ============================================================================
IF OBJECT_ID(N'dbo.inquiries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inquiries (
        id                BIGINT IDENTITY(1,1) NOT NULL,
        customer_id       BIGINT               NOT NULL,
        land_id           BIGINT               NULL,
        subject           NVARCHAR(200)        NOT NULL,
        message           NVARCHAR(MAX)        NOT NULL,
        category          VARCHAR(30)          NOT NULL CONSTRAINT DF_inquiries_category DEFAULT 'GENERAL',
        status            VARCHAR(30)          NOT NULL CONSTRAINT DF_inquiries_status DEFAULT 'OPEN',
        assigned_staff_id BIGINT               NULL,
        created_at        DATETIME2(3)         NOT NULL CONSTRAINT DF_inquiries_created_at DEFAULT SYSDATETIME(),
        updated_at        DATETIME2(3)         NOT NULL CONSTRAINT DF_inquiries_updated_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_inquiries PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_inquiries_customer FOREIGN KEY (customer_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT FK_inquiries_land FOREIGN KEY (land_id) REFERENCES dbo.lands (id) ON DELETE SET NULL,
        CONSTRAINT FK_inquiries_staff FOREIGN KEY (assigned_staff_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT CK_inquiries_category CHECK (category IN (
            'GENERAL', 'LAND_INQUIRY', 'RESERVATION', 'PAYMENT', 'COMPLAINT', 'OTHER'
        )),
        CONSTRAINT CK_inquiries_status CHECK (status IN (
            'OPEN', 'PENDING_CLARIFICATION', 'RESOLVED'
        ))
    );

    CREATE NONCLUSTERED INDEX idx_inquiries_customer ON dbo.inquiries (customer_id);
    CREATE NONCLUSTERED INDEX idx_inquiries_status ON dbo.inquiries (status);
    CREATE NONCLUSTERED INDEX idx_inquiries_staff ON dbo.inquiries (assigned_staff_id);

    PRINT 'Created table dbo.inquiries.';
END
GO

-- ============================================================================
-- 17. TABLE: dbo.inquiry_responses (CRITICAL SUPPORT RESPONSES TABLE)
-- Multi-party clarification & response thread for customer inquiries
-- ============================================================================
IF OBJECT_ID(N'dbo.inquiry_responses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inquiry_responses (
        id           BIGINT IDENTITY(1,1) NOT NULL,
        inquiry_id   BIGINT               NOT NULL,
        sender_id    BIGINT               NOT NULL,
        message      NVARCHAR(MAX)        NOT NULL,
        message_type VARCHAR(30)          NOT NULL CONSTRAINT DF_inquiry_responses_type DEFAULT 'RESPONSE',
        created_at   DATETIME2(3)         NOT NULL CONSTRAINT DF_inquiry_responses_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_inquiry_responses PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_inquiry_responses_inquiry FOREIGN KEY (inquiry_id) REFERENCES dbo.inquiries (id) ON DELETE CASCADE,
        CONSTRAINT FK_inquiry_responses_sender FOREIGN KEY (sender_id) REFERENCES dbo.users (id) ON DELETE NO ACTION,
        CONSTRAINT CK_inquiry_responses_type CHECK (message_type IN (
            'RESPONSE', 'CLARIFICATION_REQUEST', 'CLARIFICATION_REPLY'
        ))
    );

    CREATE NONCLUSTERED INDEX idx_inqresp_inquiry ON dbo.inquiry_responses (inquiry_id);

    PRINT 'Created table dbo.inquiry_responses.';
END
GO

-- ============================================================================
-- 18. TABLE: dbo.reports
-- Member 6 — Admin generated & persisted reporting snapshots
-- ============================================================================
IF OBJECT_ID(N'dbo.reports', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.reports (
        id           BIGINT IDENTITY(1,1) NOT NULL,
        report_type  NVARCHAR(40)         NOT NULL,
        generated_by BIGINT               NULL,
        params       NVARCHAR(MAX)        NULL, -- JSON serialized query parameters
        payload      NVARCHAR(MAX)        NULL, -- JSON serialized report payload
        created_at   DATETIME2(3)         NOT NULL CONSTRAINT DF_reports_created_at DEFAULT SYSDATETIME(),

        CONSTRAINT PK_reports PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_reports_user FOREIGN KEY (generated_by) REFERENCES dbo.users (id) ON DELETE SET NULL,
        CONSTRAINT CK_reports_params_json CHECK (params IS NULL OR ISJSON(params) = 1),
        CONSTRAINT CK_reports_payload_json CHECK (payload IS NULL OR ISJSON(payload) = 1)
    );

    CREATE NONCLUSTERED INDEX idx_reports_type ON dbo.reports (report_type);

    PRINT 'Created table dbo.reports.';
END
GO

-- ============================================================================
-- FULL-TEXT SEARCH CONFIGURATION (If Full-Text Service is installed)
-- Index on lands(title, description)
-- Dynamic SQL is used so script parses cleanly even on editions without Full-Text
-- ============================================================================
IF SERVERPROPERTY('IsFullTextInstalled') = 1
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = N'ft_landhub_catalog')
    BEGIN
        PRINT 'Creating Full-Text Catalog [ft_landhub_catalog]...';
        EXEC sp_executesql N'CREATE FULLTEXT CATALOG ft_landhub_catalog AS DEFAULT;';
    END;

    IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID(N'dbo.lands'))
    BEGIN
        PRINT 'Creating Full-Text Index on dbo.lands (title, description)...';
        EXEC sp_executesql N'CREATE FULLTEXT INDEX ON dbo.lands (title LANGUAGE 1033, description LANGUAGE 1033) KEY INDEX PK_lands ON ft_landhub_catalog WITH CHANGE_TRACKING AUTO;';
    END;
END
ELSE
BEGIN
    PRINT 'Full-Text Search service is not installed on this SQL Server instance. Skipping catalog creation.';
END
GO

-- ============================================================================
-- REPORTING VIEWS
-- 1. v_district_stats
-- 2. v_seller_performance
-- 3. v_monthly_revenue
-- ============================================================================

-- View 1: v_district_stats
CREATE OR ALTER VIEW dbo.v_district_stats
AS
SELECT
    district,
    province,
    COUNT(*) AS listings,
    ROUND(AVG(CAST(price_per_perch AS FLOAT)), 0) AS avg_price_per_perch,
    ROUND(AVG(CAST(perches AS FLOAT)), 2) AS avg_perches
FROM dbo.lands
WHERE status IN ('ACTIVE', 'RESERVED')
GROUP BY district, province;
GO

PRINT 'Created/Updated View dbo.v_district_stats.';
GO

-- View 2: v_seller_performance (Avoids duplicate counts from multi-table joins)
CREATE OR ALTER VIEW dbo.v_seller_performance
AS
SELECT
    u.id AS seller_id,
    u.full_name,
    s.company_name,
    ISNULL(l_stats.total_listings, 0) AS total_listings,
    ISNULL(l_stats.total_views, 0) AS total_views,
    ISNULL(b_stats.total_reservations, 0) AS total_reservations,
    s.rating_avg,
    s.rating_count
FROM dbo.users u
JOIN dbo.sellers s ON s.user_id = u.id
LEFT JOIN (
    SELECT seller_id, COUNT(*) AS total_listings, SUM(views) AS total_views
    FROM dbo.lands
    GROUP BY seller_id
) l_stats ON l_stats.seller_id = u.id
LEFT JOIN (
    SELECT seller_id, COUNT(*) AS total_reservations
    FROM dbo.bookings
    GROUP BY seller_id
) b_stats ON b_stats.seller_id = u.id;
GO

PRINT 'Created/Updated View dbo.v_seller_performance.';
GO

-- View 3: v_monthly_revenue
CREATE OR ALTER VIEW dbo.v_monthly_revenue
AS
SELECT
    CONVERT(VARCHAR(7), created_at, 120) AS [month],
    COUNT(*) AS transactions,
    SUM(amount) AS revenue_lkr
FROM dbo.payments
WHERE status = 'SUCCESSFUL'
GROUP BY CONVERT(VARCHAR(7), created_at, 120);
GO

PRINT 'Created/Updated View dbo.v_monthly_revenue.';
GO

-- ============================================================================
-- TRIGGERS
-- Multi-row, set-based triggers for Land price-per-perch & updated_at management
-- ============================================================================

-- Trigger 1: Lands Price Per Perch on Insert
CREATE OR ALTER TRIGGER dbo.trg_lands_ppp_ins
ON dbo.lands
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE l
    SET l.price_per_perch = ROUND(i.price / i.perches, 0)
    FROM dbo.lands l
    INNER JOIN inserted i ON l.id = i.id
    WHERE i.perches > 0
      AND (l.price_per_perch IS NULL OR l.price_per_perch = 0 OR l.price_per_perch <> ROUND(i.price / i.perches, 0));
END;
GO

-- Trigger 2: Lands Price Per Perch & updated_at on Update
CREATE OR ALTER TRIGGER dbo.trg_lands_ppp_upd
ON dbo.lands
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(price) OR UPDATE(perches)
    BEGIN
        UPDATE l
        SET l.price_per_perch = ROUND(i.price / i.perches, 0),
            l.updated_at = SYSDATETIME()
        FROM dbo.lands l
        INNER JOIN inserted i ON l.id = i.id
        WHERE i.perches > 0;
    END
    ELSE IF NOT UPDATE(updated_at)
    BEGIN
        UPDATE l
        SET l.updated_at = SYSDATETIME()
        FROM dbo.lands l
        INNER JOIN inserted i ON l.id = i.id;
    END
END;
GO

-- Trigger 3: Users updated_at
CREATE OR ALTER TRIGGER dbo.trg_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
    BEGIN
        UPDATE u
        SET u.updated_at = SYSDATETIME()
        FROM dbo.users u
        INNER JOIN inserted i ON u.id = i.id;
    END
END;
GO

-- Trigger 4: Bookings updated_at
CREATE OR ALTER TRIGGER dbo.trg_bookings_updated_at
ON dbo.bookings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
    BEGIN
        UPDATE b
        SET b.updated_at = SYSDATETIME()
        FROM dbo.bookings b
        INNER JOIN inserted i ON b.id = i.id;
    END
END;
GO

-- Trigger 5: Inquiries updated_at
CREATE OR ALTER TRIGGER dbo.trg_inquiries_updated_at
ON dbo.inquiries
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(updated_at)
    BEGIN
        UPDATE inq
        SET inq.updated_at = SYSDATETIME()
        FROM dbo.inquiries inq
        INNER JOIN inserted i ON inq.id = i.id;
    END
END;
GO

PRINT 'All triggers created/updated successfully.';
GO

-- ============================================================================
-- SEED DATA (Idempotent: Inserts only if database is unseeded)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.users)
BEGIN
    PRINT 'Seeding initial demo data for LandHub Sri Lanka...';

    -- Default BCrypt hash for password 'Landhub@2026'
    DECLARE @DefaultHash VARCHAR(72) = '$2b$10$nHqeqrYu9nIwhggZo5OYT..bEIcKwfxelpMYjJh3yOAh11nefHMe2';

    -- 1. Insert Users
    SET IDENTITY_INSERT dbo.users ON;
    INSERT INTO dbo.users (id, full_name, email, phone, password_hash, role, language, status)
    VALUES
        (1, N'Admin Nimal Perera',   N'admin@landhub.lk',    N'+94 11 234 5678', @DefaultHash, 'ADMIN',   'en', 'ACTIVE'),
        (2, N'Sunil Rajapaksha',     N'sunil@landhub.lk',    N'+94 77 123 4567', @DefaultHash, 'SELLER',  'en', 'ACTIVE'),
        (3, N'Kumari Wijesinghe',    N'kumari@landhub.lk',   N'+94 71 987 6543', @DefaultHash, 'SELLER',  'en', 'ACTIVE'),
        (4, N'Mohamed Rizwan',       N'rizwan@landhub.lk',   N'+94 76 445 2211', @DefaultHash, 'SELLER',  'en', 'ACTIVE'),
        (5, N'Thavaraj Sivakumar',   N'thavaraj@landhub.lk', N'+94 75 662 8890', @DefaultHash, 'SELLER',  'en', 'ACTIVE'),
        (6, N'Dilani Fernando',      N'dilani@landhub.lk',   N'+94 70 334 1122', @DefaultHash, 'BUYER',   'en', 'ACTIVE'),
        (7, N'Chathura Bandara',     N'chathura@landhub.lk', N'+94 72 556 7788', @DefaultHash, 'BUYER',   'en', 'ACTIVE'),
        (8, N'Ayesha Jayasuriya',    N'ayesha@landhub.lk',   N'+94 78 221 3344', @DefaultHash, 'AGENT',   'en', 'ACTIVE'),
        (9, N'Nimasha Ratnayake',    N'support@landhub.lk',  N'+94 74 889 1100', @DefaultHash, 'SUPPORT', 'en', 'ACTIVE');
    SET IDENTITY_INSERT dbo.users OFF;

    -- 2. Insert Buyers
    INSERT INTO dbo.buyers (user_id, preferred_district, budget_max)
    VALUES
        (6, N'Colombo', 15000000.00),
        (7, N'Colombo', 15000000.00);

    -- 3. Insert Sellers
    INSERT INTO dbo.sellers (user_id, company_name, verified, rating_avg, rating_count)
    VALUES
        (2, N'Sunil Lands & Properties', 1, 5.00, 1),
        (3, N'Kumari Lands & Properties', 1, 0.00, 0),
        (4, N'Mohamed Lands & Properties', 1, 0.00, 0),
        (5, N'Thavaraj Lands & Properties', 1, 0.00, 0);

    -- 4. Insert Agents
    INSERT INTO dbo.agents (user_id, agency_name, licence_no, service_districts, commission_pct)
    VALUES
        (8, N'Ceylon Prime Realty', N'AG-2419', N'Colombo,Gampaha,Kalutara', 2.50);

    -- 5. Insert Locations (Provinces & Districts with Sinhala & Tamil names)
    SET IDENTITY_INSERT dbo.locations ON;
    -- Provinces
    INSERT INTO dbo.locations (id, name, name_si, name_ta, level, parent_id, lat, lng) VALUES
        (1, N'Western Province',       N'බස්නාහිර පළාත',   N'மேல் மாகாணம்',          'PROVINCE', NULL, 6.9271, 79.8612),
        (2, N'Central Province',       N'මධ්‍යම පළාත',     N'மத்திய மாகாணம்',        'PROVINCE', NULL, 7.2906, 80.6337),
        (3, N'Southern Province',      N'දකුණු පළාත',      N'தென் மாகாணம்',           'PROVINCE', NULL, 6.0535, 80.2210),
        (4, N'Northern Province',      N'උතුරු පළාත',      N'வட மாகாணம்',            'PROVINCE', NULL, 9.6615, 80.0255),
        (5, N'Eastern Province',       N'නැගෙනහිර පළාත',  N'கிழக்கு மாகாணம்',       'PROVINCE', NULL, 7.7170, 81.7000),
        (6, N'North Western Province', N'වයඹ පළාත',        N'வட மேல் மாகாணம்',      'PROVINCE', NULL, 7.4863, 80.3623),
        (7, N'North Central Province', N'උතුරු මැද පළාත', N'வட மத்திய மாகாணம்',     'PROVINCE', NULL, 8.3114, 80.4037),
        (8, N'Uva Province',           N'ඌව පළාත',         N'ஊவா மாகாணம்',           'PROVINCE', NULL, 6.9934, 81.0550),
        (9, N'Sabaragamuwa Province',  N'සබරගමුව පළාත',   N'சபரகமுவ மாகாணம்',       'PROVINCE', NULL, 6.6828, 80.3992);

    -- Districts
    INSERT INTO dbo.locations (id, name, name_si, name_ta, level, parent_id, lat, lng) VALUES
        (10, N'Colombo',      N'කොළඹ',        N'கொழும்பு',       'DISTRICT', 1, 6.9271, 79.8612),
        (11, N'Gampaha',      N'ගම්පහ',       N'கம்பஹா',         'DISTRICT', 1, 7.0873, 79.9990),
        (12, N'Kalutara',     N'කළුතර',       N'களுத்துறை',      'DISTRICT', 1, 6.5854, 79.9607),
        (13, N'Kandy',        N'මහනුවර',      N'கண்டி',          'DISTRICT', 2, 7.2906, 80.6337),
        (14, N'Matale',       N'මාතලේ',       N'மாத்தளை',        'DISTRICT', 2, 7.4675, 80.6234),
        (15, N'Nuwara Eliya', N'නුවරඑළිය',    N'நுவரெலியா',      'DISTRICT', 2, 6.9497, 80.7891),
        (16, N'Galle',        N'ගාල්ල',       N'காலி',           'DISTRICT', 3, 6.0535, 80.2210),
        (17, N'Matara',       N'මාතර',        N'மாத்தறை',        'DISTRICT', 3, 5.9549, 80.5550),
        (18, N'Hambantota',   N'හම්බන්තොට',   N'அம்பாந்தோட்டை',  'DISTRICT', 3, 6.1241, 81.1185),
        (19, N'Jaffna',       N'යාපනය',       N'யாழ்ப்பாணம்',     'DISTRICT', 4, 9.6615, 80.0255),
        (20, N'Kilinochchi',  N'කිලිනොච්චිය', N'கிளிநொச்சி',     'DISTRICT', 4, 9.3803, 80.3770),
        (21, N'Mannar',       N'මන්නාරම',     N'மன்னார்',         'DISTRICT', 4, 8.9810, 79.9044),
        (22, N'Vavuniya',     N'වවුනියාව',    N'வவுனியா',         'DISTRICT', 4, 8.7514, 80.4971),
        (23, N'Mullaitivu',   N'මුලතිව්',     N'முல்லைத்தீவு',   'DISTRICT', 4, 9.2671, 80.8142),
        (24, N'Batticaloa',   N'මඩකලපුව',     N'மட்டக்களப்பு',     'DISTRICT', 5, 7.7170, 81.7000),
        (25, N'Ampara',       N'අම්පාර',       N'அம்பாறை',         'DISTRICT', 5, 7.2917, 81.6747),
        (26, N'Trincomalee',  N'ත්‍රිකුණාමලය', N'திருகோணமலை',     'DISTRICT', 5, 8.5874, 81.2152),
        (27, N'Kurunegala',   N'කුරුණෑගල',    N'குருணாகல்',       'DISTRICT', 6, 7.4863, 80.3623),
        (28, N'Puttalam',     N'පුත්තලම',     N'புத்தளம்',        'DISTRICT', 6, 8.0362, 79.8283),
        (29, N'Anuradhapura', N'අනුරාධපුර',   N'அனுராதபுரம்',     'DISTRICT', 7, 8.3114, 80.4037),
        (30, N'Polonnaruwa',  N'පොළොන්නරුව',  N'பொலநறுவை',        'DISTRICT', 7, 7.9403, 81.0188),
        (31, N'Badulla',      N'බදුල්ල',       N'பதுளை',           'DISTRICT', 8, 6.9934, 81.0550),
        (32, N'Monaragala',   N'මොණරාගල',     N'மொணராகலை',        'DISTRICT', 8, 6.8728, 81.3509),
        (33, N'Ratnapura',    N'රත්නපුර',     N'இரத்தினபுரி',     'DISTRICT', 9, 6.6828, 80.3992),
        (34, N'Kegalle',      N'කෑගල්ල',      N'கேகாலை',          'DISTRICT', 9, 7.2513, 80.3464);
    SET IDENTITY_INSERT dbo.locations OFF;

    -- 6. Insert Lands (16 authentic listings matching application specifications)
    SET IDENTITY_INSERT dbo.lands ON;
    INSERT INTO dbo.lands
        (id, seller_id, title, description, land_type, province, district, city, area, address,
         perches, price, price_per_perch, negotiable, lat, lng,
         electricity, water, main_road, internet, telephone, drainage, clear_deed, survey_plan,
         near_school, near_hospital, near_highway, near_railway, nearest_highway, nearby,
         status, verification, views, created_at)
    VALUES
        (1, 2, N'20 Perch Residential Land for Sale in Piliyandala',
         N'A flat, rectangular 20 perch residential block just 1.2 km from Piliyandala town centre. The land has 20 ft motorable road frontage, three-phase electricity at the boundary, and NWSDB water. Clear single-owner deed with an up-to-date survey plan. Ideal for a two-storey family home; walking distance to schools and the Piliyandala bus stand.',
         'Residential', N'Western Province', N'Colombo', N'Piliyandala', N'Kesbewa Road', N'Kesbewa Road, Piliyandala, Colombo',
         20.00, 9500000.00, 475000.00, 1, 6.798100, 79.923400,
         1, 1, 1, 1, 1, 1, 1, 1,
         1, 1, 1, 0, N'Southern Expressway (E01)', N'["School","Hospital","Bank","Supermarket","Bus Stand"]',
         'ACTIVE', 'VERIFIED', 450, DATEADD(month, -7, SYSDATETIME())),

        (2, 3, N'15 Perch Land with Clear Deed in Kadawatha',
         N'Beautiful 15 perch block in a quiet residential lane off Ganemulla Road, Kadawatha. Only 900 m to the Kadawatha interchange of the Central Expressway, making Colombo a 25 minute drive. Electricity and water lines are already at the gate. Perfect for a family home or a rental investment.',
         'Residential', N'Western Province', N'Gampaha', N'Kadawatha', N'Ganemulla Road', N'Ganemulla Road, Kadawatha, Gampaha',
         15.00, 7250000.00, 483333.00, 1, 7.001200, 79.951200,
         1, 1, 1, 1, 0, 1, 1, 1,
         1, 0, 1, 0, N'Central Expressway (E04)', N'["School","Supermarket","Expressway Interchange","Bank"]',
         'ACTIVE', 'VERIFIED', 320, DATEADD(month, -6, SYSDATETIME())),

        (3, 4, N'30 Perch Land with Hill View in Kandy',
         N'Elevated 30 perch land in Hantana with a panoramic view over the Kandy valley and the Temple of the Tooth. Terraced and ready to build, with mature fruit trees along the boundary. 3.5 km to Kandy city and close to the University of Peradeniya. Cool climate throughout the year.',
         'Residential', N'Central Province', N'Kandy', N'Kandy', N'Hantana', N'Hantana, Kandy, Kandy',
         30.00, 12500000.00, 416667.00, 0, 7.275000, 80.628000,
         1, 1, 1, 0, 1, 0, 1, 1,
         1, 1, 0, 1, NULL, N'["University","Hospital","Railway Station","Temple","Bank"]',
         'ACTIVE', 'VERIFIED', 510, DATEADD(month, -5, SYSDATETIME())),

        (4, 5, N'25 Perch Land Close to Galle Fort',
         N'A 25 perch block in Dangedara, only 2.5 km from the historic Galle Fort and Galle town. Level land with a 15 ft access road, suitable for a residence or boutique guest house. Karapitiya Teaching Hospital is 3 km away and the Southern Expressway Pinnaduwa interchange is a 7 minute drive.',
         'Residential', N'Southern Province', N'Galle', N'Galle', N'Dangedara', N'Dangedara, Galle, Galle',
         25.00, 8750000.00, 350000.00, 1, 6.042000, 80.231000,
         1, 1, 1, 1, 0, 0, 1, 1,
         0, 1, 1, 1, N'Southern Expressway (E01)', N'["Hospital","Railway Station","Bank","Supermarket","Expressway Interchange"]',
         'ACTIVE', 'VERIFIED', 620, DATEADD(month, -4, SYSDATETIME())),

        (5, 2, N'Beachfront Bare Land 40 Perches in Hikkaduwa',
         N'Rare 40 perch beachfront property at Narigama, Hikkaduwa, with approximately 60 ft of direct sandy beach frontage. Galle Road access at the rear. Excellent for a boutique hotel or villa development subject to Coast Conservation Department approval. Surf points and restaurants within walking distance.',
         'Beach', N'Southern Province', N'Galle', N'Hikkaduwa', N'Narigama', N'Narigama, Hikkaduwa, Galle',
         40.00, 34000000.00, 850000.00, 0, 6.134000, 80.108000,
         1, 1, 1, 1, 1, 0, 1, 1,
         0, 0, 0, 1, N'Southern Expressway (E01)', N'["Railway Station","Bank","Supermarket","Police Station"]',
         'ACTIVE', 'VERIFIED', 880, DATEADD(month, -3, SYSDATETIME())),

        (6, 3, N'2 Acre Tea Land in Nuwara Eliya',
         N'Two acres (320 perches) of mature, well-maintained VP tea in Lindula, Talawakele. Average monthly green leaf yield of 1,800 kg with an established buyer at the nearby factory. Includes a small worker line room and a natural water stream running along the boundary. Cool up-country climate at 1,400 m elevation.',
         'Tea', N'Central Province', N'Nuwara Eliya', N'Talawakele', N'Lindula', N'Lindula, Talawakele, Nuwara Eliya',
         320.00, 28000000.00, 87500.00, 1, 6.915000, 80.655000,
         1, 1, 1, 0, 0, 0, 1, 1,
         0, 0, 0, 1, NULL, N'["Railway Station","Bank","School"]',
         'ACTIVE', 'PENDING', 290, DATEADD(month, -2, SYSDATETIME())),

        (7, 4, N'1 Acre Coconut Land in Kurunegala',
         N'One acre coconut land with 68 bearing palms averaging 55 nuts per palm per year. Located 6 km from Wariyapola town on a gravel road maintained by the Pradeshiya Sabha. Agro-well on the property, three-phase electricity at the road. Suitable for intercropping with banana or pepper.',
         'Coconut', N'North Western Province', N'Kurunegala', N'Wariyapola', N'Sirambiyadiya', N'Sirambiyadiya, Wariyapola, Kurunegala',
         160.00, 11200000.00, 70000.00, 1, 7.621000, 80.224000,
         1, 1, 0, 0, 0, 0, 1, 1,
         0, 0, 0, 0, NULL, N'["School","Bank","Bus Stand"]',
         'ACTIVE', 'VERIFIED', 340, DATEADD(month, -1, SYSDATETIME())),

        (8, 5, N'Commercial Land 18 Perches on Main Road, Malabe',
         N'Prime 18 perch commercial land with 45 ft frontage directly on Kaduwela Road, Malabe — the fastest growing IT and education corridor in Colombo District. Surrounded by universities, banks and supermarkets. Approved for commercial use by the Kaduwela Municipal Council. Excellent for a showroom, office or mixed development.',
         'Commercial', N'Western Province', N'Colombo', N'Malabe', N'Kaduwela Road', N'Kaduwela Road, Malabe, Colombo',
         18.00, 25200000.00, 1400000.00, 0, 6.904000, 79.955000,
         1, 1, 1, 1, 1, 1, 1, 1,
         1, 1, 1, 0, N'Outer Circular Expressway (E02)', N'["University","Bank","Supermarket","Hospital","Expressway Interchange"]',
         'ACTIVE', 'VERIFIED', 750, DATEADD(month, -1, SYSDATETIME())),

        (9, 2, N'3 Acre Paddy Land in Anuradhapura',
         N'Three acres of fertile paddy land under the Rajangana irrigation scheme, cultivated in both Yala and Maha seasons. Reliable canal water, tractor access from the Eppawala Road, and a recorded harvest of about 110 bushels per acre. Clear deed with government permit converted to freehold.',
         'Paddy', N'North Central Province', N'Anuradhapura', N'Thambuttegama', N'Eppawala Road', N'Eppawala Road, Thambuttegama, Anuradhapura',
         480.00, 9600000.00, 20000.00, 1, 8.142000, 80.298000,
         0, 1, 0, 0, 0, 0, 1, 1,
         0, 0, 0, 0, NULL, N'["Bus Stand","School"]',
         'PENDING', 'PENDING', 110, DATEADD(day, -20, SYSDATETIME())),

        (10, 3, N'12.5 Perch Land in Maharagama Town',
         N'Compact 12.5 perch block in Pamunuwa, Maharagama, just 700 m from the High Level Road and Maharagama town. A quiet, fully developed residential neighbourhood with concrete road access and street lighting. Ideal for a modern three-bedroom home. Schools, the Apeksha Hospital and supermarkets are all within 2 km.',
         'Residential', N'Western Province', N'Colombo', N'Maharagama', N'Pamunuwa', N'Pamunuwa, Maharagama, Colombo',
         12.50, 8125000.00, 650000.00, 0, 6.848000, 79.927000,
         1, 1, 1, 1, 1, 1, 1, 1,
         1, 1, 1, 0, N'Southern Expressway (E01)', N'["School","Hospital","Supermarket","Bank","Bus Stand"]',
         'ACTIVE', 'VERIFIED', 490, DATEADD(day, -15, SYSDATETIME())),

        (11, 4, N'2 Acre Rubber Land in Ratnapura',
         N'Two acres of mature rubber in tapping, with approximately 340 trees planted in 2009. Includes a small smoke house and rolling equipment. Located on the Pelmadulla–Kahawatta road with lorry access right up to the property. Good long term plantation investment with gem-bearing gravel reported in the area.',
         'Rubber', N'Sabaragamuwa Province', N'Ratnapura', N'Pelmadulla', N'Kahawatta Road', N'Kahawatta Road, Pelmadulla, Ratnapura',
         320.00, 14400000.00, 45000.00, 1, 6.621000, 80.551000,
         1, 0, 1, 0, 0, 0, 1, 1,
         0, 0, 0, 0, NULL, N'["Bank","School","Bus Stand"]',
         'ACTIVE', 'PENDING', 210, DATEADD(day, -12, SYSDATETIME())),

        (12, 5, N'22 Perch Residential Land in Negombo',
         N'A 22 perch block in Kochchikade, Negombo, 1.8 km from the beach and 12 minutes from Bandaranaike International Airport via the Colombo–Katunayake Expressway. Level land with boundary wall on two sides, mains water and electricity connected. Popular area for both residents and holiday homes.',
         'Residential', N'Western Province', N'Gampaha', N'Negombo', N'Kochchikade', N'Kochchikade, Negombo, Gampaha',
         22.00, 13200000.00, 600000.00, 0, 7.251000, 79.865000,
         1, 1, 1, 1, 0, 1, 1, 1,
         1, 1, 1, 0, N'Colombo–Katunayake Expressway (E03)', N'["School","Hospital","Supermarket","Bank","Expressway Interchange"]',
         'ACTIVE', 'VERIFIED', 580, DATEADD(day, -10, SYSDATETIME())),

        (13, 2, N'16 Perch Land in Jaffna Nallur',
         N'Sixteen perch residential land in Nallur, 1.5 km from the Nallur Kandaswamy Temple and 3 km from Jaffna town. Palmyra trees along the boundary, well on the property with good quality water, and a 12 ft access road from Kandy Road. Ideal for a family home in a well established neighbourhood.',
         'Residential', N'Northern Province', N'Jaffna', N'Nallur', N'Kandy Road', N'Kandy Road, Nallur, Jaffna',
         16.00, 6400000.00, 400000.00, 1, 9.674000, 80.031000,
         1, 1, 1, 0, 0, 0, 1, 1,
         1, 1, 0, 1, NULL, N'["Temple","School","Hospital","Railway Station"]',
         'ACTIVE', 'PENDING', 390, DATEADD(day, -8, SYSDATETIME())),

        (14, 3, N'Industrial Land 1 Acre in Horana',
         N'One acre of industrial-zoned land at Poruwadanda, Horana, close to the Horana Export Processing Zone. 40 ft wide tarred road access suitable for container vehicles, three-phase power, and BOI-approved neighbouring factories. Level, filled and ready for construction of a warehouse or manufacturing facility.',
         'Industrial', N'Western Province', N'Kalutara', N'Horana', N'Poruwadanda', N'Poruwadanda, Horana, Kalutara',
         160.00, 32000000.00, 200000.00, 0, 6.715000, 80.062000,
         1, 1, 1, 1, 1, 1, 1, 1,
         0, 0, 1, 0, N'Southern Expressway (E01)', N'["Bank","Police Station","Bus Stand","Expressway Interchange"]',
         'ACTIVE', 'VERIFIED', 410, DATEADD(day, -6, SYSDATETIME())),

        (15, 4, N'35 Perch Investment Land in Trincomalee',
         N'Thirty-five perch block 400 m from Nilaveli beach, one of the finest stretches of coast in the Eastern Province. Tourism development in the area is growing quickly, making this an attractive medium-term investment. Electricity at the road, water from a private well. Pigeon Island National Park is a short boat ride away.',
         'Investment', N'Eastern Province', N'Trincomalee', N'Nilaveli', N'Nilaveli Beach Road', N'Nilaveli Beach Road, Nilaveli, Trincomalee',
         35.00, 10500000.00, 300000.00, 1, 8.689000, 81.189000,
         1, 1, 1, 0, 0, 0, 1, 1,
         0, 0, 0, 0, NULL, N'["Bank","Police Station","Bus Stand"]',
         'ACTIVE', 'PENDING', 330, DATEADD(day, -4, SYSDATETIME())),

        (16, 5, N'18 Perch Land near Ella Town',
         N'Eighteen perches with a stunning view towards Ella Rock and the Ravana valley, located at Kithalella, 2.2 km from Ella town. The Ella–Demodara railway line and the famous Nine Arches Bridge are nearby. Strong potential for a villa or a small boutique guest house, subject to tourism authority approvals.',
         'Residential', N'Uva Province', N'Badulla', N'Ella', N'Kithalella', N'Kithalella, Ella, Badulla',
         18.00, 9900000.00, 550000.00, 0, 6.865000, 81.042000,
         1, 1, 1, 1, 0, 0, 1, 1,
         0, 0, 0, 1, NULL, N'["Railway Station","Bank","Supermarket"]',
         'ACTIVE', 'VERIFIED', 560, DATEADD(day, -2, SYSDATETIME()));
    SET IDENTITY_INSERT dbo.lands OFF;

    -- 7. Insert Land Images
    INSERT INTO dbo.land_images (land_id, url, is_cover, sort_order)
    VALUES
        (1, N'/img/land1.jpg', 1, 0), (1, N'/img/land2.jpg', 0, 1), (1, N'/img/land3.jpg', 0, 2),
        (2, N'/img/land2.jpg', 1, 0), (2, N'/img/land3.jpg', 0, 1), (2, N'/img/land4.jpg', 0, 2),
        (3, N'/img/land7.jpg', 1, 0), (3, N'/img/land8.jpg', 0, 1), (3, N'/img/land1.jpg', 0, 2),
        (4, N'/img/land3.jpg', 1, 0), (4, N'/img/land4.jpg', 0, 1), (4, N'/img/land5.jpg', 0, 2),
        (5, N'/img/land3.jpg', 1, 0), (5, N'/img/land4.jpg', 0, 1), (5, N'/img/land5.jpg', 0, 2),
        (6, N'/img/land2.jpg', 1, 0), (6, N'/img/land3.jpg', 0, 1), (6, N'/img/land4.jpg', 0, 2),
        (7, N'/img/land4.jpg', 1, 0), (7, N'/img/land5.jpg', 0, 1), (7, N'/img/land6.jpg', 0, 2),
        (8, N'/img/land5.jpg', 1, 0), (8, N'/img/land6.jpg', 0, 1), (8, N'/img/land7.jpg', 0, 2),
        (9, N'/img/land6.jpg', 1, 0), (9, N'/img/land7.jpg', 0, 1), (9, N'/img/land8.jpg', 0, 2),
        (10, N'/img/land1.jpg', 1, 0), (10, N'/img/land2.jpg', 0, 1), (10, N'/img/land3.jpg', 0, 2),
        (11, N'/img/land8.jpg', 1, 0), (11, N'/img/land1.jpg', 0, 1), (11, N'/img/land2.jpg', 0, 2),
        (12, N'/img/land2.jpg', 1, 0), (12, N'/img/land3.jpg', 0, 1), (12, N'/img/land4.jpg', 0, 2),
        (13, N'/img/land1.jpg', 1, 0), (13, N'/img/land2.jpg', 0, 1), (13, N'/img/land3.jpg', 0, 2),
        (14, N'/img/land5.jpg', 1, 0), (14, N'/img/land6.jpg', 0, 1), (14, N'/img/land7.jpg', 0, 2),
        (15, N'/img/land3.jpg', 1, 0), (15, N'/img/land4.jpg', 0, 1), (15, N'/img/land5.jpg', 0, 2),
        (16, N'/img/land7.jpg', 1, 0), (16, N'/img/land8.jpg', 0, 1), (16, N'/img/land1.jpg', 0, 2);

    -- 8. Insert Land Documents
    INSERT INTO dbo.land_documents (land_id, uploaded_by, doc_type, file_name, status, reviewed_by, reviewed_at)
    VALUES
        (1, 2, 'DEED', N'deed_land_1.pdf', 'VERIFIED', 1, SYSDATETIME()),
        (1, 2, 'SURVEY_PLAN', N'survey_plan_land_1.pdf', 'VERIFIED', 1, SYSDATETIME()),
        (1, 2, 'LAND_REGISTRY', N'land_registry_land_1.pdf', 'VERIFIED', 1, SYSDATETIME()),
        (2, 3, 'DEED', N'deed_land_2.pdf', 'VERIFIED', 1, SYSDATETIME()),
        (2, 3, 'SURVEY_PLAN', N'survey_plan_land_2.pdf', 'VERIFIED', 1, SYSDATETIME()),
        (6, 3, 'DEED', N'deed_land_6.pdf', 'PENDING', NULL, NULL),
        (6, 3, 'SURVEY_PLAN', N'survey_plan_land_6.pdf', 'PENDING', NULL, NULL);

    -- 9. Insert Bookings
    SET IDENTITY_INSERT dbo.bookings ON;
    INSERT INTO dbo.bookings
        (id, land_id, buyer_id, seller_id, buyer_name, contact_no, email, preferred_date, message, status)
    VALUES
        (1, 1, 6, 2, N'Dilani Fernando', N'+94 70 334 1122', N'dilani@landhub.lk', '2026-07-12',
         N'I would like to visit the property this weekend.', 'COMPLETED'),
        (2, 2, 7, 3, N'Chathura Bandara', N'+94 72 556 7788', N'chathura@landhub.lk', '2026-08-24',
         N'Is the price negotiable for a cash purchase?', 'PENDING');
    SET IDENTITY_INSERT dbo.bookings OFF;

    -- 10. Insert Payments
    INSERT INTO dbo.payments
        (booking_id, payer_id, amount, currency, method, status, reference, invoice_no, is_sandbox)
    VALUES
        (1, 6, 500000.00, 'LKR', 'ONLINE', 'SUCCESSFUL', N'LHDEMO001', N'INV-2026-00001', 1);

    -- 11. Insert Reviews
    INSERT INTO dbo.reviews (land_id, seller_id, buyer_id, rating, comment, status)
    VALUES
        (1, 2, 6, 5, N'Very transparent seller. All documents were ready and the lawyer had no issues with the deed. Highly recommended.', 'APPROVED'),
        (NULL, 3, 7, 4, N'Good communication, but the site visit was rescheduled once.', 'PENDING');

    -- 12. Insert Wishlist
    INSERT INTO dbo.wishlist (user_id, land_id)
    VALUES
        (6, 2);

    -- 13. Insert Recently Viewed
    INSERT INTO dbo.recently_viewed (user_id, land_id)
    VALUES
        (6, 1),
        (6, 2);

    -- 14. Insert Messages (with conversation thread)
    INSERT INTO dbo.messages (conversation, land_id, sender_id, receiver_id, body, is_read, edited, deleted)
    VALUES
        (N'1:2:6', 1, 6, 2, N'Hello, is this land still available? I am interested in visiting on Saturday.', 1, 0, 0),
        (N'1:2:6', 1, 2, 6, N'Yes, it is available. Saturday 10 AM works well. I will bring the survey plan and deed copies.', 1, 0, 0);

    -- 15. Insert Notifications
    INSERT INTO dbo.notifications (user_id, type, title, body, link, is_read)
    VALUES
        (6, N'WELCOME', N'Welcome to LandHub Sri Lanka', N'Start by saving properties you like.', N'/buyer', 1);

    -- 16. Insert Inquiries (Customer Support module workflow)
    SET IDENTITY_INSERT dbo.inquiries ON;
    INSERT INTO dbo.inquiries
        (id, customer_id, land_id, subject, message, category, status, assigned_staff_id)
    VALUES
        (1, 6, 1, N'Question about deed verification process',
         N'Hello, I have reserved a property and want to understand the deed verification process. What documents do I need to prepare for the title search? Is there a recommended lawyer?',
         'LAND_INQUIRY', 'RESOLVED', 1),
        (2, 7, NULL, N'Payment not reflected in my account',
         N'I made a payment of LKR 500,000 via bank transfer three days ago for booking #1 but it still shows as pending. My bank reference is TRF-20261001-4456. Please check.',
         'PAYMENT', 'PENDING_CLARIFICATION', 1),
        (3, 6, 2, N'Is the price negotiable for cash purchase?',
         N'I am interested in this property and can pay full amount in cash. Would the seller consider a discount for an immediate cash deal? Also, are there any ongoing boundary disputes?',
         'GENERAL', 'OPEN', NULL);
    SET IDENTITY_INSERT dbo.inquiries OFF;

    -- 17. Insert Inquiry Responses (Workflow conversation thread)
    INSERT INTO dbo.inquiry_responses (inquiry_id, sender_id, message, message_type)
    VALUES
        (1, 1,
         N'Thank you for your inquiry. For a title search you will need: (1) the deed number and date, (2) the survey plan number, (3) a certified copy from the Land Registry. We recommend engaging a lawyer registered with the Bar Association of Sri Lanka. Our platform verification is an administrative check only — a lawyer''s title search is essential before completing any purchase.',
         'RESPONSE'),
        (2, 1,
         N'Thank you for reporting this. Could you please provide the exact date and time of the transfer, and a screenshot of the bank confirmation? This will help us trace the payment with our banking partner.',
         'CLARIFICATION_REQUEST');

    -- 18. Insert Reports (Initial administrative report snapshots)
    INSERT INTO dbo.reports (report_type, generated_by, params, payload)
    VALUES
        (N'SALES', 1, N'{"period":"all_time"}', N'[{"district":"Colombo","c":1,"revenue":500000.00}]'),
        (N'SUMMARY', 1, N'{}', N'{"properties":16,"users":9,"reservations":2,"payments":1,"revenue":500000.00}');

    PRINT 'Demo seed data inserted successfully.';
END
ELSE
BEGIN
    PRINT 'Seed data already present. Skipping insertion.';
END
GO

-- ============================================================================
-- VERIFICATION QUERIES (Run to verify database completeness)
-- ============================================================================
PRINT '============================================================';
PRINT 'LANDHUB SRI LANKA — DATABASE VERIFICATION REPORT';
PRINT '============================================================';

-- 1. Verify All 18 Core Tables
SELECT
    t.TABLE_SCHEMA,
    t.TABLE_NAME,
    (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME)) AS column_count,
    p.rows AS [row_count]
FROM INFORMATION_SCHEMA.TABLES t
LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME
LEFT JOIN sys.partitions p ON p.object_id = st.object_id AND p.index_id IN (0, 1)
WHERE t.TABLE_TYPE = 'BASE TABLE'
ORDER BY t.TABLE_NAME;

-- 2. Verify Reporting Views
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.VIEWS
ORDER BY TABLE_NAME;

-- 3. Verify Triggers
SELECT
    tr.name AS trigger_name,
    OBJECT_NAME(tr.parent_id) AS table_name,
    tr.is_disabled
FROM sys.triggers tr
WHERE tr.parent_class = 1
ORDER BY table_name, trigger_name;

-- 4. Verify Foreign Key Constraints
SELECT
    fk.name AS constraint_name,
    OBJECT_NAME(fk.parent_object_id) AS table_name,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS column_name,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referenced_column,
    fk.delete_referential_action_desc AS delete_action
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
ORDER BY table_name, constraint_name;

-- 5. Verify Indexes
SELECT
    OBJECT_NAME(i.object_id) AS table_name,
    i.name AS index_name,
    i.type_desc AS index_type,
    i.is_unique
FROM sys.indexes i
WHERE i.object_id IN (SELECT object_id FROM sys.tables)
  AND i.name IS NOT NULL
ORDER BY table_name, index_name;

-- 6. Verify Customer Support / Inquiry Workflow
SELECT
    i.id,
    i.subject,
    i.category,
    i.status,
    u.full_name AS customer,
    st.full_name AS assigned_staff
FROM dbo.inquiries i
JOIN dbo.users u ON i.customer_id = u.id
LEFT JOIN dbo.users st ON i.assigned_staff_id = st.id;

SELECT
    ir.id,
    ir.inquiry_id,
    u.full_name AS sender,
    u.role AS sender_role,
    ir.message_type,
    ir.message,
    ir.created_at
FROM dbo.inquiry_responses ir
JOIN dbo.users u ON ir.sender_id = u.id
ORDER BY ir.inquiry_id, ir.created_at;

-- 7. Test Reporting Views Output
SELECT * FROM dbo.v_district_stats;
SELECT * FROM dbo.v_seller_performance;
SELECT * FROM dbo.v_monthly_revenue;
GO
