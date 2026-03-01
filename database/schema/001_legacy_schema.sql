-- ============================================================================
-- COPERA Legacy Database Schema — 001_legacy_schema.sql
-- Colorado Public Employees' Retirement Association
-- ============================================================================
-- This schema simulates COPERA's IBM i (DB2) legacy pension administration
-- database discovered during the Data Assessment (March 2025, v0.4).
-- Table names match actual COPERA IBM i table names from the assessment.
--
-- Key data quality issues identified in the assessment:
--   - SSN used as pseudo-PK in several tables (no entity ID in some)
--   - Fragmented member masters (PERA vs DPS, separate terminated file)
--   - Tier tracking only happens at retirement (active members inferred)
--   - Employment history spread across multiple choice/hire/term tables
--   - Anti-spiking calculation embedded in RPG routines, not stored
--
-- Created for COPERA sales demo — shows NoUI awareness of their actual data
-- ============================================================================

-- ── EMPLOYER_REF ─────────────────────────────────────────────────────────
-- Employer reference (state agencies, school districts, municipalities, DPS)
-- Each employer maps to one division: State, School, LocalGov, Judicial, DPS
CREATE TABLE EMPLOYER_REF (
    EMPLOYER_CD     VARCHAR(8)      NOT NULL,
    EMPLOYER_NAME   VARCHAR(100)    NOT NULL,
    DIVISION_CD     VARCHAR(10)     NOT NULL,       -- State, School, LocalGov, Judicial, DPS
    EMPLOYER_TYPE   VARCHAR(20),                    -- Agency, District, Municipality, Department
    ACTIVE_FLG      CHAR(1)         DEFAULT 'Y',
    EFF_DT          DATE,
    CONSTRAINT PK_EMPLOYER PRIMARY KEY (EMPLOYER_CD)
);

-- ── DCPSTMR0 — Employee Master ──────────────────────────────────────────
-- Originally for DC plan participants, later expanded to all employees.
-- Known gaps: exempt employees not always included, pre-2022 VRA records missing.
-- Source: Data Assessment Level #2 (Employment History)
CREATE TABLE DCPSTMR0 (
    ENTITY_ID       VARCHAR(12)     NOT NULL,       -- Internal entity identifier
    SSN             VARCHAR(11),                    -- Still used as lookup key in some RPG programs
    EMPLOYER_CD     VARCHAR(8),                     -- FK to EMPLOYER_REF
    HIRE_DT         DATE,                           -- Original hire date
    TERM_DT         DATE,                           -- Termination date (null if active)
    STATUS_CD       CHAR(1),                        -- A=Active, T=Terminated, R=Retired, D=Deferred
    JOB_CLASS       VARCHAR(20),                    -- Job classification code
    SALARY_AMT      NUMERIC(12,2),                  -- Current annual salary (redundant with pay history)
    FTE_PCT         NUMERIC(5,3),                   -- Full-time equivalent (1.000 = full-time)
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_DCPSTMR0 PRIMARY KEY (ENTITY_ID)
);

-- ── MDPMBMR0 — PERA DB Master ───────────────────────────────────────────
-- Master record for PERA Defined Benefit plan participants.
-- Tracks demographics, membership, contribution status, service credit.
-- Members deleted from here when refund processed → moved to MDPMBTM0.
-- Source: Data Assessment Level #1 (Demographics)
CREATE TABLE MDPMBMR0 (
    MBR_ID          VARCHAR(12)     NOT NULL,       -- Internal member ID (maps to ENTITY_ID)
    SSN             VARCHAR(11),                    -- Still primary lookup in some legacy RPG
    FIRST_NM        VARCHAR(30),
    LAST_NM         VARCHAR(40),
    MIDDLE_NM       VARCHAR(30),
    SUFFIX          VARCHAR(10),
    DOB             DATE,
    GENDER_CD       CHAR(1),                        -- M/F

    -- Address
    ADDR_LINE1      VARCHAR(100),
    ADDR_LINE2      VARCHAR(100),
    CITY            VARCHAR(40),
    STATE_CD        CHAR(2),
    ZIP_CD          VARCHAR(10),

    -- Contact
    HOME_PHONE      VARCHAR(20),
    EMAIL_ADDR      VARCHAR(80),
    CELL_PHONE      VARCHAR(20),

    -- Membership & status
    MEMBERSHIP_DT   DATE,                           -- First contribution date (drives tier assignment)
    DIVISION_CD     VARCHAR(10),                    -- State, School, LocalGov, Judicial
    STATUS_CD       CHAR(1),                        -- A=Active, R=Retired, T=Term, D=Deferred
    MARITAL_STS     CHAR(1),                        -- M=Married, S=Single, D=Divorced, W=Widowed

    -- Service credit (rolled up from detailed MDPHASC0 table)
    SVC_CREDIT_YRS  NUMERIC(8,4),                   -- Total calculated service credit
    PURCHASED_SVC   NUMERIC(8,4),                   -- Purchased service credit
    MILITARY_SVC    NUMERIC(8,4),                   -- Military service credit

    -- Salary (redundant with pay records — legacy rollup field)
    ANNUAL_SALARY   NUMERIC(12,2),                  -- Current annual salary

    -- Dates
    HIRE_DT         DATE,
    TERM_DT         DATE,
    LAST_UPD_DT     TIMESTAMP,

    CONSTRAINT PK_MDPMBMR0 PRIMARY KEY (MBR_ID)
);

