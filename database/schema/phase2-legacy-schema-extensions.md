# Phase 2 Legacy Schema Extensions

## Purpose

Extends 001_legacy_schema.sql with tables that represent DERP's legacy handling of contribution refunds and death/survivor benefits. These tables follow the same legacy realism patterns: inconsistent naming, missing constraints, denormalized data, and organic growth over decades.

The Data Connector abstracts these into clean domain entities (see phase2_domain_entity_extensions.md).

## When to Apply

After the POC schema is stable. These tables can be added as a migration or appended to the seed script. They do not modify any existing POC tables.

---

## SQL

```sql
-- =============================================================================
-- Phase 2 Schema Extension: Contribution Refund & Death/Survivor Processing
-- =============================================================================
-- Added to support Phase 2 process domains. Same legacy realism patterns
-- as the base schema: inconsistent naming, missing FKs, organic growth.
-- =============================================================================

-- =============================================================================
-- REFUND_REQUEST — Tracks refund applications and processing
-- =============================================================================
-- LEGACY WARTS:
--   - REFUND_AMT is pre-computed at application time, may be stale if
--     interest rate changes before issuance
--   - TAX_WITHHOLD_AMT stored even for rollovers (zero but present)
--   - ELECTION_CD added ~2012 when rollovers became common; older records
--     may be NULL (defaulted to direct payment)
--   - No FK to MEMBER_MASTER

CREATE TABLE REFUND_REQUEST (
    REFUND_ID           INTEGER         NOT NULL,
    MBR_ID              VARCHAR(20)     NOT NULL,
    REQUEST_DT          DATE,                       -- Date application received
    SEP_DT              DATE,                       -- Last day worked
    WAIT_END_DT         DATE,                       -- SEP_DT + 90 days
    WAIT_SATISFIED      CHAR(1),                    -- 'Y','N'

    VESTED_FLG          CHAR(1),                    -- 'Y','N'
    VESTED_ACKNOWLEDGE  CHAR(1),                    -- 'Y' if vested member signed forfeiture
    SPOUSE_NOTIFIED     CHAR(1),                    -- 'Y','N',NULL

    CONTRIB_TOTAL       DECIMAL(14,2),              -- Employee contributions sum
    INTEREST_TOTAL      DECIMAL(14,2),              -- Accumulated interest
    REFUND_AMT          DECIMAL(14,2),              -- CONTRIB_TOTAL + INTEREST_TOTAL
    INTEREST_RT         DECIMAL(6,4),               -- Rate used (e.g., 0.0200)

    ELECTION_CD         VARCHAR(15),                -- 'DIRECT','ROLLOVER','PARTIAL','LEAVE_IN_TRUST'
    ROLLOVER_INST       VARCHAR(100),               -- Institution name for rollover
    ROLLOVER_ACCT       VARCHAR(50),                -- Account number (masked in domain model)
    ROLLOVER_AMT        DECIMAL(14,2),              -- Portion rolled over (partial)
    TAX_WITHHOLD_AMT    DECIMAL(14,2),              -- 20% mandatory on non-rolled portion
    NET_PAYMENT_AMT     DECIMAL(14,2),              -- What member actually receives

    STATUS_CD           VARCHAR(15),                -- 'PENDING','APPROVED','ISSUED','CANCELLED','DENIED'
    APPROVED_DT         DATE,
    APPROVED_BY         VARCHAR(20),
    ISSUE_DT            DATE,                       -- Date payment/rollover processed
    CHECK_NBR           VARCHAR(20),                -- Payment reference
    ISSUE_DEADLINE      DATE,                       -- REQUEST_DT + 90 days per RMC

    DENY_REASON         VARCHAR(200),               -- If denied
    CANCEL_REASON       VARCHAR(200),               -- If cancelled (e.g., member returned to work)

    CREATE_DT           TIMESTAMP,
    CREATE_USER         VARCHAR(20),
    NOTES               VARCHAR(500),

    PRIMARY KEY (REFUND_ID)
    -- LEGACY: No FK to MEMBER_MASTER
);

CREATE INDEX IDX_RR_MBR ON REFUND_REQUEST(MBR_ID);
CREATE INDEX IDX_RR_STATUS ON REFUND_REQUEST(STATUS_CD);

-- =============================================================================
-- INTEREST_CREDIT — Annual interest compounding records
-- =============================================================================
-- Tracks each June 30 compounding event per member. Separate from
-- CONTRIBUTION_HIST because interest is a plan-level event, not
-- a payroll-period event.
--
-- LEGACY WARTS:
--   - Some years missing for members who terminated mid-year
--   - RATE_USED is the board-set rate for that year; stored per-record
--     because it changes
--   - BAL_BEFORE may not exactly match CONTRIBUTION_HIST running totals
--     (separate systems, eventual consistency)

CREATE TABLE INTEREST_CREDIT (
    MBR_ID              VARCHAR(20)     NOT NULL,
    CREDIT_DT           DATE            NOT NULL,   -- Always June 30 of some year
    BAL_BEFORE          DECIMAL(14,2),              -- Accumulated balance before interest
    RATE_USED           DECIMAL(6,4),               -- Board-set rate (e.g., 0.0200)
    INTEREST_AMT        DECIMAL(14,2),              -- BAL_BEFORE × RATE_USED
    BAL_AFTER           DECIMAL(14,2),              -- BAL_BEFORE + INTEREST_AMT
    FISCAL_YR           INTEGER,                    -- FY ending this June 30
    CREATE_DT           TIMESTAMP
    -- LEGACY: No PK. (MBR_ID, CREDIT_DT) implicit key. No FK.
);

CREATE INDEX IDX_IC_MBR ON INTEREST_CREDIT(MBR_ID);

-- =============================================================================
-- DEATH_RECORD — Tracks member death notification and processing
-- =============================================================================
-- LEGACY WARTS:
--   - DEATH_DT vs NOTIFY_DT confusion: some staff entered DEATH_DT in
--     NOTIFY_DT field (~3% of records)
--   - CERT_RECEIVED may be backdated if certificate was mailed
--   - CAUSE_CD added ~2015, NULL for older records
--   - OVERPAY fields added ~2018, NULL for older records

CREATE TABLE DEATH_RECORD (
    DEATH_ID            INTEGER         NOT NULL,
    MBR_ID              VARCHAR(20)     NOT NULL,
    DEATH_DT            DATE,                       -- Actual date of death
    NOTIFY_DT           DATE,                       -- Date DERP was notified
    NOTIFY_SOURCE       VARCHAR(20),                -- 'FAMILY','EMPLOYER','NEWSPAPER','SSA','OTHER'
    CERT_RECEIVED       CHAR(1),                    -- 'Y','N'
    CERT_RECEIVED_DT    DATE,
    CAUSE_CD            VARCHAR(20),                -- Added ~2015. 'NATURAL','ACCIDENT','OTHER'

    MBR_STATUS_AT_DEATH VARCHAR(10),                -- 'A','R','T','D' — copied from MEMBER_MASTER
    LAST_BENEFIT_DT     DATE,                       -- Last payment deposited before death
    LAST_BENEFIT_AMT    DECIMAL(12,2),

    OVERPAY_FLG         CHAR(1),                    -- 'Y','N'
    OVERPAY_AMT         DECIMAL(12,2),
    OVERPAY_RECOVERED   CHAR(1),                    -- 'Y','N','P' (partial)
    OVERPAY_METHOD      VARCHAR(20),                -- 'OFFSET','DIRECT','ESTATE'

    SUSPENSION_DT       DATE,                       -- Date benefit was suspended
    STATUS_CD           VARCHAR(15),                -- 'PENDING','VERIFIED','PROCESSED','CLOSED'

    CREATE_DT           TIMESTAMP,
    CREATE_USER         VARCHAR(20),
    NOTES               VARCHAR(500),

    PRIMARY KEY (DEATH_ID)
);

CREATE INDEX IDX_DR_MBR ON DEATH_RECORD(MBR_ID);

-- =============================================================================
-- SURVIVOR_BENEFIT — Continuing benefit to J&S survivor
-- =============================================================================
-- Created when a retiree with J&S election dies and beneficiary is alive.
-- This is a new payment stream, separate from the deceased member's
-- BENEFIT_PAYMENT record.
--
-- LEGACY WARTS:
--   - SURV_BENE_AMT is the monthly amount at setup; may not reflect
--     subsequent COLAs (COLA applied in BENEFIT_PAYMENT, not here)
--   - JS_PCT stored as decimal (0.75) not percentage (75)
--   - POPUP fields added ~2016, NULL for older records

CREATE TABLE SURVIVOR_BENEFIT (
    SURV_ID             INTEGER         NOT NULL,
    DEATH_ID            INTEGER,                    -- FK to DEATH_RECORD (but not enforced)
    MBR_ID              VARCHAR(20)     NOT NULL,   -- The DECEASED member
    SURV_MBR_ID         VARCHAR(20),                -- Survivor's own ID if they get one, else NULL

    SURV_FIRST_NM       VARCHAR(50),
    SURV_LAST_NM        VARCHAR(50),
    SURV_DOB            DATE,
    SURV_RELATION       VARCHAR(20),                -- 'SPOUSE','CHILD','OTHER'
    SURV_SSN            VARCHAR(15),                -- For tax/payment purposes

    JS_OPTION           VARCHAR(10),                -- '100JS','75JS','50JS'
    JS_PCT              DECIMAL(6,4),               -- 1.0000, 0.7500, 0.5000
    MBR_BENEFIT_AT_DEATH DECIMAL(12,2),             -- Member's benefit when they died
    SURV_BENE_AMT       DECIMAL(12,2),              -- MBR_BENEFIT_AT_DEATH × JS_PCT

    EFF_DT              DATE,                       -- First survivor payment date
    END_DT              DATE,                       -- NULL for lifetime; set if survivor dies
    STATUS_CD           CHAR(1),                    -- 'A','S','T' (active, suspended, terminated)

    -- Pop-up tracking (if beneficiary predeceased — rare, but tracked)
    POPUP_APPLIED       CHAR(1),                    -- 'Y','N',NULL
    POPUP_DT            DATE,
    POPUP_PREV_AMT      DECIMAL(12,2),
    POPUP_NEW_AMT       DECIMAL(12,2),

    COLA_ELIGIBLE       CHAR(1),                    -- 'Y'
    COLA_BASE_DT        DATE,                       -- Member's original retirement date

    CREATE_DT           TIMESTAMP,
    CREATE_USER         VARCHAR(20),
    NOTES               VARCHAR(500),

    PRIMARY KEY (SURV_ID)
);

CREATE INDEX IDX_SB_MBR ON SURVIVOR_BENEFIT(MBR_ID);
CREATE INDEX IDX_SB_STATUS ON SURVIVOR_BENEFIT(STATUS_CD);

-- =============================================================================
-- DEATH_BENEFIT_INSTALLMENT — Tracks lump-sum death benefit installment stream
-- =============================================================================
-- Separate from pension benefit. Tracks the $5,000 (or reduced amount)
-- paid as 50 or 100 monthly installments.
--
-- LEGACY WARTS:
--   - ELECTION_TYPE sometimes stored as '50' or '100' (integer string)
--     instead of '50_INST' or '100_INST'
--   - PAYEE fields denormalized from BENEFICIARY table
--   - REMAINING_AMT may drift from calculated (TOTAL - SUM(payments))

CREATE TABLE DEATH_BENEFIT_INSTALLMENT (
    DBI_ID              INTEGER         NOT NULL,
    MBR_ID              VARCHAR(20)     NOT NULL,   -- Original member
    DEATH_ID            INTEGER,                    -- FK to DEATH_RECORD (not enforced)

    BENEFIT_AMT         DECIMAL(12,2),              -- Total death benefit ($5,000 or reduced)
    ELECTION_TYPE       VARCHAR(10),                -- '50_INST','100_INST' (see warts above)
    MONTHLY_AMT         DECIMAL(12,2),              -- BENEFIT_AMT / election count
    TOTAL_INSTALLMENTS  INTEGER,                    -- 50 or 100

    START_DT            DATE,                       -- First installment date (retirement date)
    INSTALLMENTS_PAID   INTEGER,                    -- Count paid as of last update
    AMT_PAID            DECIMAL(12,2),              -- Sum paid
    REMAINING_AMT       DECIMAL(12,2),              -- BENEFIT_AMT - AMT_PAID

    -- Payee tracking (denormalized)
    CURRENT_PAYEE_NM    VARCHAR(100),               -- Initially member, then beneficiary after death
    CURRENT_PAYEE_TYPE  VARCHAR(10),                -- 'MEMBER','BENEFICIARY','ESTATE'
    TRANSFER_DT         DATE,                       -- Date payee changed (member death)

    STATUS_CD           VARCHAR(10),                -- 'ACTIVE','COMPLETED','SUSPENDED'
    CREATE_DT           TIMESTAMP,
    CREATE_USER         VARCHAR(20),

    PRIMARY KEY (DBI_ID)
);

CREATE INDEX IDX_DBI_MBR ON DEATH_BENEFIT_INSTALLMENT(MBR_ID);

-- =============================================================================
-- RE_EMPLOYMENT — Tracks members returning after separation
-- =============================================================================
-- Phase 2 infrastructure for re-employment scenarios. Connects to
-- refund restoration logic.
--
-- LEGACY WARTS:
--   - PRIOR_SVC_RESTORED sometimes 'Y' before repayment completed
--   - REPAY_AMT calculated at return, may not include final interest

CREATE TABLE RE_EMPLOYMENT (
    REEMPL_ID           INTEGER         NOT NULL,
    MBR_ID              VARCHAR(20)     NOT NULL,
    PRIOR_SEP_DT        DATE,                       -- Previous termination date
    REHIRE_DT           DATE,
    MONTHS_SEPARATED    INTEGER,
    WITHIN_24_MONTHS    CHAR(1),                    -- 'Y','N'

    PRIOR_REFUND_TAKEN  CHAR(1),                    -- 'Y','N'
    PRIOR_REFUND_ID     INTEGER,                    -- FK to REFUND_REQUEST (not enforced)
    PRIOR_REFUND_AMT    DECIMAL(14,2),

    REPAY_REQUIRED      CHAR(1),                    -- 'Y' if refund was taken
    REPAY_AMT           DECIMAL(14,2),              -- Refund + 3% interest
    REPAY_RECEIVED      CHAR(1),                    -- 'Y','N','P' (partial)
    REPAY_DT            DATE,

    PRIOR_SVC_RESTORED  CHAR(1),                    -- 'Y','N'
    PRIOR_SVC_YEARS     DECIMAL(8,2),               -- Service credit restored
    NEW_TIER            INTEGER,                    -- Tier 3 per re-employment rules

    STATUS_CD           VARCHAR(10),                -- 'PENDING','ACTIVE','DENIED'
    CREATE_DT           TIMESTAMP,
    CREATE_USER         VARCHAR(20),
    NOTES               VARCHAR(500),

    PRIMARY KEY (REEMPL_ID)
);

CREATE INDEX IDX_RE_MBR ON RE_EMPLOYMENT(MBR_ID);
```

