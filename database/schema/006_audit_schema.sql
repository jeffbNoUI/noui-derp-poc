-- Persistent audit log for all data access and modification events.
-- Consumed by: connector service (AuditWriter), security compliance, SOC 2
-- Depends on: none (standalone table)
--
-- Replaces ad-hoc log.Printf("AUDIT: ...") calls with persistent, queryable records.
-- Retention: 7 years per noui-security-architecture.md.

CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    AUDIT_ID        BIGSERIAL PRIMARY KEY,
    TIMESTAMP       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    REQUEST_ID      VARCHAR(64) NOT NULL,
    USER_ID         VARCHAR(100) NOT NULL,
    ACTION          VARCHAR(20) NOT NULL CHECK (ACTION IN ('READ', 'CREATE', 'UPDATE', 'CALCULATE', 'DELETE')),
    ENTITY_TYPE     VARCHAR(50) NOT NULL,
    ENTITY_ID       VARCHAR(50),
    MEMBER_ID       VARCHAR(20),
    DETAILS         JSONB,
    IP_ADDRESS      VARCHAR(45),
    DURATION_MS     INTEGER,
    STATUS          VARCHAR(10) NOT NULL DEFAULT 'OK' CHECK (STATUS IN ('OK', 'ERROR'))
);

-- Query patterns: recent audit by member, by user, by request, by time range
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON AUDIT_LOG (TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_audit_log_member_id ON AUDIT_LOG (MEMBER_ID);
CREATE INDEX IF NOT EXISTS idx_audit_log_request_id ON AUDIT_LOG (REQUEST_ID);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON AUDIT_LOG (USER_ID);