-- ── DPPMBMR0 — DPS DB Master ────────────────────────────────────────────
-- Same structure as MDPMBMR0 but for DPS (Denver Public Safety) members.
-- Maintained separately due to historical differences in funding structures.
-- Source: Data Assessment Level #1 (Demographics)
CREATE TABLE DPPMBMR0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    SSN             VARCHAR(11),
    FIRST_NM        VARCHAR(30),
    LAST_NM         VARCHAR(40),
    MIDDLE_NM       VARCHAR(30),
    SUFFIX          VARCHAR(10),
    DOB             DATE,
    GENDER_CD       CHAR(1),

    ADDR_LINE1      VARCHAR(100),
    ADDR_LINE2      VARCHAR(100),
    CITY            VARCHAR(40),
    STATE_CD        CHAR(2),
    ZIP_CD          VARCHAR(10),

    HOME_PHONE      VARCHAR(20),
    EMAIL_ADDR      VARCHAR(80),
    CELL_PHONE      VARCHAR(20),

    MEMBERSHIP_DT   DATE,
    DIVISION_CD     VARCHAR(10)     DEFAULT 'DPS',
    STATUS_CD       CHAR(1),
    MARITAL_STS     CHAR(1),

    SVC_CREDIT_YRS  NUMERIC(8,4),
    PURCHASED_SVC   NUMERIC(8,4),
    MILITARY_SVC    NUMERIC(8,4),

    ANNUAL_SALARY   NUMERIC(12,2),

    HIRE_DT         DATE,
    TERM_DT         DATE,
    LAST_UPD_DT     TIMESTAMP,

    CONSTRAINT PK_DPPMBMR0 PRIMARY KEY (MBR_ID)
);

-- ── CMPTIER0 — Tier / HAS Table Tracking ─────────────────────────────────
-- Stores the HAS table assignment for each member.
-- IMPORTANT: Members in the current/default tier are NOT recorded until retirement.
-- Active members' tiers must be inferred from membership date.
-- Valid values: P1-P9 (PERA tables), D1-D4 (DPS tables).
-- Source: Data Assessment Level #2 — "Start Date and Hire/Term Date Complexity"
CREATE TABLE CMPTIER0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    TIER_CD         VARCHAR(4)      NOT NULL,       -- P1-P9, D1-D4
    MEMBERSHIP_DT   DATE,                           -- First contribution date
    VESTED_FLG      CHAR(1),                        -- Y/N — vested as of record date
    VESTED_DT       DATE,                           -- Date vesting was confirmed
    ANNUITY_NBR     VARCHAR(12),                    -- Assigned at retirement only
    EFF_DT          DATE,                           -- Record effective date
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_CMPTIER0 PRIMARY KEY (MBR_ID, TIER_CD)
);

-- ── MDPHASC0 — Salary & Service Credit History (PERA) ────────────────────
-- Monthly salary, service credit, and adjustments by year.
-- Used for HAS (Highest Average Salary) calculation.
-- Source: Data Assessment Level #5 (Service Credit History)
CREATE TABLE MDPHASC0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    YEAR_NBR        SMALLINT        NOT NULL,       -- Calendar year
    MONTH_NBR       SMALLINT        NOT NULL,       -- 1-12
    GROSS_PAY       NUMERIC(12,2),                  -- Total gross pay
    PENSION_PAY     NUMERIC(12,2),                  -- Pensionable salary (may differ from gross)
    SVC_CREDIT      NUMERIC(6,4),                   -- Monthly service credit earned (usually 1/12)
    ADJUSTMENT_CD   CHAR(2),                        -- Adjustment type (null for normal)
    EMPLOYER_CD     VARCHAR(8),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPHASC0 PRIMARY KEY (MBR_ID, YEAR_NBR, MONTH_NBR)
);

