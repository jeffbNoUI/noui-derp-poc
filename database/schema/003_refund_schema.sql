-- ============================================================================
-- DERP Legacy Database Schema — 003_refund_schema.sql
-- Contribution Refund tables
-- ============================================================================
-- Extends the legacy schema with tables needed for contribution refund processing.
-- Follows the same messy-legacy naming conventions as 001_legacy_schema.sql:
--   - Abbreviated column names (_DT, _AMT, _CD)
--   - Inconsistent nullable/not-null patterns
--   - Overloaded status codes
--   - Missing FK constraints (intentional — legacy batch processes skip FK checks)
--
-- Created: Phase 2, Session 7 — Contribution Refund domain
-- Depends on: 001_legacy_schema.sql (MEMBER_MASTER, CONTRIBUTION_HIST)
-- ============================================================================

-- ── REFUND_APPLICATION ──────────────────────────────────────────────────────
-- Tracks contribution refund applications from terminated members.
-- One record per refund attempt. A member could have multiple if they
-- re-employ, separate again, and request another refund.
-- Status flow: PENDING → IN_REVIEW → APPROVED → PAID  (or DENIED at any point)
CREATE TABLE REFUND_APPLICATION (
    REFUND_ID       SERIAL          NOT NULL,
    MBR_ID          VARCHAR(10)     NOT NULL,
    APP_DT          DATE            NOT NULL,       -- Application submission date
    TERM_DT         DATE,                           -- Termination date (redundant with MEMBER_MASTER, but that's legacy)
    WAIT_EXPIRE_DT  DATE,                           -- 90-day waiting period expiration
    STATUS_CD       VARCHAR(15)     NOT NULL,       -- PENDING, IN_REVIEW, APPROVED, DENIED, PAID, CANCELLED
    DENY_REASON     VARCHAR(200),                   -- Populated when STATUS_CD = DENIED

    -- Calculation results (populated during IN_REVIEW)
    TOTAL_CONTRIB   NUMERIC(14,2),                  -- Sum of employee contributions
    TOTAL_INTEREST  NUMERIC(14,2),                  -- Accrued interest on contributions
    GROSS_REFUND    NUMERIC(14,2),                  -- TOTAL_CONTRIB + TOTAL_INTEREST
    TAX_WITHHOLD    NUMERIC(14,2),                  -- 20% federal withholding (or 0 for rollover)
    NET_REFUND      NUMERIC(14,2),                  -- GROSS_REFUND - TAX_WITHHOLD

    -- Election
    ELECT_TYPE      VARCHAR(20),                    -- DIRECT_PAYMENT, DIRECT_ROLLOVER, PARTIAL_ROLLOVER
    ROLLOVER_AMT    NUMERIC(14,2),                  -- Amount rolled over (null unless PARTIAL_ROLLOVER)
    ROLLOVER_INST   VARCHAR(100),                   -- Institution name for rollover destination
    ROLLOVER_ACCT   VARCHAR(40),                    -- Account number at rollover institution

    -- Vesting / forfeiture
    VESTED_FLG      CHAR(1),                        -- Y/N — was member vested at termination
    SVC_YEARS       NUMERIC(8,2),                   -- Service years at termination
    FORFEIT_FLG     CHAR(1),                        -- Y/N — pension rights forfeited
    FORFEIT_ACK_DT  DATE,                           -- Date member acknowledged forfeiture

    -- Processing
    CALC_DT         DATE,                           -- When refund was calculated
    CALC_USER       VARCHAR(20),                    -- Who ran the calculation
    APPROVED_DT     DATE,                           -- When refund was approved
    APPROVED_BY     VARCHAR(20),                    -- Who approved
    PAID_DT         DATE,                           -- When payment was issued
    CHECK_NBR       VARCHAR(20),                    -- Check or wire reference number

    -- Audit
    CREATE_DT       TIMESTAMP,
    CREATE_USER     VARCHAR(20),
    NOTES           TEXT,

    CONSTRAINT PK_REFUND PRIMARY KEY (REFUND_ID)
    -- Note: no FK to MEMBER_MASTER (legacy pattern)
);

CREATE INDEX IDX_REFUND_MBR ON REFUND_APPLICATION (MBR_ID);
CREATE INDEX IDX_REFUND_STATUS ON REFUND_APPLICATION (STATUS_CD);
CREATE INDEX IDX_REFUND_APP_DT ON REFUND_APPLICATION (APP_DT);

-- ── CONTRIBUTION_LEDGER ─────────────────────────────────────────────────────
-- Monthly contribution records with running balance for refund calculation.
-- More granular than CONTRIBUTION_HIST (which is per pay period).
-- This table aggregates to monthly and maintains the running balance needed
-- for interest compounding calculations.
--
-- NOTE: This could be derived from CONTRIBUTION_HIST, but legacy systems
-- often have both a detail table and a summary/ledger table that drift.
CREATE TABLE CONTRIBUTION_LEDGER (
    LEDGER_ID       SERIAL          NOT NULL,
    MBR_ID          VARCHAR(10)     NOT NULL,
    LEDGER_MONTH    DATE            NOT NULL,       -- First of month (e.g., 2022-04-01)
    PENS_SALARY     NUMERIC(12,2),                  -- Pensionable salary for this month
    EMPL_CONTRIB    NUMERIC(12,2),                  -- Employee contribution (salary × 8.45%)
    EMPR_CONTRIB    NUMERIC(12,2),                  -- Employer contribution (salary × 17.95%)
    RUNNING_BAL     NUMERIC(14,2),                  -- Running employee contribution balance
    FISCAL_YR       SMALLINT,                       -- Fiscal year (July-June)

    -- Audit
    PROC_DT         DATE,                           -- When this ledger entry was created
    SOURCE_CD       VARCHAR(10),                    -- PAYROLL, ADJUSTMENT, CORRECTION

    CONSTRAINT PK_CONTRIB_LEDGER PRIMARY KEY (LEDGER_ID)
);

CREATE UNIQUE INDEX IDX_LEDGER_MBR_MONTH ON CONTRIBUTION_LEDGER (MBR_ID, LEDGER_MONTH);
CREATE INDEX IDX_LEDGER_MBR ON CONTRIBUTION_LEDGER (MBR_ID);
CREATE INDEX IDX_LEDGER_FY ON CONTRIBUTION_LEDGER (FISCAL_YR);

-- ── INTEREST_CREDIT ─────────────────────────────────────────────────────────
-- Records annual interest credits on employee contribution balances.
-- Interest is compounded once per year on June 30.
-- Each row represents one compounding event for one member.
CREATE TABLE INTEREST_CREDIT (
    CREDIT_ID       SERIAL          NOT NULL,
    MBR_ID          VARCHAR(10)     NOT NULL,
    CREDIT_DT       DATE            NOT NULL,       -- Always June 30 of the applicable year
    BAL_BEFORE      NUMERIC(14,2),                  -- Balance before interest
    INTEREST_RT     NUMERIC(6,4),                   -- Interest rate applied (e.g., 0.0200)
    INTEREST_AMT    NUMERIC(12,2),                  -- Calculated interest amount
    BAL_AFTER       NUMERIC(14,2),                  -- Balance after interest
    FISCAL_YR       SMALLINT,                       -- Fiscal year ending on this June 30

    -- Audit
    CALC_DT         DATE,
    CALC_USER       VARCHAR(20),

    CONSTRAINT PK_INTEREST_CREDIT PRIMARY KEY (CREDIT_ID)
);

CREATE UNIQUE INDEX IDX_INTEREST_MBR_DT ON INTEREST_CREDIT (MBR_ID, CREDIT_DT);
CREATE INDEX IDX_INTEREST_MBR ON INTEREST_CREDIT (MBR_ID);
CREATE INDEX IDX_INTEREST_FY ON INTEREST_CREDIT (FISCAL_YR);
