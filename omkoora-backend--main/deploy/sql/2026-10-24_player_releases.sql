-- استقالة اللاعب / إخلاء الطرف.
--
-- A player could only ever leave through a transfer, which needs a receiving
-- club on the same day. Clubs worked around that, and players ended up sitting
-- in clubs they had resigned from. This table records the request, the letter
-- submitted with it, the club's decision and the dates — the history the clubs
-- asked to keep. Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS player_releases (
    id               CHAR(36)     NOT NULL,
    reason           TEXT         NULL,
    letter           VARCHAR(100) NULL,
    status           ENUM('waiting','accepted','rejected') NULL DEFAULT 'waiting',
    note             VARCHAR(255) NULL,
    requested_at     DATETIME     NULL,
    decided_at       DATETIME     NULL,
    id_requested_by  CHAR(36)     NULL,
    id_decided_by    CHAR(36)     NULL,
    id_player        CHAR(36)     NULL,
    id_team          CHAR(36)     NULL,
    id_club          CHAR(36)     NULL,
    createdAt        DATETIME     NOT NULL,
    updatedAt        DATETIME     NOT NULL,
    deletedAt        DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_player_releases_player (id_player),
    KEY idx_player_releases_club_status (id_club, status),
    KEY idx_player_releases_team (id_team)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
