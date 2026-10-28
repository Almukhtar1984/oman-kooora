-- مسار الطلب وخطّ تتبّعه.
--
-- The team submits a registration, a transfer, a loan or a resignation and
-- then hears nothing: the screens show one badge, the status now, with no
-- path and no dates — "يعني الرجّال ما يدري اتخذ قرار ولا لا". The owner
-- asked for a tracking line, the way a parcel is tracked.
--
-- request_flows        — one row per request: which stage it stands at, whose
--                        turn it is, and which payment settles it.
-- request_flow_events  — the line itself: every stage the request entered,
--                        when, by whom, and the reason when it was refused.
--                        Append-only: a timeline that can be edited is not a
--                        record of anything.
--
-- The entity's own `status` column is NOT touched. Sixty client files read it
-- in a hundred and sixty-nine places; it stays, mirrored from the stage, so
-- the new path runs without breaking a single screen that exists today.
--
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS request_flows (
    id            CHAR(36) NOT NULL,
    request_type  ENUM('player_registration','transfer','loan','player_release') NOT NULL,
    -- الطلب الذي يتتبّعه هذا المسار: نوع السجل ومعرّفه.
    entity_type   VARCHAR(32) NOT NULL,
    entity_id     CHAR(36)    NOT NULL,
    stage         ENUM('draft','submitted','rejected_initial','club_processing',
                       'awaiting_payment','paid_review','approved','rejected_final','cancelled')
                  NOT NULL DEFAULT 'submitted',
    -- آخر سبب رفض — يُعرض مع المرحلة، وتاريخه كله محفوظ في الأحداث.
    reason        VARCHAR(255) NULL,
    id_payment    CHAR(36)     NULL,
    id_club       CHAR(36)     NULL,
    id_team       CHAR(36)     NULL,
    createdAt     DATETIME     NOT NULL,
    updatedAt     DATETIME     NOT NULL,
    deletedAt     DATETIME     NULL,
    PRIMARY KEY (id),
    -- طلب واحد، مسار واحد.
    UNIQUE KEY uq_request_flow_entity (entity_type, entity_id),
    KEY idx_request_flows_club_stage (id_club, stage),
    KEY idx_request_flows_team_stage (id_team, stage),
    KEY idx_request_flows_payment (id_payment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_flow_events (
    id         CHAR(36) NOT NULL,
    id_flow    CHAR(36) NOT NULL,
    stage      ENUM('draft','submitted','rejected_initial','club_processing',
                    'awaiting_payment','paid_review','approved','rejected_final','cancelled')
               NOT NULL,
    -- السبب عند الرفض، أو بيان الإجراء عند غيره.
    note       VARCHAR(255) NULL,
    actor      ENUM('team','club','system') NOT NULL DEFAULT 'system',
    id_user    CHAR(36)     NULL,
    -- بالمللي ثانية، لا بالثانية: خطوتان في الثانية نفسها — وهو ما يحدث حين
    -- يبتّ النادي ثم يسدّد الفريق فوراً — تتساويان في DATETIME العادي فيختلّ
    -- ترتيب الخط. وخطُّ تتبّعٍ مبعثر أسوأ من لا خط.
    createdAt  DATETIME(3)  NOT NULL,
    updatedAt  DATETIME(3)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_request_flow_events_flow (id_flow, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- الاستقالة نوع طلب رابع، فيلحق بأنواع الرسوم كي يُسعّر النادي إن أراد.
-- وقال المالك «الرسوم المستحقة، إن وجدت» — فوجودها قرار النادي حين يسعّر:
-- سعّرها فطالب بها المسار، وتركها فمضى الطلب إلى الاعتماد بلا سداد.
SET @fees_has_release := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_fees'
      AND COLUMN_NAME = 'fee_type' AND COLUMN_TYPE LIKE '%player_release%');
SET @sql := IF(@fees_has_release = 0,
    'ALTER TABLE club_fees MODIFY COLUMN fee_type ENUM(''player_registration'',''transfer'',''loan'',''team_registration'',''player_release'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @pay_has_release := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'request_payments'
      AND COLUMN_NAME = 'fee_type' AND COLUMN_TYPE LIKE '%player_release%');
SET @sql := IF(@pay_has_release = 0,
    'ALTER TABLE request_payments MODIFY COLUMN fee_type ENUM(''player_registration'',''transfer'',''loan'',''team_registration'',''player_release'') NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- قواعد سابقة أنشأت جدول الأحداث بدقّة ثانية.
SET @events_ms := (SELECT COALESCE(MAX(DATETIME_PRECISION), 0) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'request_flow_events'
      AND COLUMN_NAME IN ('createdAt', 'updatedAt'));
SET @sql := IF(@events_ms < 3,
    'ALTER TABLE request_flow_events MODIFY COLUMN createdAt DATETIME(3) NOT NULL, MODIFY COLUMN updatedAt DATETIME(3) NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
