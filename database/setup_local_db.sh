#!/bin/bash
# ============================================================================
# Local PostgreSQL Setup for DERP POC
# ============================================================================
# Creates the derp_legacy database, loads the schema, and loads seed data.
# Prerequisites: PostgreSQL installed and running.
#
# Usage: bash database/setup_local_db.sh
# ============================================================================
set -e

DB_NAME="derp_legacy"
DB_USER="derp_app"
DB_PASS="derp_poc_2026"

echo "=== DERP Legacy Database Setup ==="
echo ""

# Start PostgreSQL if not running (WSL2 doesn't auto-start services)
echo "Ensuring PostgreSQL is running..."
sudo pg_ctlcluster $(pg_lsclusters -h | head -1 | awk '{print $1, $2}') start 2>/dev/null || true
sleep 1

# Create user and database
echo "Creating database user and database..."
sudo -u postgres psql -v ON_ERROR_STOP=0 << SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
        CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
    END IF;
END
\$\$;
DROP DATABASE IF EXISTS ${DB_NAME};
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

# Load schema
echo "Loading schema..."
PGPASSWORD=${DB_PASS} psql -h localhost -U ${DB_USER} -d ${DB_NAME} -f database/schema/001_legacy_schema.sql

# Load additional schema files (idempotent — uses IF NOT EXISTS)
for schema_file in database/schema/003_*.sql database/schema/004_*.sql database/schema/005_*.sql database/schema/006_*.sql database/schema/007_*.sql; do
    if [ -f "$schema_file" ]; then
        echo "Loading $schema_file..."
        PGPASSWORD=${DB_PASS} psql -h localhost -U ${DB_USER} -d ${DB_NAME} -f "$schema_file"
    fi
done

# Generate seed data if not already generated
if [ ! -f database/seed/output/002_seed_data.sql ]; then
    echo "Generating seed data (this takes ~2 minutes)..."
    python3 database/seed/generate_derp_data.py --output-dir database/seed/output
fi

# Load seed data
echo "Loading seed data (this takes several minutes for 770MB)..."
PGPASSWORD=${DB_PASS} psql -h localhost -U ${DB_USER} -d ${DB_NAME} -f database/seed/output/002_seed_data.sql

echo ""
echo "=== Verification Queries ==="
echo ""

PGPASSWORD=${DB_PASS} psql -h localhost -U ${DB_USER} -d ${DB_NAME} << 'SQL'
-- Member counts by status
SELECT 'Members by Status' AS report;
SELECT STATUS_CD, COUNT(*) AS cnt FROM MEMBER_MASTER GROUP BY STATUS_CD ORDER BY STATUS_CD;

-- Member counts by tier
SELECT 'Members by Tier' AS report;
SELECT TIER_CD, COUNT(*) AS cnt FROM MEMBER_MASTER GROUP BY TIER_CD ORDER BY TIER_CD;

-- Total record counts
SELECT 'Record Counts' AS report;
SELECT 'MEMBER_MASTER' AS tbl, COUNT(*) AS cnt FROM MEMBER_MASTER
UNION ALL SELECT 'EMPLOYMENT_HIST', COUNT(*) FROM EMPLOYMENT_HIST
UNION ALL SELECT 'SALARY_HIST', COUNT(*) FROM SALARY_HIST
UNION ALL SELECT 'CONTRIBUTION_HIST', COUNT(*) FROM CONTRIBUTION_HIST
UNION ALL SELECT 'BENEFICIARY', COUNT(*) FROM BENEFICIARY
UNION ALL SELECT 'SVC_CREDIT', COUNT(*) FROM SVC_CREDIT
UNION ALL SELECT 'DRO_MASTER', COUNT(*) FROM DRO_MASTER
UNION ALL SELECT 'BENEFIT_PAYMENT', COUNT(*) FROM BENEFIT_PAYMENT
UNION ALL SELECT 'CASE_HIST', COUNT(*) FROM CASE_HIST
UNION ALL SELECT 'TRANSACTION_LOG', COUNT(*) FROM TRANSACTION_LOG
ORDER BY tbl;

-- Demo case members
SELECT 'Demo Case Members' AS report;
SELECT MBR_ID, FIRST_NM, LAST_NM, TIER_CD, STATUS_CD, HIRE_DT, DOB
FROM MEMBER_MASTER
WHERE MBR_ID IN ('M-100001', 'M-100002', 'M-100003')
ORDER BY MBR_ID;

-- Demo case service credit
SELECT 'Demo Case Service Credit' AS report;
SELECT MBR_ID, SVC_TYPE, YEARS_CREDIT, INCL_BENEFIT, INCL_ELIG, INCL_IPR
FROM SVC_CREDIT
WHERE MBR_ID IN ('M-100001', 'M-100002', 'M-100003')
ORDER BY MBR_ID, SVC_TYPE;

-- Demo case DRO (Case 4)
SELECT 'Demo Case DRO' AS report;
SELECT DRO_ID, MBR_ID, ALT_PAYEE_NM, MARRIAGE_DT, DIVORCE_DT, DIV_METHOD, DIV_PCT
FROM DRO_MASTER
WHERE MBR_ID = 'M-100001';

-- Data quality issue detection
SELECT 'DQ-001: Active members with TERM_DT' AS report;
SELECT COUNT(*) AS cnt FROM MEMBER_MASTER WHERE STATUS_CD = 'A' AND TERM_DT IS NOT NULL;

SQL

echo ""
echo "=== Setup Complete ==="
echo "Connection: psql -h localhost -U ${DB_USER} -d ${DB_NAME}"
echo "Password: ${DB_PASS}"