-- ── SALARY_ANNUAL — Annual salary rollup (for anti-spiking) ──────────────
-- Annualized salary figures used for HAS calculation and anti-spiking check.
-- This is derived data but stored for audit trail.
CREATE TABLE SALARY_ANNUAL (
    MBR_ID          VARCHAR(12)     NOT NULL,
    YEAR_NBR        SMALLINT        NOT NULL,
    ANNUAL_SALARY   NUMERIC(12,2)   NOT NULL,       -- Annualized pensionable salary
    EMPLOYER_CD     VARCHAR(8),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_SALARY_ANNUAL PRIMARY KEY (MBR_ID, YEAR_NBR)
);

-- ── ANPMBMR0 — Annuitant Master ──────────────────────────────────────────
-- Primary record for retired members receiving pension benefits.
-- Created at retirement. Also created for pre-retirement death cases.
-- Annuity numbers starting with '11' indicate survivor annuities.
-- Source: Data Assessment Level #6 (Member Benefit History)
CREATE TABLE ANPMBMR0 (
    ANNUITY_NBR     VARCHAR(12)     NOT NULL,       -- Annuity tracking number
    MBR_ID          VARCHAR(12)     NOT NULL,
    SSN             VARCHAR(11),
    RET_TYPE_CD     CHAR(2),                        -- NR=Normal, ER=Early, RN=Rule of N, DF=Deferred
    RET_EFF_DT      DATE,                           -- Effective retirement date
    BENEFIT_AMT     NUMERIC(12,2),                  -- Monthly benefit amount (current)
    BASE_BENEFIT    NUMERIC(12,2),                  -- Original calculated benefit
    OPTION_CD       VARCHAR(4),                     -- 1/2/3 for PERA, A/B/P2/P3 for DPS
    DIVISION_CD     VARCHAR(10),
    HAS_TABLE_CD    VARCHAR(4),                     -- P1-P9, D1-D4
    HAS_AMT         NUMERIC(12,2),                  -- Annual HAS at retirement
    SVC_CREDIT_YRS  NUMERIC(8,4),                   -- Service credit at retirement
    MULTIPLIER      NUMERIC(6,4),                   -- Benefit multiplier used (0.0250)
    REDUCTION_PCT   NUMERIC(6,4),                   -- Early retirement reduction (0 if none)
    AI_RATE         NUMERIC(6,4),                   -- Annual increase rate (0.015 or 0.010)
    CO_BENEF_SSN    VARCHAR(11),                    -- Co-benefit recipient SSN
    CO_BENEF_NM     VARCHAR(60),                    -- Co-benefit recipient name
    STATUS_CD       CHAR(1),                        -- A=Active, S=Suspended, D=Deceased
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_ANPMBMR0 PRIMARY KEY (ANNUITY_NBR)
);

-- ── MDPBBMR0 / DPPBBMR0 — Benefit Calculation Master ─────────────────────
-- Created during benefit calculation, before finalization.
-- Tracks the calculation inputs and result for audit.
-- Source: Data Assessment Level #6
CREATE TABLE MDPBBMR0 (
    CALC_ID         SERIAL          NOT NULL,
    MBR_ID          VARCHAR(12)     NOT NULL,
    CALC_DT         DATE            NOT NULL,
    HAS_TABLE_CD    VARCHAR(4),
    HAS_AMT         NUMERIC(12,2),                  -- Annual HAS
    SVC_CREDIT_YRS  NUMERIC(8,4),
    MULTIPLIER      NUMERIC(6,4),
    UNREDUCED_AMT   NUMERIC(12,2),                  -- Monthly unreduced benefit
    REDUCTION_PCT   NUMERIC(6,4),
    REDUCED_AMT     NUMERIC(12,2),                  -- Monthly reduced benefit
    ANTI_SPIKE_FLG  CHAR(1)         DEFAULT 'N',    -- Y/N anti-spiking was applied
    DIVISION_CD     VARCHAR(10),
    STATUS_CD       CHAR(1)         DEFAULT 'P',    -- P=Pending, A=Approved, R=Rejected
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPBBMR0 PRIMARY KEY (CALC_ID)
);