## Legacy Realism Notes

These tables exhibit the same patterns as the POC schema:

- **No foreign keys enforced** — application-layer referential integrity only
- **Denormalized data** — payee names stored directly instead of joining to BENEFICIARY
- **Running totals that drift** — REMAINING_AMT, INSTALLMENTS_PAID may not match calculated values
- **Organic column additions** — CAUSE_CD, OVERPAY fields added years after table creation
- **Inconsistent encodings** — ELECTION_TYPE sometimes '50' vs '50_INST'

The Data Connector must handle all these inconsistencies when presenting clean domain entities upstream.

## Data Quality Issues to Inject

For the 10,000-member population, inject these deliberate problems:

| Issue ID | Table | Problem | Frequency |
|----------|-------|---------|-----------|
| DQ-REFUND-01 | REFUND_REQUEST | WAIT_SATISFIED='Y' but REQUEST_DT < WAIT_END_DT | ~5 records |
| DQ-DEATH-01 | DEATH_RECORD | NOTIFY_DT < DEATH_DT (notified before death — impossible) | ~3 records |
| DQ-DEATH-02 | DEATH_RECORD | Member STATUS_CD still 'R' not 'X' after verified death | ~8 records |
| DQ-SURV-01 | SURVIVOR_BENEFIT | SURV_BENE_AMT ≠ MBR_BENEFIT_AT_DEATH × JS_PCT | ~4 records |
| DQ-DBI-01 | DEATH_BENEFIT_INSTALLMENT | REMAINING_AMT ≠ BENEFIT_AMT − AMT_PAID | ~6 records |
| DQ-REEMPL-01 | RE_EMPLOYMENT | PRIOR_SVC_RESTORED='Y' but REPAY_RECEIVED='N' | ~2 records |

These parallel the POC's DQ-001 through DQ-006 patterns and demonstrate the Data Quality Engine discovering Phase 2-specific errors.
