-- ============================================================================
-- DERP Legacy Database Schema — 001_legacy_schema.sql
-- Denver Employees Retirement Plan
-- ============================================================================
-- This schema simulates a real-world legacy pension administration database
-- that has evolved over 25+ years. Expect:
--   - Inconsistent naming (abbreviated vs. full, _CD vs. _CODE vs. _FLG)
--   - Redundant data across tables (salary in SALARY_HIST and MEMBER_MASTER)
--   - Nullable fields that logically shouldn't be nullable
--   - Overloaded status codes with ambiguous meaning
--   - Missing foreign keys in places (intentional)
--   - Columns added in different eras with different conventions
--   - Mixed date handling (DATE vs. TIMESTAMP)
--
-- Created: Day 1 Step 1.1
-- ============================================================================

-- ── DEPARTMENT_REF ─────────────────────────────────────────────────────────
-- Department reference data (~30 Denver city departments)
-- Original table from 1995 system rollout. Minimal columns.
CREATE TABLE DEPARTMENT_REF (
    DEPT_CD         VARCHAR(5)      NOT NULL,
    DEPT_NAME       VARCHAR(60)     NOT NULL,
    DEPT_SHORT_NM   VARCHAR(15),                    -- Added 2003 for report headers
    ACTIVE_FLG      CHAR(1)         DEFAULT 'Y',    -- Y/N but never enforced
    CREATE_DT       DATE,                           -- Nullable because early records predate tracking
    CONSTRAINT PK_DEPARTMENT PRIMARY KEY (DEPT_CD)
);

-- ── POSITION_REF ───────────────────────────────────────────────────────────
-- Position/classification reference data (~50 positions)
-- Pay grades G04 through G18 with salary ranges.
-- MIN_SALARY and MAX_SALARY are CURRENT ranges; historical ranges not tracked.
CREATE TABLE POSITION_REF (
    POS_CD          VARCHAR(8)      NOT NULL,
    POS_TITLE       VARCHAR(60)     NOT NULL,
    PAY_GRADE       VARCHAR(4),                     -- G04-G18; nullable for legacy records
    EXEMPT_FLG      CHAR(1),                        -- Y/N FLSA exempt; nullable
    MIN_SALARY      NUMERIC(12,2),
    MAX_SALARY      NUMERIC(12,2),
    EFF_DT          DATE,                           -- When this position was established
    -- Note: no END_DT — positions are never formally deactivated, just stop being used
    CONSTRAINT PK_POSITION PRIMARY KEY (POS_CD)
);