-- ── Beneficiary tables ───────────────────────────────────────────────────
-- MDPBNMR0 (PERA) and DPPBNMR0 (DPS) track beneficiary designations.
CREATE TABLE MDPBNMR0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    BENEF_SEQ       SMALLINT        NOT NULL,       -- Sequence number for multiple beneficiaries
    BENEF_NM        VARCHAR(60),
    BENEF_SSN       VARCHAR(11),
    BENEF_DOB       DATE,
    BENEF_REL       VARCHAR(20),                    -- Spouse, Child, Parent, Other
    BENEF_PCT       NUMERIC(5,2),                   -- Percentage allocation
    PRIMARY_FLG     CHAR(1)         DEFAULT 'Y',    -- P=Primary, C=Contingent
    EFF_DT          DATE,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPBNMR0 PRIMARY KEY (MBR_ID, BENEF_SEQ)
);

-- ── ANPDRMR0 — DRO (Domestic Relations Order) Master ──────────────────────
-- Tracks alternate payees for pension benefit splits due to divorce.
-- Source: Data Assessment Level #8 (DRO)
CREATE TABLE ANPDRMR0 (
    DRO_ID          SERIAL          NOT NULL,
    MBR_ID          VARCHAR(12)     NOT NULL,
    ALT_PAYEE_NM    VARCHAR(60),
    ALT_PAYEE_SSN   VARCHAR(11),
    ALT_PAYEE_DOB   DATE,
    ALT_PAYEE_REL   VARCHAR(20),
    MARRIAGE_DT     DATE,
    DIVORCE_DT      DATE,
    DIV_METHOD      VARCHAR(20),                    -- PERCENTAGE, FIXED_AMOUNT, TIME_RULE
    DIV_PCT         NUMERIC(6,4),
    DIV_AMT         NUMERIC(12,2),
    STATUS_CD       CHAR(1),                        -- P=Pending, A=Approved, C=Closed
    MARITAL_SVC_YRS NUMERIC(8,4),
    EFF_DT          DATE,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_ANPDRMR0 PRIMARY KEY (DRO_ID)
);

-- ── Contribution History ──────────────────────────────────────────────────
-- Tracks employee and employer contributions by pay period.
CREATE TABLE CONTRIBUTION_HIST (
    MBR_ID          VARCHAR(12)     NOT NULL,
    YEAR_NBR        SMALLINT        NOT NULL,
    MONTH_NBR       SMALLINT        NOT NULL,
    EE_CONTRIB      NUMERIC(12,2),                  -- Employee contribution
    ER_CONTRIB      NUMERIC(12,2),                  -- Employer contribution
    EE_RATE         NUMERIC(6,4),                   -- Rate at time of contribution
    ER_RATE         NUMERIC(6,4),
    EMPLOYER_CD     VARCHAR(8),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_CONTRIB_HIST PRIMARY KEY (MBR_ID, YEAR_NBR, MONTH_NBR)
);

-- ── Service Purchase ──────────────────────────────────────────────────────
CREATE TABLE SERVICE_PURCHASE (
    PURCHASE_ID     SERIAL          NOT NULL,
    MBR_ID          VARCHAR(12)     NOT NULL,
    PURCHASE_TYPE   VARCHAR(20),                    -- MILITARY, LEAVE, REDEPOSIT, OTHER
    SVC_YEARS       NUMERIC(8,4),
    COST_AMT        NUMERIC(12,2),
    PAID_AMT        NUMERIC(12,2),
    STATUS_CD       CHAR(1),                        -- P=Pending, A=Approved, C=Complete
    EFF_DT          DATE,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_SVC_PURCHASE PRIMARY KEY (PURCHASE_ID)
);

-- ── ENTITY — Centralized Entity Reference ───────────────────────────────
-- Partial rollout of entity-based identification. Not all members have an
-- ENTITY_ID — some legacy records still rely on SSN as primary lookup.
-- Source: Data Assessment Level #1 (Demographics)
CREATE TABLE ENTITY (
    ENTITY_ID       VARCHAR(12)     NOT NULL,
    SSN             VARCHAR(11),
    FIRST_NM        VARCHAR(30),
    LAST_NM         VARCHAR(40),
    MIDDLE_NM       VARCHAR(30),
    SUFFIX          VARCHAR(10),
    DOB             DATE,
    GENDER_CD       CHAR(1),
    ENTITY_TYPE     CHAR(1),                        -- M=Member, B=Beneficiary, A=Alternate Payee
    CREATE_DT       TIMESTAMP,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_ENTITY PRIMARY KEY (ENTITY_ID)
);

