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