-- ── MEMBER_MASTER ──────────────────────────────────────────────────────────
-- Core member table. THE most important table. ~10,000 rows.
-- This table has grown organically over 25 years. Note the mix of:
--   - Original 1995 columns (abbreviated names, lax nullability)
--   - 2003 additions (email, cell phone — different naming convention)
--   - 2010 additions (contribution rates stored on member — redundant with plan rules)
--   - STATUS_CD is overloaded: A=Active, R=Retired, T=Terminated, D=Deferred,
--     X=Deceased, S=Suspended (used briefly in 2008, then abandoned)
CREATE TABLE MEMBER_MASTER (
    MBR_ID          VARCHAR(10)     NOT NULL,       -- M-NNNNNN format
    SSN             VARCHAR(11),                    -- Some have dashes, some don't (legacy inconsistency)
    FIRST_NM        VARCHAR(30),                    -- Yes, nullable. Don't ask.
    LAST_NM         VARCHAR(40),
    MIDDLE_NM       VARCHAR(30),
    SUFFIX          VARCHAR(10),                    -- Jr, Sr, III, etc.
    DOB             DATE,                           -- Nullable — a few records from 1995 migration are missing DOB
    GENDER_CD       CHAR(1),                        -- M/F — expanded options not yet implemented

    -- Address (no normalization, no address table — just fields on the member)
    ADDR_LINE1      VARCHAR(100),
    ADDR_LINE2      VARCHAR(100),
    CITY            VARCHAR(40),
    STATE_CD        CHAR(2),
    ZIP_CD          VARCHAR(10),                    -- VARCHAR because some have ZIP+4 with dash

    -- Contact — three different eras of additions
    HOME_PHONE      VARCHAR(20),                    -- Original 1995
    WORK_PHONE      VARCHAR(20),                    -- Original 1995
    EMAIL_ADDR      VARCHAR(80),                    -- Added 2003 (note: ADDR not ADDRESS)
    CELL_PHONE      VARCHAR(20),                    -- Added 2008 (note: PHONE not PH)

    -- Employment core
    HIRE_DT         DATE,                           -- Original hire date
    TERM_DT         DATE,                           -- Termination/separation date
    REHIRE_DT       DATE,                           -- Most recent rehire (if applicable)
    ORIG_HIRE_DT    DATE,                           -- Original hire for rehires (redundant with HIRE_DT for non-rehires)

    -- Plan membership
    TIER_CD         SMALLINT,                       -- 1, 2, or 3 (no CHECK constraint — legacy)
    STATUS_CD       CHAR(1)         NOT NULL,       -- A/R/T/D/X/S — overloaded
    DEPT_CD         VARCHAR(5),                     -- Current department — FK to DEPARTMENT_REF (not enforced)
    POS_CD          VARCHAR(8),                     -- Current position — FK to POSITION_REF (not enforced)
    ANNUAL_SALARY   NUMERIC(12,2),                  -- Current annual salary (redundant with SALARY_HIST)

    -- Contribution rates (stored per member — redundant with plan rules, but that's legacy for you)
    EMPL_CONTRIB_RT NUMERIC(6,4),                   -- Employee contribution rate (e.g., 0.0845)
    EMPR_CONTRIB_RT NUMERIC(6,4),                   -- Employer contribution rate (e.g., 0.1795)

    -- Personal
    MARITAL_STATUS  CHAR(1),                        -- M/S/D/W — affects spousal consent rules

    -- Derived dates (should be computed, but stored because "it's faster")
    RET_ELIG_DT     DATE,                           -- Estimated retirement eligibility date
    VEST_DT         DATE,                           -- Date member became vested (hire + 5 years)

    -- Audit
    CREATE_DT       TIMESTAMP,
    CREATE_USER     VARCHAR(20),
    -- Note: no UPDATE_DT or UPDATE_USER — a known gap in the legacy system

    CONSTRAINT PK_MEMBER PRIMARY KEY (MBR_ID)
    -- Note: no FK to DEPARTMENT_REF or POSITION_REF (intentional legacy gap)
    -- Note: no CHECK on STATUS_CD or TIER_CD (intentional)
    -- Note: SSN has no UNIQUE constraint (yes, there are duplicates in production)
);

-- Index on SSN for lookups (but not unique — see note above)
CREATE INDEX IDX_MEMBER_SSN ON MEMBER_MASTER (SSN);
CREATE INDEX IDX_MEMBER_STATUS ON MEMBER_MASTER (STATUS_CD);
CREATE INDEX IDX_MEMBER_TIER ON MEMBER_MASTER (TIER_CD);
CREATE INDEX IDX_MEMBER_DEPT ON MEMBER_MASTER (DEPT_CD);
CREATE INDEX IDX_MEMBER_HIRE ON MEMBER_MASTER (HIRE_DT);

-- ── EMPLOYMENT_HIST ────────────────────────────────────────────────────────
-- Employment events: hire, transfer, promotion, separation, rehire.
-- No surrogate key — composite key of (MBR_ID, EVENT_DT, EVENT_TYPE).
-- This means two events on the same date of the same type will collide.
-- In practice it hasn't happened. (Famous last words.)
CREATE TABLE EMPLOYMENT_HIST (
    MBR_ID          VARCHAR(10)     NOT NULL,
    EVENT_TYPE      VARCHAR(10)     NOT NULL,       -- HIRE, PROMO, XFER, SEP, REHIRE, LOA, RECALL
    EVENT_DT        DATE            NOT NULL,
    FROM_DEPT       VARCHAR(5),                     -- Null for initial hire
    TO_DEPT         VARCHAR(5),
    FROM_POS        VARCHAR(8),                     -- Null for initial hire
    TO_POS          VARCHAR(8),
    FROM_SALARY     NUMERIC(12,2),                  -- Null for initial hire
    TO_SALARY       NUMERIC(12,2),
    SEP_REASON      VARCHAR(20),                    -- RETIRE, RESIGN, TERM, DEATH, DISAB
    NOTES           VARCHAR(200),                   -- Free text — sometimes useful, often not

    CONSTRAINT PK_EMPL_HIST PRIMARY KEY (MBR_ID, EVENT_DT, EVENT_TYPE)
    -- Note: no FK to MEMBER_MASTER (legacy gap — data loaded by batch process that skips FK checks)
);

CREATE INDEX IDX_EMPL_HIST_MBR ON EMPLOYMENT_HIST (MBR_ID);
CREATE INDEX IDX_EMPL_HIST_DT ON EMPLOYMENT_HIST (EVENT_DT);

-- ── SALARY_HIST ────────────────────────────────────────────────────────────
-- Per-pay-period salary records. Biweekly for recent active members,
-- monthly summaries for older/bulk records.
-- ~2 million rows (750 pay periods × ~3000 active + monthly for rest).
--
-- This is the primary source for AMS (Average Monthly Salary) calculation.
-- CRITICAL: leave_payout_amount is a SEPARATE column — not merged into base pay.
-- The rules engine must add it conditionally based on hire date.
CREATE TABLE SALARY_HIST (
    MBR_ID          VARCHAR(10)     NOT NULL,
    PAY_PRD_END_DT  DATE            NOT NULL,       -- End date of pay period
    PAY_PRD_NBR     SMALLINT,                       -- Pay period number within year (1-26 biweekly; null for monthly)
    BASE_PAY        NUMERIC(12,2),                  -- Base salary for this period
    OT_PAY          NUMERIC(12,2),                  -- Overtime (not pensionable for DERP)
    PENS_PAY        NUMERIC(12,2),                  -- Pensionable compensation (usually = BASE_PAY)
    SUPPL_PAY       NUMERIC(12,2),                  -- Supplemental pay (stipends, etc.)
    LV_PAYOUT_AMT   NUMERIC(12,2),                  -- Leave payout amount (CRITICAL: separate field)
    LV_PAYOUT_TYPE  VARCHAR(10),                    -- SICK_VAC, PTO, null — type determines eligibility
    FURLOUGH_HRS    NUMERIC(8,2),                   -- Furlough hours in period (2009-2010 era, mostly null)
    FURLOUGH_DEDUCT NUMERIC(12,2),                  -- Furlough pay deduction (matches hours)
    ANNL_SALARY     NUMERIC(12,2),                  -- Annual salary at time of this record (redundant, helpful)
    PROC_DT         DATE,                           -- When payroll processed this record

    -- No surrogate PK — composite on member + period end date
    -- Problem: monthly records use 28th as proxy, biweekly records use actual Friday
    -- So a member could have both a biweekly and monthly record on the same date
    CONSTRAINT PK_SALARY PRIMARY KEY (MBR_ID, PAY_PRD_END_DT)
);

CREATE INDEX IDX_SALARY_MBR ON SALARY_HIST (MBR_ID);
CREATE INDEX IDX_SALARY_DT ON SALARY_HIST (PAY_PRD_END_DT);
CREATE INDEX IDX_SALARY_MBR_DT ON SALARY_HIST (MBR_ID, PAY_PRD_END_DT);

-- ── CONTRIBUTION_HIST ──────────────────────────────────────────────────────
-- Employee and employer contribution records with running balances.
-- Redundant with SALARY_HIST (contributions can be derived from salary × rate)
-- but maintained separately because "that's how it's always been."
-- Running balances (EMPL_BAL, EMPR_BAL) sometimes drift due to rounding.
CREATE TABLE CONTRIBUTION_HIST (
    MBR_ID          VARCHAR(10)     NOT NULL,
    CONTRIB_DT      DATE            NOT NULL,       -- Contribution date (matches pay period)
    EMPL_CONTRIB    NUMERIC(12,2),                  -- Employee contribution this period
    EMPR_CONTRIB    NUMERIC(12,2),                  -- Employer contribution this period
    PENS_SALARY     NUMERIC(12,2),                  -- Pensionable salary basis (redundant with SALARY_HIST)
    EMPL_BAL        NUMERIC(14,2),                  -- Running employee balance (sometimes drifts)
    EMPR_BAL        NUMERIC(14,2),                  -- Running employer balance
    INTEREST_BAL    NUMERIC(14,2),                  -- Accrued interest (rarely updated correctly)
    FISCAL_YR       SMALLINT,                       -- Fiscal year (July-June)
    QTR             SMALLINT,                       -- Calendar quarter 1-4
    PROC_DT         DATE,                           -- Processing date

    CONSTRAINT PK_CONTRIBUTION PRIMARY KEY (MBR_ID, CONTRIB_DT)
);

CREATE INDEX IDX_CONTRIB_MBR ON CONTRIBUTION_HIST (MBR_ID);
CREATE INDEX IDX_CONTRIB_FY ON CONTRIBUTION_HIST (FISCAL_YR);

-- ── BENEFICIARY ────────────────────────────────────────────────────────────
-- Beneficiary designations. A member can have multiple beneficiaries.
-- Superseding logic: new designations should set old ones to STATUS_CD='S'
-- (superseded), but this doesn't always happen. Sometimes there are multiple
-- "A" (active) records and you have to use EFF_DT to determine which is current.
CREATE TABLE BENEFICIARY (
    BENE_ID         INTEGER         NOT NULL,
    MBR_ID          VARCHAR(10)     NOT NULL,
    BENE_FIRST_NM   VARCHAR(30),
    BENE_LAST_NM    VARCHAR(40),                    -- Null for estate designations
    BENE_DOB        DATE,                           -- Null for estate; important for J&S calculations
    BENE_RELATION   VARCHAR(15),                    -- SPOUSE, CHILD, PARENT, SIBLING, ESTATE, OTHER, FORMER_SPOUSE
    ALLOC_PCT       NUMERIC(5,2),                   -- Allocation percentage — SHOULD total 100% across active benes
    BENE_TYPE       CHAR(1),                        -- P=Primary, C=Contingent
    EFF_DT          DATE,                           -- Effective date of this designation
    STATUS_CD       CHAR(1),                        -- A=Active, S=Superseded, X=Deceased
    SPOUSE_CONSENT  CHAR(1),                        -- Y/N — required for married members not electing spouse
    CONSENT_DT      DATE,
    CREATE_DT       TIMESTAMP,
    CREATE_USER     VARCHAR(20),

    CONSTRAINT PK_BENEFICIARY PRIMARY KEY (BENE_ID)
    -- Note: no FK to MEMBER_MASTER
    -- Note: no CHECK that ALLOC_PCT between 0 and 100 (allows data quality issues)
);

CREATE INDEX IDX_BENE_MBR ON BENEFICIARY (MBR_ID);
CREATE INDEX IDX_BENE_STATUS ON BENEFICIARY (MBR_ID, STATUS_CD);

-- ── SVC_CREDIT ─────────────────────────────────────────────────────────────
-- Service credit records by type.
-- CRITICAL design decision: credit_type (SVC_TYPE) is a FIRST-CLASS field.
-- The rules engine needs to distinguish EARNED from PURCHASED service in
-- different contexts:
--   - BENEFIT CALCULATION uses TOTAL (earned + purchased)
--   - RULE OF 75/85 and IPR use EARNED ONLY (purchased excluded)
-- The INCL_BENEFIT, INCL_ELIG, INCL_IPR flags make this queryable.
CREATE TABLE SVC_CREDIT (
    MBR_ID          VARCHAR(10)     NOT NULL,
    SVC_TYPE        VARCHAR(10)     NOT NULL,       -- EMPL, PURCH, MILITARY, LEAVE
    SVC_START_DT    DATE,
    SVC_END_DT      DATE,                           -- Null for ongoing employment
    YEARS_CREDIT    NUMERIC(8,2),                   -- Decimal years of credit
    MONTHS_CREDIT   INTEGER,                        -- Integer months (redundant with YEARS_CREDIT)

    -- Purchase-specific fields (null for EMPL type)
    PURCH_COST      NUMERIC(12,2),                  -- Total cost of purchase
    PURCH_DT        DATE,                           -- Date purchase completed/initiated
    PURCH_STATUS    VARCHAR(10),                    -- PAID, PARTIAL, PENDING
    PURCH_TYPE      VARCHAR(15),                    -- PRIOR_GOVT, MILITARY, LOA_BUYBACK

    -- Inclusion flags — CRITICAL for correct rule application
    INCL_BENEFIT    CHAR(1)         DEFAULT 'Y',    -- Include in benefit calculation? (Y for all types)
    INCL_ELIG       CHAR(1)         DEFAULT 'Y',    -- Include in eligibility (Rule of 75/85)? (N for purchased)
    INCL_IPR        CHAR(1)         DEFAULT 'Y',    -- Include in IPR calculation? (N for purchased)

    -- Audit
    CREATE_DT       TIMESTAMP,
    VERIFY_USER     VARCHAR(20),                    -- Who verified this record (different from CREATE_USER — another convention)
    NOTES           VARCHAR(200),

    -- Composite PK — assumes one record per type per member per start date
    CONSTRAINT PK_SVC_CREDIT PRIMARY KEY (MBR_ID, SVC_TYPE, SVC_START_DT)
);

CREATE INDEX IDX_SVC_MBR ON SVC_CREDIT (MBR_ID);
CREATE INDEX IDX_SVC_TYPE ON SVC_CREDIT (SVC_TYPE);

-- ── DRO_MASTER ─────────────────────────────────────────────────────────────
-- Domestic Relations Orders.
-- Stores court orders that divide a member's pension benefit with a former spouse.
-- CRITICAL fields: marriage_date, divorce_date, division_method, division_value.
-- The marital fraction = service_during_marriage / total_service.
CREATE TABLE DRO_MASTER (
    DRO_ID          INTEGER         NOT NULL,
    MBR_ID          VARCHAR(10)     NOT NULL,
    COURT_ORDER_DT  DATE,                           -- Date of court order
    COURT_NAME      VARCHAR(60),
    CASE_NBR        VARCHAR(30),                    -- Court case number

    -- Alternate payee (former spouse)
    ALT_PAYEE_NM    VARCHAR(80),                    -- Full name in one field (not normalized)
    ALT_PAYEE_DOB   DATE,
    ALT_PAYEE_RELATION VARCHAR(15),                 -- Always FORMER_SPOUSE but stored anyway
    -- No ALT_PAYEE_SSN in this schema (PII concern — stored in separate secure system)

    -- Marriage/divorce dates — needed for marital fraction calculation
    MARRIAGE_DT     DATE,
    DIVORCE_DT      DATE,

    -- Division terms
    DIV_METHOD      VARCHAR(15),                    -- PERCENTAGE, FIXED_AMOUNT
    DIV_PCT         NUMERIC(6,4),                   -- Percentage as decimal (e.g., 0.4000 = 40%)
    DIV_AMT         NUMERIC(12,2),                  -- Fixed dollar amount (used when DIV_METHOD = FIXED_AMOUNT)
    DIV_DESC        VARCHAR(200),                   -- Free-text description of division terms

    -- Processing
    STATUS_CD       VARCHAR(10),                    -- PENDING, ACTIVE, SUSPENDED, TERMINATED
    APPROVED_DT     DATE,
    APPROVED_BY     VARCHAR(20),
    CALC_MARITAL_SVC  NUMERIC(8,2),                 -- Calculated years of service during marriage
    CALC_MARITAL_FRAC NUMERIC(8,4),                 -- Calculated marital fraction

    -- Dates (note: different convention from MEMBER_MASTER — RECV_DT not RECEIVED_DATE)
    RECV_DT         DATE,                           -- Date DRO received by plan
    CREATE_DT       TIMESTAMP,
    NOTES           VARCHAR(500),                   -- Often contains legal references

    CONSTRAINT PK_DRO PRIMARY KEY (DRO_ID)
    -- Note: no FK to MEMBER_MASTER
);

CREATE INDEX IDX_DRO_MBR ON DRO_MASTER (MBR_ID);
CREATE INDEX IDX_DRO_STATUS ON DRO_MASTER (STATUS_CD);

-- ── BENEFIT_PAYMENT ────────────────────────────────────────────────────────
-- Active benefit payment records for retirees.
-- One record per member showing their current monthly payment details.
-- History of payment changes is NOT tracked here (a known gap).
CREATE TABLE BENEFIT_PAYMENT (
    MBR_ID          VARCHAR(10)     NOT NULL,
    EFF_DT          DATE            NOT NULL,       -- Effective date of this payment amount
    GROSS_BENEFIT   NUMERIC(12,2),                  -- Gross monthly benefit
    PAY_OPTION      VARCHAR(10),                    -- MAX, 100JS, 75JS, 50JS
    FED_TAX_AMT     NUMERIC(10,2),                  -- Federal tax withholding
    STATE_TAX_AMT   NUMERIC(10,2),                  -- State tax withholding
    NET_BENEFIT     NUMERIC(12,2),                  -- Net after taxes and deductions
    DRO_FLG         CHAR(1),                        -- Y/N — is benefit subject to DRO split
    DRO_DEDUCT_AMT  NUMERIC(12,2),                  -- DRO deduction amount (null if no DRO)
    IPR_AMT         NUMERIC(10,2),                  -- Insurance Premium Reimbursement amount
    IPR_TYPE        VARCHAR(15),                    -- PRE_MCARE, POST_MCARE, null
    COLA_FLG        CHAR(1),                        -- Y/N — receiving COLA adjustments
    DEATH_BEN_ELECT VARCHAR(10),                    -- 50_INST, 100_INST — death benefit installment election
    DEATH_BEN_AMT   NUMERIC(10,2),                  -- Lump-sum death benefit amount

    -- Calculation audit trail
    CALC_DT         DATE,                           -- When benefit was calculated
    CALC_USER       VARCHAR(20),                    -- Who ran the calculation

    -- Audit
    CREATE_DT       TIMESTAMP,
    STATUS_CD       CHAR(1),                        -- A=Active, S=Suspended, T=Terminated

    CONSTRAINT PK_BENEFIT PRIMARY KEY (MBR_ID, EFF_DT)
);

CREATE INDEX IDX_BENEFIT_MBR ON BENEFIT_PAYMENT (MBR_ID);
CREATE INDEX IDX_BENEFIT_STATUS ON BENEFIT_PAYMENT (STATUS_CD);

-- ── CASE_HIST ──────────────────────────────────────────────────────────────
-- Work item / case tracking. ~25,000 rows spanning 15 years.
-- Used for operational pattern analysis (Day 10).
-- Status codes are overloaded and sometimes contradictory.
CREATE TABLE CASE_HIST (
    CASE_ID         INTEGER         NOT NULL,
    MBR_ID          VARCHAR(10),                    -- Nullable for system-level cases
    CASE_TYPE       VARCHAR(15)     NOT NULL,       -- SVC_RET, EARLY_RET, REFUND, DRO, SVC_PURCH,
                                                    -- BEN_CHANGE, ADDR_CHG, DEATH, REEMPLOY
    CASE_STATUS     VARCHAR(15),                    -- OPEN, IN_REVIEW, APPROVED, DENIED, CLOSED
                                                    -- Note: CLOSED vs APPROVED distinction unclear in practice
    OPEN_DT         DATE,
    CLOSE_DT        DATE,                           -- Null for open cases; sometimes populated for OPEN cases (bug)
    ASSIGNED_TO     VARCHAR(20),                    -- Worker ID
    PRIORITY        SMALLINT,                       -- 1=High, 2=Medium, 3=Low, null=unset
    NOTES           TEXT,                           -- Added 2018 — before this, notes were in a separate system
    CREATE_DT       TIMESTAMP,
    CREATE_USER     VARCHAR(20),

    CONSTRAINT PK_CASE PRIMARY KEY (CASE_ID)
);

CREATE INDEX IDX_CASE_MBR ON CASE_HIST (MBR_ID);
CREATE INDEX IDX_CASE_STATUS ON CASE_HIST (CASE_STATUS);
CREATE INDEX IDX_CASE_TYPE ON CASE_HIST (CASE_TYPE);
CREATE INDEX IDX_CASE_OPEN ON CASE_HIST (OPEN_DT);

-- ── TRANSACTION_LOG ────────────────────────────────────────────────────────
-- Audit log with DELIBERATELY INCONSISTENT formats across eras.
-- Three distinct formats reflecting three different developers/systems:
--   Era 1 (pre-2015): Basic — just TXN_DT, TXN_TYPE, TXN_DESC, MBR_ID, USER_ID, MODULE
--   Era 2 (2015-2017): Added entity tracking — ENTITY_TYPE, ENTITY_ID, ACTION, OLD/NEW_VALUE
--   Era 3 (2018+): Added session tracking — SESSION_ID, IP_ADDR, RESULT_CD, JSON values
-- All three eras write to the same table. Columns from later eras are null in earlier records.
CREATE TABLE TRANSACTION_LOG (
    TXN_ID          SERIAL,                         -- Auto-increment (added in 2018 migration; old records backfilled)
    TXN_DT          TIMESTAMP       NOT NULL,       -- Transaction timestamp
    TXN_TYPE        VARCHAR(15),                    -- SAL_UPD, BEN_CALC, STAT_CHG, ADDR_UPD, BENE_CHG, CONTRIB
    TXN_DESC        VARCHAR(200),                   -- Era 1 free-text description (null in eras 2-3)

    -- Entity tracking (added Era 2, 2015)
    ENTITY_TYPE     VARCHAR(20),                    -- MEMBER, SALARY, BENEFIT, CASE
    ENTITY_ID       VARCHAR(20),                    -- The affected entity's ID
    ACTION          VARCHAR(15),                    -- CREATE, UPDATE, DELETE, CALCULATE

    -- Change tracking (Era 2+)
    OLD_VALUE       TEXT,                           -- Era 2: pipe-delimited. Era 3: JSON. Era 1: null.
    NEW_VALUE       TEXT,                           -- Same inconsistency as OLD_VALUE

    -- Common fields
    MBR_ID          VARCHAR(10),                    -- Affected member (null for system transactions)
    USER_ID         VARCHAR(20),                    -- Who performed the action

    -- Session tracking (added Era 3, 2018)
    SESSION_ID      VARCHAR(30),                    -- Server session ID (null before 2018)
    IP_ADDR         VARCHAR(15),                    -- Client IP address (null before 2018)

    -- Module and result
    MODULE          VARCHAR(10),                    -- PAY, BEN, ADMIN, RPT
    RESULT_CD       VARCHAR(10),                    -- SUCCESS, FAILURE, WARNING (null in Era 1, inconsistent in Era 2)

    CONSTRAINT PK_TXN_LOG PRIMARY KEY (TXN_ID)
);

CREATE INDEX IDX_TXN_DT ON TRANSACTION_LOG (TXN_DT);
CREATE INDEX IDX_TXN_MBR ON TRANSACTION_LOG (MBR_ID);
CREATE INDEX IDX_TXN_TYPE ON TRANSACTION_LOG (TXN_TYPE);

-- ============================================================================
-- NOTES ON DELIBERATE LEGACY ISSUES
-- ============================================================================
-- 1. NAMING INCONSISTENCY:
--    - MEMBER_MASTER uses _NM (FIRST_NM), BENEFICIARY uses _NM (BENE_FIRST_NM)
--    - Some tables use STATUS_CD (CHAR), DRO_MASTER uses STATUS_CD (VARCHAR)
--    - MEMBER_MASTER has CREATE_USER, CASE_HIST has CREATE_USER,
--      but SVC_CREDIT has VERIFY_USER (different audit convention)
--    - Dates: some are DATE, some are TIMESTAMP, with no clear pattern
--
-- 2. REDUNDANT DATA:
--    - ANNUAL_SALARY on MEMBER_MASTER duplicates latest SALARY_HIST
--    - PENS_SALARY on CONTRIBUTION_HIST duplicates SALARY_HIST.PENS_PAY
--    - MONTHS_CREDIT on SVC_CREDIT is derivable from YEARS_CREDIT
--    - Contribution rates on MEMBER_MASTER duplicate plan-level rules
--
-- 3. MISSING CONSTRAINTS:
--    - No FK from EMPLOYMENT_HIST → MEMBER_MASTER
--    - No FK from SALARY_HIST → MEMBER_MASTER
--    - No FK from BENEFICIARY → MEMBER_MASTER
--    - No CHECK on TIER_CD (1, 2, 3)
--    - No CHECK on STATUS_CD values
--    - No UNIQUE on SSN
--    - ALLOC_PCT has no range check (allows > 100 or < 0)
--
-- 4. NULLABLE FIELDS THAT SHOULDN'T BE:
--    - MEMBER_MASTER.DOB (how do you calculate age without DOB?)
--    - MEMBER_MASTER.FIRST_NM (yes, really)
--    - SALARY_HIST.BASE_PAY (should always have a value)
--    - SVC_CREDIT.YEARS_CREDIT (the whole point of the table)
--
-- 5. OVERLOADED STATUS CODES:
--    - MEMBER_MASTER.STATUS_CD: A/R/T/D/X/S where S was abandoned
--    - CASE_HIST.CASE_STATUS: CLOSED vs APPROVED distinction unclear
--    - DRO_MASTER.STATUS_CD: uses VARCHAR while others use CHAR
--
-- 6. ERA-DEPENDENT FORMATS:
--    - TRANSACTION_LOG has three distinct column usage patterns (pre-2015,
--      2015-2017, 2018+) all in the same table
--    - SSN sometimes has dashes, sometimes doesn't
--    - OLD_VALUE/NEW_VALUE: sometimes pipe-delimited, sometimes JSON
-- ============================================================================