-- ── MDPMBDT0 — PERA Department Master ───────────────────────────────────
-- Employment detail by department for PERA (non-DPS) members.
-- Tracks employer assignments, job classifications, FTE status.
-- Source: Data Assessment Level #2 (Employment History)
CREATE TABLE MDPMBDT0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    EMPLOYER_CD     VARCHAR(8)      NOT NULL,
    DEPT_SEQ        SMALLINT        NOT NULL DEFAULT 1,
    JOB_CLASS       VARCHAR(20),
    JOB_TITLE       VARCHAR(60),
    FTE_PCT         NUMERIC(5,3)    DEFAULT 1.000,
    START_DT        DATE,
    END_DT          DATE,
    STATUS_CD       CHAR(1),                        -- A=Active, T=Terminated, R=Retired
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPMBDT0 PRIMARY KEY (MBR_ID, EMPLOYER_CD, DEPT_SEQ)
);

-- ── DPPMBDT0 — DPS Department Master ────────────────────────────────────
-- Same as MDPMBDT0 but for DPS members. Includes RANK_CD for sworn officers.
-- Source: Data Assessment Level #2 (Employment History)
CREATE TABLE DPPMBDT0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    EMPLOYER_CD     VARCHAR(8)      NOT NULL,
    DEPT_SEQ        SMALLINT        NOT NULL DEFAULT 1,
    JOB_CLASS       VARCHAR(20),
    JOB_TITLE       VARCHAR(60),
    RANK_CD         VARCHAR(10),                    -- DPS-specific: sworn officer rank
    FTE_PCT         NUMERIC(5,3)    DEFAULT 1.000,
    START_DT        DATE,
    END_DT          DATE,
    STATUS_CD       CHAR(1),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_DPPMBDT0 PRIMARY KEY (MBR_ID, EMPLOYER_CD, DEPT_SEQ)
);

-- ── ACPDPMA0 — Agency/Department Directory ──────────────────────────────
-- Reference table mapping agencies to departments within employers.
-- Source: Data Assessment Level #2 (Employment History)
CREATE TABLE ACPDPMA0 (
    AGENCY_CD       VARCHAR(8)      NOT NULL,
    DEPT_CD         VARCHAR(8)      NOT NULL,
    AGENCY_NM       VARCHAR(80),
    DEPT_NM         VARCHAR(80),
    DIVISION_CD     VARCHAR(10),
    ACTIVE_FLG      CHAR(1)         DEFAULT 'Y',
    EFF_DT          DATE,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_ACPDPMA0 PRIMARY KEY (AGENCY_CD, DEPT_CD)
);

-- ── DCPSTMC0 — Choice Group File ────────────────────────────────────────
-- Tracks plan election choices for DC/hybrid participants.
-- Known gap: some members have DCPSTMR0 record but no DCPSTMC0 entry.
-- Source: Data Assessment Level #2 (Employment History)
CREATE TABLE DCPSTMC0 (
    ENTITY_ID       VARCHAR(12)     NOT NULL,
    CHOICE_CD       VARCHAR(4)      NOT NULL,       -- DB=Defined Benefit, DC=Defined Contribution, HY=Hybrid
    ELECTION_DT     DATE,
    EFF_DT          DATE,
    EMPLOYER_CD     VARCHAR(8),
    STATUS_CD       CHAR(1),                        -- A=Active, C=Cancelled, P=Pending
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_DCPSTMC0 PRIMARY KEY (ENTITY_ID, CHOICE_CD)
);

-- ── MDPMBTM0 — Terminated Member Master ─────────────────────────────────
-- Members deleted from MDPMBMR0 upon refund processing are moved here.
-- Preserves history for members who fully separated and took a refund.
-- Source: Data Assessment Level #1 (Demographics)
CREATE TABLE MDPMBTM0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    SSN             VARCHAR(11),
    FIRST_NM        VARCHAR(30),
    LAST_NM         VARCHAR(40),
    DOB             DATE,
    GENDER_CD       CHAR(1),
    MEMBERSHIP_DT   DATE,
    DIVISION_CD     VARCHAR(10),
    TERM_DT         DATE,
    REFUND_DT       DATE,
    REFUND_AMT      NUMERIC(12,2),
    SVC_CREDIT_YRS  NUMERIC(8,4),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPMBTM0 PRIMARY KEY (MBR_ID)
);

