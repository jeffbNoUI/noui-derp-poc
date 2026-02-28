-- ============================================================================
-- DERP Clean Domain Schema — 100_domain_schema.sql
-- Denver Employees Retirement Plan — NoUI Connector Domain Model
-- ============================================================================
-- The clean domain model that the Data Connector exposes to upstream services
-- (Intelligence, Relevance, Workspace). No upstream service queries legacy
-- tables directly; the Connector translates the messy legacy schema
-- (001_legacy_schema.sql) into these well-typed, constrained domain entities.
--
-- Design principles:
--   - Readable names (no abbreviations)
--   - Explicit enum-style CHECK constraints on every status/type column
--   - SERIAL or BIGSERIAL PKs (no composite keys)
--   - TIMESTAMPTZ for all timestamps (timezone-aware)
--   - Foreign keys enforced (unlike the legacy schema)
--   - Proper NOT NULL where business logic demands a value
--   - Indexes tuned for known query patterns (AMS window, eligibility, audit)
--
-- Depends on: 006_audit_schema.sql (audit_log table — referenced, not recreated)
-- Consumed by: connector service Go code, integration tests
-- ============================================================================


-- ============================================================================
-- ENUM-LIKE DOMAINS (PostgreSQL CHECK constraints, not CREATE TYPE, so the
-- schema stays compatible with pg_dump --clean without DROP TYPE conflicts)
-- ============================================================================


