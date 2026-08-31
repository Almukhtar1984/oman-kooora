-- حسابات الأعضاء: سجلّ دفعات مستقل لكل عضو في الفريق.
-- Charset/collation of the FK columns must match members.id / teams.id.
-- Production UUID columns are CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin
-- (utf8mb3). Adjust to utf8mb4_bin if the target DB uses utf8mb4.

CREATE TABLE IF NOT EXISTS member_payments (
  id           CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  amount       DOUBLE NOT NULL,
  note         VARCHAR(500) NULL,
  payment_date DATE NULL,
  id_member    CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  id_team      CHAR(36) CHARACTER SET utf8 COLLATE utf8_bin NULL,
  createdAt    DATETIME NOT NULL,
  updatedAt    DATETIME NOT NULL,
  deletedAt    DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_mp_member (id_member),
  KEY idx_mp_team (id_team),
  CONSTRAINT fk_mp_member FOREIGN KEY (id_member) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mp_team   FOREIGN KEY (id_team)   REFERENCES teams(id)   ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
