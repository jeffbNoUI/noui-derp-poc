-- CASE_HIST case ID sequence — replaces MAX(CASE_ID)+1 anti-pattern.
-- Consumed by: connector service (SaveRetirementElection, SaveRefundApplication)
-- Depends on: 001_legacy_schema.sql (CASE_HIST table)
--
-- The legacy code used SELECT MAX(CASE_ID)+1 which is a race condition
-- under concurrent access. This sequence ensures unique, gap-free IDs.

CREATE SEQUENCE IF NOT EXISTS case_hist_case_id_seq;

-- Initialize sequence to the current max CASE_ID so new IDs continue from there
SELECT setval('case_hist_case_id_seq', COALESCE((SELECT MAX(CASE_ID) FROM CASE_HIST), 0));
