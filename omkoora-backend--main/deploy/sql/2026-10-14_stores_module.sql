-- Stores module (phase 1): stores as standalone units with a dedicated
-- store-owner login (users.role = '8', already added by the stadium-owner
-- migration). Adds the stores / products / orders / order_items tables.
--
-- Additive & non-breaking. Idempotent — CREATE TABLE IF NOT EXISTS makes this
-- safe to re-run. No foreign-key constraints (same pattern as stadia.id_user):
-- the owner/store links are enforced at the application layer, and prod runs
-- with DB_SYNC off. Payment is cash-on-delivery only — no online payment.

-- 1) stores — a storefront owned by a role-8 account (id_user nullable).
CREATE TABLE IF NOT EXISTS stores (
    id         CHAR(36)     NOT NULL,
    name       VARCHAR(255) NOT NULL,
    about      VARCHAR(500) NULL,
    logo       VARCHAR(255) NULL,
    images     VARCHAR(255) NULL,
    phone      VARCHAR(30)  NULL,
    whatsapp   VARCHAR(30)  NULL,
    mohafada   VARCHAR(100) NULL,
    wiliya     VARCHAR(100) NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    id_user    CHAR(36)     NULL,
    createdAt  DATETIME     NULL,
    updatedAt  DATETIME     NULL,
    deletedAt  DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_stores_id_user (id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) products — belongs to one store. No inventory logic; quantity is a hint.
CREATE TABLE IF NOT EXISTS products (
    id            CHAR(36)     NOT NULL,
    name          VARCHAR(255) NOT NULL,
    about         VARCHAR(500) NULL,
    price         DOUBLE       NOT NULL DEFAULT 0,
    quantity      INT          NULL,
    images        VARCHAR(255) NULL,
    is_available  TINYINT(1)   NOT NULL DEFAULT 1,
    id_store      CHAR(36)     NULL,
    createdAt     DATETIME     NULL,
    updatedAt     DATETIME     NULL,
    deletedAt     DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_products_id_store (id_store)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) orders — a purchase request from the public app (cash on delivery only).
CREATE TABLE IF NOT EXISTS orders (
    id              CHAR(36)     NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(30)  NOT NULL,
    address         VARCHAR(500) NULL,
    note            VARCHAR(500) NULL,
    total           DOUBLE       NOT NULL DEFAULT 0,
    status          ENUM('waiting','accepted','rejected','delivered') NOT NULL DEFAULT 'waiting',
    payment_method  ENUM('cash_on_delivery') NOT NULL DEFAULT 'cash_on_delivery',
    payment_status  ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
    id_store        CHAR(36)     NULL,
    createdAt       DATETIME     NULL,
    updatedAt       DATETIME     NULL,
    deletedAt       DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_orders_id_store (id_store)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) order_items — one line per product (name/price snapshotted at purchase).
CREATE TABLE IF NOT EXISTS order_items (
    id            CHAR(36)     NOT NULL,
    product_name  VARCHAR(255) NOT NULL,
    price         DOUBLE       NOT NULL DEFAULT 0,
    quantity      INT          NOT NULL DEFAULT 1,
    id_order      CHAR(36)     NULL,
    id_product    CHAR(36)     NULL,
    createdAt     DATETIME     NULL,
    updatedAt     DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_order_items_id_order (id_order),
    KEY idx_order_items_id_product (id_product)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
