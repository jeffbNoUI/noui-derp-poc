-- ============================================================================
-- DERP Death & Survivor Benefits Schema — 004_death_survivor_schema.sql
-- Denver Employees Retirement Plan
-- ============================================================================
-- Tables for death processing workflow: notification, certificate tracking,
-- survivor benefit claims, death benefit installment elections, and
-- overpayment detection/recovery.
--
-- Follows the same messy-legacy naming style as 001_legacy_schema.sql:
--   - Abbreviated column names (_DT, _CD, _NM, _AMT)
--   - Mix of DATE and TIMESTAMP
--   - Nullable fields that arguably shouldn't be
--   - Overloaded status codes
--
-- Depends on: MEMBER_MASTER, BENEFIT_PAYMENT, BENEFICIARY from 001_legacy_schema.sql
-- Consumed by: connector death_queries.go, intelligence death_survivor.go
-- ============================================================================

-- ── DEATH_RECORD ─────────────────────────────────────────────────────────
-- Master record for a member's death processing. One record per member.
-- Created upon first credible notification. Tracks through to final
-- status transition and record closure.
--
-- STATUS_CD values:
--   NOTIFIED  — initial notification received, pending certificate
--   VERIFIED  — death certificate received and verified
--   PROCESSED — all benefits adjusted, survivor records created
--   CLOSED    — case fully resolved
CREATE TABLE DEATH_RECORD (
    DEATH_REC_ID    SERIAL          NOT NULL,
    MBR_ID          VARCHAR(10)     NOT NULL,
    DEATH_DT        DATE,                           -- Date of death (from certificate or reported)
    NOTIFY_DT       DATE            NOT NULL,       -- Date notification was received
    NOTIFY_SRC      VARCHAR(30),                    -- FAMILY, EMPLOYER, SSA, OBITUARY, OTHER
    NOTIFY_CONTACT  VARCHAR(80),                    -- Name of person who notified
    NOTIFY_PHONE    VARCHAR(20),                    -- Contact phone for notifier
    CERT_RECV_DT    DATE,                           -- Date death certificate received
    CERT_VERIFY_DT  DATE,                           -- Date certificate verified
    CERT_VERIFY_BY  VARCHAR(20),                    -- Staff who verified certificate
    CERT_DOC_REF    VARCHAR(50),                    -- Document reference/scan ID
    MBR_STATUS_PREV CHAR(1),                        -- Status before death (A=Active, R=Retired)
    MBR_STATUS_CURR VARCHAR(10),                    -- Current processing status
    STATUS_CD       VARCHAR(10)     NOT NULL DEFAULT 'NOTIFIED',
    SUSPEND_DT      DATE,                           -- Date benefit was suspended
    FINAL_PAY_DT    DATE,                           -- Last valid payment date
    OVERPAY_FLG     CHAR(1)         DEFAULT 'N',    -- Y/N overpayment detected
    OVERPAY_AMT     NUMERIC(12,2),                  -- Total overpayment amount
    NOTES           TEXT,
    CREATE_DT       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CREATE_USER     VARCHAR(20),
    UPDATE_DT       TIMESTAMP,
    UPDATE_USER     VARCHAR(20),

    CONSTRAINT PK_DEATH_RECORD PRIMARY KEY (DEATH_REC_ID)
    -- Note: no FK to MEMBER_MASTER (consistent with legacy pattern)
);

CREATE INDEX IDX_DEATH_MBR ON DEATH_RECORD (MBR_ID);
CREATE INDEX IDX_DEATH_STATUS ON DEATH_RECORD (STATUS_CD);
CREATE INDEX IDX_DEATH_DT ON DEATH_RECORD (DEATH_DT);

-- ── SURVIVOR_CLAIM ───────────────────────────────────────────────────────
-- Survivor benefit claims. Created when a J&S survivor or active member
-- beneficiary files for ongoing or lump-sum benefits.
--
-- CLAIM_TYPE values:
--   JS_SURVIVOR   — J&S continuation benefit (lifetime)
--   CONTRIB_REFUND — Non-vested active member contribution refund
--   SURVIVOR_ANNUITY — Vested active member survivor annuity
--
-- STATUS_CD values:
--   PENDING    — claim submitted, awaiting review
--   IN_REVIEW  — staff reviewing documentation
--   APPROVED   — claim approved, benefit being set up
--   ACTIVE     — benefit is being paid
--   DENIED     — claim denied (with reason)
--   CLOSED     — claim closed (beneficiary deceased, etc.)
CREATE TABLE SURVIVOR_CLAIM (
    CLAIM_ID        SERIAL          NOT NULL,
    DEATH_REC_ID    INTEGER         NOT NULL,       -- FK to DEATH_RECORD
    MBR_ID          VARCHAR(10)     NOT NULL,       -- Deceased member
    SURV_FIRST_NM   VARCHAR(30),
    SURV_LAST_NM    VARCHAR(40),
    SURV_DOB        DATE,
    SURV_RELATION   VARCHAR(15),                    -- SPOUSE, CHILD, ESTATE, OTHER
    SURV_SSN        VARCHAR(11),                    -- Encrypted/masked in display
    SURV_ADDR       VARCHAR(200),                   -- Full address (not normalized — legacy style)
    CLAIM_TYPE      VARCHAR(20)     NOT NULL,       -- JS_SURVIVOR, CONTRIB_REFUND, SURVIVOR_ANNUITY
    JS_PCT          NUMERIC(5,2),                   -- 100, 75, or 50 (null for non-J&S)
    MONTHLY_AMT     NUMERIC(12,2),                  -- Monthly survivor benefit amount
    LUMP_SUM_AMT    NUMERIC(12,2),                  -- Lump sum amount (for refunds)
    EFF_DT          DATE,                           -- Effective date of survivor benefit
    FIRST_PAY_DT    DATE,                           -- First payment date
    STATUS_CD       VARCHAR(10)     NOT NULL DEFAULT 'PENDING',
    APPROVED_DT     DATE,
    APPROVED_BY     VARCHAR(20),
    DENY_REASON     VARCHAR(200),
    NOTES           TEXT,
    CREATE_DT       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CREATE_USER     VARCHAR(20),

    CONSTRAINT PK_SURVIVOR_CLAIM PRIMARY KEY (CLAIM_ID)
);

