-- رسوم الطلبات ومدفوعاتها.
--
-- Clubs charge for registering a player, moving one, lending one and
-- registering a team, and the amounts differ from club to club. Until now the
-- money was settled off the platform: a team sends one transfer covering
-- several requests and the club cannot tell which part paid for what.
--
-- club_fees      — the club's own price list.
-- request_payments — one payment per request: what it is for, what is due,
--                    the receipt image and the transfer's reference number.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS club_fees (
    id         CHAR(36)      NOT NULL,
    fee_type   ENUM('player_registration','transfer','loan','team_registration') NOT NULL,
    amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active     TINYINT(1)    NOT NULL DEFAULT 1,
    id_club    CHAR(36)      NULL,
    createdAt  DATETIME      NOT NULL,
    updatedAt  DATETIME      NOT NULL,
    deletedAt  DATETIME      NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_club_fee (id_club, fee_type),
    KEY idx_club_fees_club (id_club)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_payments (
    id                CHAR(36)      NOT NULL,
    fee_type          ENUM('player_registration','transfer','loan','team_registration') NOT NULL,
    amount            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    -- ما الذي يدفع عنه: نوع السجل ومعرّفه (انتقال، لاعب، فريق…)
    entity_type       VARCHAR(32)   NULL,
    entity_id         CHAR(36)      NULL,
    status            ENUM('waiting','submitted','accepted','rejected') NOT NULL DEFAULT 'waiting',
    reference_number  VARCHAR(64)   NULL,
    receipt           VARCHAR(100)  NULL,
    note              VARCHAR(255)  NULL,
    paid_at           DATETIME      NULL,
    decided_at        DATETIME      NULL,
    id_club           CHAR(36)      NULL,
    id_team           CHAR(36)      NULL,
    id_requested_by   CHAR(36)      NULL,
    id_decided_by     CHAR(36)      NULL,
    createdAt         DATETIME      NOT NULL,
    updatedAt         DATETIME      NOT NULL,
    deletedAt         DATETIME      NULL,
    PRIMARY KEY (id),
    KEY idx_request_payments_club_status (id_club, status),
    KEY idx_request_payments_team (id_team),
    KEY idx_request_payments_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