-- ── MDTMBDP0 — PERA Member Deposits ────────────────────────────────────
-- Contribution detail by pay period for PERA members.
-- Source: Data Assessment Level #3 (Contribution / Deposit History)
CREATE TABLE MDTMBDP0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    DEPOSIT_DT      DATE            NOT NULL,
    PAY_PRD_END     DATE,
    EE_AMT          NUMERIC(12,2),                  -- Employee contribution
    ER_AMT          NUMERIC(12,2),                  -- Employer contribution
    SALARY_AMT      NUMERIC(12,2),                  -- Pensionable salary for period
    EE_RATE         NUMERIC(6,4),
    ER_RATE         NUMERIC(6,4),
    EMPLOYER_CD     VARCHAR(8),
    BATCH_NBR       VARCHAR(12),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDTMBDP0 PRIMARY KEY (MBR_ID, DEPOSIT_DT)
);

-- ── DPTMBDP0 — DPS Member Deposits ─────────────────────────────────────
-- Same as MDTMBDP0 but for DPS members (different contribution rates).
-- Source: Data Assessment Level #3 (Contribution / Deposit History)
CREATE TABLE DPTMBDP0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    DEPOSIT_DT      DATE            NOT NULL,
    PAY_PRD_END     DATE,
    EE_AMT          NUMERIC(12,2),
    ER_AMT          NUMERIC(12,2),
    SALARY_AMT      NUMERIC(12,2),
    EE_RATE         NUMERIC(6,4),
    ER_RATE         NUMERIC(6,4),
    EMPLOYER_CD     VARCHAR(8),
    BATCH_NBR       VARCHAR(12),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_DPTMBDP0 PRIMARY KEY (MBR_ID, DEPOSIT_DT)
);

-- ── MDPMBPC0 — Service Purchase Credit Master ──────────────────────────
-- Tracks approved service purchase contracts (military, prior govt, leave).
-- Source: Data Assessment Level #5 (Service Credit History)
CREATE TABLE MDPMBPC0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    SPC_SEQ         SMALLINT        NOT NULL,
    PURCHASE_TYPE   VARCHAR(20),                    -- MILITARY, PRIOR_GOVT, LOA, REDEPOSIT
    SVC_YEARS       NUMERIC(8,4),
    COST_AMT        NUMERIC(12,2),
    PAID_AMT        NUMERIC(12,2),
    BALANCE_AMT     NUMERIC(12,2),
    STATUS_CD       CHAR(1),                        -- P=Pending, A=Approved, C=Complete, D=Denied
    APPROVED_DT     DATE,
    COMPLETE_DT     DATE,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPMBPC0 PRIMARY KEY (MBR_ID, SPC_SEQ)
);

-- ── MDPMBPP0 — SPC Payment History ─────────────────────────────────────
-- Payment detail for service purchase credit installments.
-- Source: Data Assessment Level #5 (Service Credit History)
CREATE TABLE MDPMBPP0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    SPC_SEQ         SMALLINT        NOT NULL,
    PMT_SEQ         SMALLINT        NOT NULL,
    PMT_DT          DATE,
    PMT_AMT         NUMERIC(12,2),
    PMT_METHOD      VARCHAR(10),                    -- CHECK, ACH, ROLLOVER
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPMBPP0 PRIMARY KEY (MBR_ID, SPC_SEQ, PMT_SEQ)
);

-- ── ANPBBMR0 — Master Control History ──────────────────────────────────
-- Benefit finalization audit trail. Records each step of benefit
-- calculation review and approval before ANPMBMR0 record creation.
-- Source: Data Assessment Level #6 (Member Benefit History)
CREATE TABLE ANPBBMR0 (
    CONTROL_ID      SERIAL          NOT NULL,
    MBR_ID          VARCHAR(12)     NOT NULL,
    ANNUITY_NBR     VARCHAR(12),
    ACTION_CD       VARCHAR(10),                    -- CALC, REVIEW, APPROVE, FINALIZE, REJECT
    ACTION_DT       TIMESTAMP,
    ACTION_USER     VARCHAR(20),
    CALC_HAS_AMT    NUMERIC(12,2),
    CALC_BENEFIT    NUMERIC(12,2),
    CALC_SVC_YRS    NUMERIC(8,4),
    NOTES           VARCHAR(200),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_ANPBBMR0 PRIMARY KEY (CONTROL_ID)
);