CREATE INDEX IDX_SURV_MBR ON SURVIVOR_CLAIM (MBR_ID);
CREATE INDEX IDX_SURV_DEATH ON SURVIVOR_CLAIM (DEATH_REC_ID);
CREATE INDEX IDX_SURV_STATUS ON SURVIVOR_CLAIM (STATUS_CD);

-- ── DEATH_BENEFIT_ELECTION ───────────────────────────────────────────────
-- Tracks the death benefit installment election made at retirement and
-- the ongoing payment status after the member's death.
--
-- At retirement, member elects 50 or 100 installments.
-- After death, remaining installments transfer to designated beneficiary.
CREATE TABLE DEATH_BENEFIT_ELECTION (
    ELECT_ID        SERIAL          NOT NULL,
    MBR_ID          VARCHAR(10)     NOT NULL,
    LUMP_SUM_AMT    NUMERIC(10,2)   NOT NULL,       -- Original lump sum ($5,000 or reduced)
    NUM_INSTALLMENTS SMALLINT       NOT NULL,        -- 50 or 100
    INSTALLMENT_AMT NUMERIC(10,2)   NOT NULL,       -- Per-installment amount
    EFF_DT          DATE            NOT NULL,       -- Retirement effective date (when installments began)
    INSTALLMENTS_PAID SMALLINT      DEFAULT 0,      -- Number paid to date
    REMAINING_AMT   NUMERIC(10,2),                  -- Remaining balance
    BENE_FIRST_NM   VARCHAR(30),                    -- Death benefit beneficiary (may differ from J&S)
    BENE_LAST_NM    VARCHAR(40),
    BENE_RELATION   VARCHAR(15),
    TRANSFER_DT     DATE,                           -- Date remaining installments transferred to beneficiary
    STATUS_CD       VARCHAR(10)     DEFAULT 'ACTIVE', -- ACTIVE, TRANSFERRED, EXHAUSTED
    CREATE_DT       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CREATE_USER     VARCHAR(20),

    CONSTRAINT PK_DEATH_BEN_ELECT PRIMARY KEY (ELECT_ID)
);

CREATE INDEX IDX_DBE_MBR ON DEATH_BENEFIT_ELECTION (MBR_ID);
CREATE INDEX IDX_DBE_STATUS ON DEATH_BENEFIT_ELECTION (STATUS_CD);

-- ── OVERPAYMENT_RECORD ───────────────────────────────────────────────────
-- Tracks post-death overpayments detected and their recovery status.
-- One record per overpaid payment identified.
--
-- RECOVERY_STATUS values:
--   IDENTIFIED — overpayment detected, not yet pursued
--   REQUESTED  — recovery requested from estate/beneficiary
--   PARTIAL    — partial recovery received
--   RECOVERED  — full amount recovered
--   WAIVED     — recovery waived (per board decision)
--   UNCOLLECTABLE — written off as uncollectable
CREATE TABLE OVERPAYMENT_RECORD (
    OVERPAY_ID      SERIAL          NOT NULL,
    DEATH_REC_ID    INTEGER         NOT NULL,       -- FK to DEATH_RECORD
    MBR_ID          VARCHAR(10)     NOT NULL,
    PAY_DT          DATE            NOT NULL,       -- Date of the overpaid payment
    PAY_AMT         NUMERIC(12,2)   NOT NULL,       -- Amount of overpayment
    RECOVERY_STATUS VARCHAR(15)     DEFAULT 'IDENTIFIED',
    RECOVERY_AMT    NUMERIC(12,2)   DEFAULT 0,      -- Amount recovered so far
    RECOVERY_DT     DATE,                           -- Date of most recent recovery action
    RECOVERY_SRC    VARCHAR(30),                    -- ESTATE, BENEFICIARY, BANK_REVERSAL
    NOTES           TEXT,
    CREATE_DT       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CREATE_USER     VARCHAR(20),

    CONSTRAINT PK_OVERPAYMENT PRIMARY KEY (OVERPAY_ID)
);

CREATE INDEX IDX_OVERPAY_MBR ON OVERPAYMENT_RECORD (MBR_ID);
CREATE INDEX IDX_OVERPAY_DEATH ON OVERPAYMENT_RECORD (DEATH_REC_ID);
CREATE INDEX IDX_OVERPAY_STATUS ON OVERPAYMENT_RECORD (RECOVERY_STATUS);
