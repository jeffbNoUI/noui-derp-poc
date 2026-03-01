-- ============================================================================
-- Composition Log — tracks every AI workspace composition for pattern learning.
-- Consumed by: composition service (async logger), pattern extractor script
-- Depends on: nothing (standalone table, no FKs to avoid coupling)
-- ============================================================================

CREATE TABLE IF NOT EXISTS COMPOSITION_LOG (
    LOG_ID              BIGSERIAL PRIMARY KEY,
    CREATED_AT          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Request identifiers
    REQUEST_ID          VARCHAR(64) NOT NULL,
    MEMBER_ID           VARCHAR(20) NOT NULL,
    PROCESS_TYPE        VARCHAR(20) NOT NULL,
    RETIREMENT_DATE     DATE,

    -- Denormalized member snapshot (for efficient pattern queries without joins)
    MEMBER_TIER         SMALLINT,
    MEMBER_STATUS       VARCHAR(15),
    HIRE_DATE           DATE,
    HAS_DRO             BOOLEAN DEFAULT FALSE,
    HAS_PURCHASED_SVC   BOOLEAN DEFAULT FALSE,
    YEARS_OF_SERVICE    NUMERIC(8,2),

    -- Composition output
    COMPOSED_BY         VARCHAR(20) NOT NULL,  -- 'agent' | 'static-fallback'
    COMPONENT_LIST      TEXT[],
    CONDITIONALS        JSONB,
    RATIONALE           JSONB,
    ALERTS              JSONB,
    KNOWLEDGE_CONTEXT   JSONB,
    FULL_SPEC           JSONB,

    -- Performance
    DURATION_MS         INTEGER NOT NULL,
    MODEL_USED          VARCHAR(50),
    STATUS              VARCHAR(10) NOT NULL DEFAULT 'OK'
                        CHECK (STATUS IN ('OK', 'ERROR', 'FALLBACK')),
    ERROR_MESSAGE       TEXT
);

-- Query patterns: recent compositions, per-member history, tier breakdowns
CREATE INDEX IF NOT EXISTS idx_comp_log_created ON COMPOSITION_LOG (CREATED_AT);
CREATE INDEX IF NOT EXISTS idx_comp_log_member ON COMPOSITION_LOG (MEMBER_ID);
CREATE INDEX IF NOT EXISTS idx_comp_log_tier ON COMPOSITION_LOG (MEMBER_TIER);
CREATE INDEX IF NOT EXISTS idx_comp_log_process ON COMPOSITION_LOG (PROCESS_TYPE);
CREATE INDEX IF NOT EXISTS idx_comp_log_composed ON COMPOSITION_LOG (COMPOSED_BY);
CREATE INDEX IF NOT EXISTS idx_comp_log_conditionals ON COMPOSITION_LOG USING GIN (CONDITIONALS);