-- ── MDPMBRP0 — Pending Refund ──────────────────────────────────────────
-- Tracks refund requests in progress (before completion).
-- Source: Data Assessment Level #6 (Member Benefit History)
CREATE TABLE MDPMBRP0 (
    REFUND_ID       SERIAL          NOT NULL,
    MBR_ID          VARCHAR(12)     NOT NULL,
    REQUEST_DT      DATE,
    EE_BALANCE      NUMERIC(12,2),                  -- Employee contribution balance
    INTEREST_AMT    NUMERIC(12,2),
    TOTAL_AMT       NUMERIC(12,2),
    STATUS_CD       CHAR(1),                        -- P=Pending, A=Approved, D=Denied, C=Complete
    APPROVED_DT     DATE,
    PAID_DT         DATE,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPMBRP0 PRIMARY KEY (REFUND_ID)
);

-- ── MDPMBRR0 — Refund Master (Completed) ───────────────────────────────
-- Archive of completed refunds. Member removed from MDPMBMR0 → MDPMBTM0.
-- Source: Data Assessment Level #6 (Member Benefit History)
CREATE TABLE MDPMBRR0 (
    REFUND_ID       SERIAL          NOT NULL,
    MBR_ID          VARCHAR(12)     NOT NULL,
    REFUND_DT       DATE,
    EE_AMT          NUMERIC(12,2),
    INTEREST_AMT    NUMERIC(12,2),
    TOTAL_AMT       NUMERIC(12,2),
    CHECK_NBR       VARCHAR(20),
    ROLLOVER_FLG    CHAR(1)         DEFAULT 'N',
    ROLLOVER_DEST   VARCHAR(60),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_MDPMBRR0 PRIMARY KEY (REFUND_ID)
);

-- ── ANPPYTR0 — Payment Transactions ────────────────────────────────────
-- Monthly benefit disbursement records for active annuitants.
-- Source: Data Assessment Level #6 (Member Benefit History)
CREATE TABLE ANPPYTR0 (
    ANNUITY_NBR     VARCHAR(12)     NOT NULL,
    PAY_DT          DATE            NOT NULL,
    GROSS_AMT       NUMERIC(12,2),
    FED_TAX         NUMERIC(12,2),
    STATE_TAX       NUMERIC(12,2),
    HEALTH_DED      NUMERIC(12,2),                  -- PERACare deduction
    OTHER_DED       NUMERIC(12,2),
    NET_AMT         NUMERIC(12,2),
    CHECK_NBR       VARCHAR(20),
    PAY_METHOD      VARCHAR(10),                    -- ACH, CHECK
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_ANPPYTR0 PRIMARY KEY (ANNUITY_NBR, PAY_DT)
);

-- ── PCPMSTR0 — PERACare Master ─────────────────────────────────────────
-- Health insurance enrollment for PERA retirees (PERACare program).
-- Source: Data Assessment Level #8 (PERACare)
CREATE TABLE PCPMSTR0 (
    ANNUITY_NBR     VARCHAR(12)     NOT NULL,
    PLAN_CD         VARCHAR(10)     NOT NULL,       -- UHC_ADVG, KAISER_HMO, DELTA_DENTAL, etc.
    COVERAGE_CD     CHAR(1),                        -- S=Single, F=Family, C=Couple
    EFF_DT          DATE,
    TERM_DT         DATE,
    PREMIUM_AMT     NUMERIC(10,2),                  -- Monthly premium
    SUBSIDY_AMT     NUMERIC(10,2),                  -- PERA subsidy amount
    MEMBER_AMT      NUMERIC(10,2),                  -- Member-paid amount (deducted from benefit)
    STATUS_CD       CHAR(1),                        -- A=Active, T=Terminated, P=Pending
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_PCPMSTR0 PRIMARY KEY (ANNUITY_NBR, PLAN_CD)
);

-- ── PCPPHST0 — PERACare Payment History ────────────────────────────────
-- Monthly premium payment records for PERACare enrollees.
-- Source: Data Assessment Level #8 (PERACare)
CREATE TABLE PCPPHST0 (
    ANNUITY_NBR     VARCHAR(12)     NOT NULL,
    PAY_DT          DATE            NOT NULL,
    PLAN_CD         VARCHAR(10),
    PREMIUM_AMT     NUMERIC(10,2),
    SUBSIDY_AMT     NUMERIC(10,2),
    MEMBER_AMT      NUMERIC(10,2),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_PCPPHST0 PRIMARY KEY (ANNUITY_NBR, PAY_DT)
);