-- ── member ──────────────────────────────────────────────────────────────────
-- Core identity entity. One row per plan member. Maps from MEMBER_MASTER.
-- Computed fields (age, computed_tier, is_vested) live in the Connector
-- service layer, not in the table — the schema stores source-of-truth data.
CREATE TABLE member (
    member_id           SERIAL          PRIMARY KEY,
    legacy_member_id    VARCHAR(10)     NOT NULL UNIQUE,        -- M-NNNNNN from MEMBER_MASTER.MBR_ID
    ssn_masked          VARCHAR(15),                            -- ***-**-NNNN (full SSN never leaves legacy)
    first_name          VARCHAR(50)     NOT NULL,
    last_name           VARCHAR(50)     NOT NULL,
    middle_name         VARCHAR(50),
    suffix              VARCHAR(10),
    date_of_birth       DATE            NOT NULL,
    gender              VARCHAR(10)     CHECK (gender IN ('male', 'female')),

    -- Address
    address_line1       VARCHAR(100),
    address_line2       VARCHAR(100),
    city                VARCHAR(50),
    state_code          CHAR(2),
    zip_code            VARCHAR(10),

    -- Contact
    home_phone          VARCHAR(20),
    work_phone          VARCHAR(20),
    cell_phone          VARCHAR(20),
    email               VARCHAR(120),

    -- Employment core
    hire_date           DATE            NOT NULL,
    termination_date    DATE,
    rehire_date         DATE,
    original_hire_date  DATE,

    -- Plan membership
    tier                SMALLINT        NOT NULL CHECK (tier IN (1, 2, 3)),
    status              VARCHAR(15)     NOT NULL
                        CHECK (status IN ('active', 'retired', 'terminated', 'deferred', 'deceased')),
    department_code     VARCHAR(10),
    department_name     VARCHAR(80),
    position_code       VARCHAR(10),
    position_title      VARCHAR(80),
    current_annual_salary   NUMERIC(12,2),

    -- Contribution rates
    employee_contribution_rate  NUMERIC(6,4),       -- e.g. 0.0845
    employer_contribution_rate  NUMERIC(6,4),       -- e.g. 0.1795

    -- Personal
    marital_status      VARCHAR(10)     CHECK (marital_status IN ('married', 'single', 'divorced', 'widowed')),

    -- Derived dates (stored from legacy; Connector re-validates)
    retirement_eligibility_date DATE,
    vesting_date        DATE,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_member_status ON member (status);
CREATE INDEX idx_member_tier ON member (tier);
CREATE INDEX idx_member_hire_date ON member (hire_date);
CREATE INDEX idx_member_department ON member (department_code);
CREATE INDEX idx_member_last_name ON member (last_name);


-- ── employment_event ────────────────────────────────────────────────────────
-- One record per career event (hire, promotion, transfer, separation, etc.).
-- Maps from EMPLOYMENT_HIST. Surrogate PK replaces the fragile composite key.
CREATE TABLE employment_event (
    event_id            SERIAL          PRIMARY KEY,
    member_id           INTEGER         NOT NULL REFERENCES member (member_id),
    event_type          VARCHAR(20)     NOT NULL
                        CHECK (event_type IN (
                            'hire', 'promotion', 'transfer', 'separation',
                            'rehire', 'reclassification', 'leave_of_absence', 'recall'
                        )),
    effective_date      DATE            NOT NULL,
    from_department_code VARCHAR(10),
    to_department_code  VARCHAR(10),
    from_position_code  VARCHAR(10),
    to_position_code    VARCHAR(10),
    from_salary         NUMERIC(12,2),
    to_salary           NUMERIC(12,2),
    separation_reason   VARCHAR(25)
                        CHECK (separation_reason IS NULL OR separation_reason IN (
                            'retirement', 'resignation', 'termination',
                            'death', 'leave_of_absence', 'disability'
                        )),
    notes               TEXT,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employment_event_member ON employment_event (member_id);
CREATE INDEX idx_employment_event_date ON employment_event (effective_date);
CREATE INDEX idx_employment_event_type ON employment_event (member_id, event_type);


-- ── salary_record ───────────────────────────────────────────────────────────
-- Per-pay-period compensation. Maps from SALARY_HIST.
-- The primary source for AMS (Average Monthly Salary) calculation.
-- Indexes are tuned for the consecutive-month window queries that the AMS
-- engine runs (36-month for Tiers 1/2, 60-month for Tier 3).
CREATE TABLE salary_record (
    salary_record_id    SERIAL          PRIMARY KEY,
    member_id           INTEGER         NOT NULL REFERENCES member (member_id),
    pay_period_end_date DATE            NOT NULL,
    pay_period_number   SMALLINT,                               -- 1-26 for biweekly; NULL for monthly
    base_pay            NUMERIC(12,2)   NOT NULL,
    overtime_pay        NUMERIC(12,2)   NOT NULL DEFAULT 0,     -- Not pensionable for DERP
    pensionable_pay     NUMERIC(12,2)   NOT NULL,
    supplemental_pay    NUMERIC(12,2)   NOT NULL DEFAULT 0,
    leave_payout_amount NUMERIC(12,2),                          -- CRITICAL: separate from base pay
    leave_payout_type   VARCHAR(15)
                        CHECK (leave_payout_type IS NULL OR leave_payout_type IN (
                            'sick_vacation', 'sick', 'vacation', 'pto'
                        )),
    annual_salary_at_period NUMERIC(12,2),
    processed_date      DATE,
    pay_frequency       VARCHAR(10)     NOT NULL
                        CHECK (pay_frequency IN ('biweekly', 'monthly')),

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Prevent duplicate pay period records per member
    CONSTRAINT uq_salary_member_period UNIQUE (member_id, pay_period_end_date)
);

-- AMS window queries: find highest consecutive N months for a member,
-- ordered by date. The covering index on (member_id, pay_period_end_date)
-- with pensionable_pay INCLUDEd lets the AMS scan avoid heap lookups.
CREATE INDEX idx_salary_member_date ON salary_record (member_id, pay_period_end_date);
CREATE INDEX idx_salary_ams_window ON salary_record (member_id, pay_period_end_date)
    INCLUDE (pensionable_pay, leave_payout_amount, pay_frequency);
CREATE INDEX idx_salary_processed ON salary_record (processed_date);


-- ── service_credit ──────────────────────────────────────────────────────────
-- Service credit by type with applicability flags. Maps from SVC_CREDIT.
-- CRITICAL: purchased service counts toward BENEFIT CALCULATION but NOT
-- toward Rule of 75/85 or IPR. The inclusion flags encode this distinction.
CREATE TABLE service_credit (
    service_credit_id   SERIAL          PRIMARY KEY,
    member_id           INTEGER         NOT NULL REFERENCES member (member_id),
    service_type        VARCHAR(15)     NOT NULL
                        CHECK (service_type IN ('earned', 'purchased', 'military', 'leave_buyback')),
    start_date          DATE,
    end_date            DATE,                                   -- NULL for active/ongoing employment
    years_credit        NUMERIC(8,4)    NOT NULL,               -- Decimal years; full precision
    months_credit       INTEGER,

    -- Purchase-specific fields (NULL for earned type)
    purchase_cost       NUMERIC(12,2),
    purchase_date       DATE,
    purchase_status     VARCHAR(10)
                        CHECK (purchase_status IS NULL OR purchase_status IN (
                            'paid', 'partial', 'pending'
                        )),
    purchase_type       VARCHAR(20)
                        CHECK (purchase_type IS NULL OR purchase_type IN (
                            'prior_government', 'military', 'loa_buyback'
                        )),

    -- Inclusion flags — these drive the rules engine's aggregation
    -- EARNED: all Y. PURCHASED: incl_benefit=Y, incl_eligibility=N, incl_ipr=N.
    incl_benefit        BOOLEAN         NOT NULL DEFAULT TRUE,  -- Include in benefit calculation
    incl_eligibility    BOOLEAN         NOT NULL DEFAULT TRUE,  -- Include in Rule of 75/85 eligibility
    incl_ipr            BOOLEAN         NOT NULL DEFAULT TRUE,  -- Include in IPR calculation

    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Guard: purchased service must NOT count toward eligibility or IPR
    CONSTRAINT chk_purchased_exclusion CHECK (
        service_type != 'purchased'
        OR (incl_eligibility = FALSE AND incl_ipr = FALSE)
    )
);

CREATE INDEX idx_service_credit_member ON service_credit (member_id);
CREATE INDEX idx_service_credit_type ON service_credit (member_id, service_type);
-- For aggregating totals by inclusion flag
CREATE INDEX idx_service_credit_benefit ON service_credit (member_id)
    WHERE incl_benefit = TRUE;
CREATE INDEX idx_service_credit_eligibility ON service_credit (member_id)
    WHERE incl_eligibility = TRUE;


-- ── beneficiary ─────────────────────────────────────────────────────────────
-- Beneficiary designations. Maps from BENEFICIARY.
-- Allocation percentage must be 0-100; primary beneficiaries for a member
-- should sum to 100% (enforced at application level, not DB constraint).
CREATE TABLE beneficiary (
    beneficiary_id      SERIAL          PRIMARY KEY,
    member_id           INTEGER         NOT NULL REFERENCES member (member_id),
    first_name          VARCHAR(50),
    last_name           VARCHAR(50),                            -- NULL for estate designations
    date_of_birth       DATE,                                   -- NULL for estate; needed for J&S calcs
    relationship        VARCHAR(15)     NOT NULL
                        CHECK (relationship IN (
                            'spouse', 'child', 'parent', 'sibling',
                            'estate', 'other', 'former_spouse'
                        )),
    allocation_pct      NUMERIC(5,2)    NOT NULL
                        CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
    designation_type    VARCHAR(12)     NOT NULL
                        CHECK (designation_type IN ('primary', 'contingent')),
    effective_date      DATE            NOT NULL,
    status              VARCHAR(12)     NOT NULL
                        CHECK (status IN ('active', 'inactive', 'superseded', 'deceased')),
    has_spouse_consent  BOOLEAN,
    consent_date        DATE,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_beneficiary_member ON beneficiary (member_id);
CREATE INDEX idx_beneficiary_active ON beneficiary (member_id, status)
    WHERE status = 'active';
CREATE INDEX idx_beneficiary_designation ON beneficiary (member_id, designation_type, status);


-- ── dro_order ───────────────────────────────────────────────────────────────
-- Domestic Relations Orders. Maps from DRO_MASTER.
-- Court orders that divide a member's pension benefit with a former spouse.
CREATE TABLE dro_order (
    dro_id              SERIAL          PRIMARY KEY,
    member_id           INTEGER         NOT NULL REFERENCES member (member_id),
    court_order_date    DATE,
    court_name          VARCHAR(80),
    case_number         VARCHAR(40),

    -- Alternate payee (former spouse)
    alternate_payee_name            VARCHAR(100),
    alternate_payee_date_of_birth   DATE,
    alternate_payee_relationship    VARCHAR(20),

    -- Marriage/divorce dates — needed for marital fraction
    marriage_date       DATE,
    divorce_date        DATE,

    -- Division terms
    division_method     VARCHAR(15)     NOT NULL
                        CHECK (division_method IN ('percentage', 'amount')),
    division_percentage NUMERIC(6,4),                           -- Stored as fraction (0.40 = 40%)
    division_amount     NUMERIC(12,2),                          -- Fixed dollar amount
    division_description TEXT,

    -- Processing
    status              VARCHAR(15)     NOT NULL
                        CHECK (status IN ('pending', 'active', 'rejected', 'superseded')),
    approved_date       DATE,
    computed_marital_service_years   NUMERIC(8,4),
    computed_marital_fraction        NUMERIC(8,6),

    received_date       DATE,
    notes               TEXT,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dro_member ON dro_order (member_id);
CREATE INDEX idx_dro_status ON dro_order (member_id, status);


-- ── contribution ────────────────────────────────────────────────────────────
-- Per-period contribution with running balances. Maps from CONTRIBUTION_HIST.
CREATE TABLE contribution (
    contribution_id     SERIAL          PRIMARY KEY,
    member_id           INTEGER         NOT NULL REFERENCES member (member_id),
    contribution_date   DATE            NOT NULL,
    employee_contribution   NUMERIC(12,2)   NOT NULL,
    employer_contribution   NUMERIC(12,2)   NOT NULL,
    pensionable_salary      NUMERIC(12,2)   NOT NULL,

    -- Running balances
    employee_balance    NUMERIC(14,2),
    employer_balance    NUMERIC(14,2),
    interest_balance    NUMERIC(14,2),

    fiscal_year         SMALLINT,
    quarter             SMALLINT        CHECK (quarter IS NULL OR quarter BETWEEN 1 AND 4),

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_contribution_member_date UNIQUE (member_id, contribution_date)
);

CREATE INDEX idx_contribution_member ON contribution (member_id);
CREATE INDEX idx_contribution_date ON contribution (member_id, contribution_date);
CREATE INDEX idx_contribution_fiscal_year ON contribution (fiscal_year);


-- ── case_record ─────────────────────────────────────────────────────────────
-- Work item / case tracking. Maps from CASE_HIST.
-- Status transitions are tracked in case_lifecycle (below).
CREATE TABLE case_record (
    case_id             SERIAL          PRIMARY KEY,
    member_id           INTEGER         REFERENCES member (member_id),  -- NULL for system-level cases
    case_type           VARCHAR(25)     NOT NULL
                        CHECK (case_type IN (
                            'service_retirement', 'early_retirement', 'refund',
                            'dro', 'service_purchase', 'beneficiary_change',
                            'address_change', 'death', 'reemployment'
                        )),
    status              VARCHAR(15)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'in_review', 'approved', 'denied', 'closed')),
    open_date           DATE            NOT NULL,
    close_date          DATE,
    assigned_to         VARCHAR(50),
    priority            SMALLINT        CHECK (priority IS NULL OR priority BETWEEN 1 AND 3),
                                                                -- 1=high, 2=medium, 3=low
    notes               TEXT,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_member ON case_record (member_id);
CREATE INDEX idx_case_status ON case_record (status);
CREATE INDEX idx_case_type ON case_record (case_type);
CREATE INDEX idx_case_open_date ON case_record (open_date);
CREATE INDEX idx_case_assigned ON case_record (assigned_to)
    WHERE status NOT IN ('closed', 'denied');


-- ── case_lifecycle ──────────────────────────────────────────────────────────
-- Tracks state transitions on case_record. Every status change produces a row.
-- Provides a complete audit trail of who changed what and when.
CREATE TABLE case_lifecycle (
    lifecycle_id        SERIAL          PRIMARY KEY,
    case_id             INTEGER         NOT NULL REFERENCES case_record (case_id),
    from_status         VARCHAR(15)
                        CHECK (from_status IS NULL OR from_status IN (
                            'pending', 'in_review', 'approved', 'denied', 'closed'
                        )),
    to_status           VARCHAR(15)     NOT NULL
                        CHECK (to_status IN (
                            'pending', 'in_review', 'approved', 'denied', 'closed'
                        )),
    changed_by          VARCHAR(50)     NOT NULL,
    changed_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reason              TEXT                                    -- Why the transition was made
);

CREATE INDEX idx_lifecycle_case ON case_lifecycle (case_id);
CREATE INDEX idx_lifecycle_changed_at ON case_lifecycle (changed_at);
CREATE INDEX idx_lifecycle_changed_by ON case_lifecycle (changed_by);


-- ============================================================================
-- NOTE: The audit_log table is defined in 006_audit_schema.sql and is NOT
-- recreated here. All domain entity operations write audit records to that
-- table via the Connector's AuditWriter. The audit_log captures:
--   - READ, CREATE, UPDATE, CALCULATE, DELETE actions
--   - request_id, user_id, entity_type, entity_id, member_id
--   - JSON details payload with operation-specific context
--   - duration_ms and status (OK/ERROR)
-- ============================================================================