-- ── DPPBNMR0 — DPS Beneficiary ─────────────────────────────────────────
-- Beneficiary designations for DPS members (parallel to MDPBNMR0).
-- Source: Data Assessment Level #1 (Demographics)
CREATE TABLE DPPBNMR0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    BENEF_SEQ       SMALLINT        NOT NULL,
    BENEF_NM        VARCHAR(60),
    BENEF_SSN       VARCHAR(11),
    BENEF_DOB       DATE,
    BENEF_REL       VARCHAR(20),                    -- Spouse, Child, Parent, Other
    BENEF_PCT       NUMERIC(5,2),
    PRIMARY_FLG     CHAR(1)         DEFAULT 'Y',
    EFF_DT          DATE,
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_DPPBNMR0 PRIMARY KEY (MBR_ID, BENEF_SEQ)
);

-- ── DPPMGMR0 — DPS Merger Master ───────────────────────────────────────
-- Tracks DPS members affected by the 2010 DPS-PERA merger.
-- Records the merger date and any benefit/service credit adjustments.
-- Source: Data Assessment Level #2 (Employment History)
CREATE TABLE DPPMGMR0 (
    MBR_ID          VARCHAR(12)     NOT NULL,
    MERGER_DT       DATE            NOT NULL DEFAULT '2010-01-01',
    PRE_MERGER_SVC  NUMERIC(8,4),                   -- Service credit before merger
    POST_MERGER_SVC NUMERIC(8,4),                   -- Service credit after merger
    ADJUSTMENT_CD   VARCHAR(10),                    -- NONE, SVC_ADJ, RATE_ADJ
    NOTES           VARCHAR(200),
    LAST_UPD_DT     TIMESTAMP,
    CONSTRAINT PK_DPPMGMR0 PRIMARY KEY (MBR_ID)
);

-- ============================================================================
-- INDEXES for common query patterns
-- ============================================================================
CREATE INDEX IDX_MDPMBMR0_SSN ON MDPMBMR0(SSN);
CREATE INDEX IDX_MDPMBMR0_STATUS ON MDPMBMR0(STATUS_CD);
CREATE INDEX IDX_DPPMBMR0_SSN ON DPPMBMR0(SSN);
CREATE INDEX IDX_DCPSTMR0_SSN ON DCPSTMR0(SSN);
CREATE INDEX IDX_CMPTIER0_MBR ON CMPTIER0(MBR_ID);
CREATE INDEX IDX_SALARY_ANNUAL_MBR ON SALARY_ANNUAL(MBR_ID);
CREATE INDEX IDX_MDPHASC0_MBR ON MDPHASC0(MBR_ID);
CREATE INDEX IDX_ANPMBMR0_MBR ON ANPMBMR0(MBR_ID);
CREATE INDEX IDX_CONTRIB_MBR ON CONTRIBUTION_HIST(MBR_ID);
CREATE INDEX IDX_ENTITY_SSN ON ENTITY(SSN);
CREATE INDEX IDX_MDPMBDT0_MBR ON MDPMBDT0(MBR_ID);
CREATE INDEX IDX_DPPMBDT0_MBR ON DPPMBDT0(MBR_ID);
CREATE INDEX IDX_ACPDPMA0_DIV ON ACPDPMA0(DIVISION_CD);
CREATE INDEX IDX_DCPSTMC0_ENTITY ON DCPSTMC0(ENTITY_ID);
CREATE INDEX IDX_MDPMBTM0_SSN ON MDPMBTM0(SSN);
CREATE INDEX IDX_MDTMBDP0_MBR ON MDTMBDP0(MBR_ID);
CREATE INDEX IDX_DPTMBDP0_MBR ON DPTMBDP0(MBR_ID);
CREATE INDEX IDX_MDPMBPC0_MBR ON MDPMBPC0(MBR_ID);
CREATE INDEX IDX_MDPMBPP0_MBR ON MDPMBPP0(MBR_ID);
CREATE INDEX IDX_ANPBBMR0_MBR ON ANPBBMR0(MBR_ID);
CREATE INDEX IDX_MDPMBRP0_MBR ON MDPMBRP0(MBR_ID);
CREATE INDEX IDX_MDPMBRR0_MBR ON MDPMBRR0(MBR_ID);
CREATE INDEX IDX_ANPPYTR0_ANNUITY ON ANPPYTR0(ANNUITY_NBR);
CREATE INDEX IDX_PCPMSTR0_ANNUITY ON PCPMSTR0(ANNUITY_NBR);
CREATE INDEX IDX_PCPPHST0_ANNUITY ON PCPPHST0(ANNUITY_NBR);
CREATE INDEX IDX_DPPBNMR0_MBR ON DPPBNMR0(MBR_ID);
CREATE INDEX IDX_DPPMGMR0_MBR ON DPPMGMR0(MBR_ID);
