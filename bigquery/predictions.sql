-- Scheduled prediction helpers for Links Transaction AI
-- Dataset: links-transaction-ai.links_transactions

-- 1) Refresh deal risk predictions (intended for scheduled query hourly/daily)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.deal_risk_predictions` AS
SELECT
  deal_name,
  predicted_is_at_risk.value AS is_at_risk,
  predicted_is_at_risk.prob AS risk_probability,
  CURRENT_TIMESTAMP() AS prediction_time
FROM ML.PREDICT(
  MODEL `links-transaction-ai.links_transactions.ml_deal_risk_classifier`,
  TABLE `links-transaction-ai.links_transactions.deal_features`
);

-- 2) Refresh task blockage predictions (intended for scheduled query hourly/daily)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.task_blockage_predictions` AS
SELECT
  task_id,
  deal_name,
  phase_code,
  department,
  predicted_is_blocked.prob AS blocked_probability,
  CURRENT_TIMESTAMP() AS prediction_time
FROM ML.PREDICT(
  MODEL `links-transaction-ai.links_transactions.ml_task_blockage_classifier`,
  TABLE `links-transaction-ai.links_transactions.task_features`
);

-- Suggested scheduler settings (configure in BigQuery console):
--   Target dataset: links_transactions
--   Frequency: hourly or 4x/day
--   Destination table write mode: WRITE_TRUNCATE
-- These tables can then be synced back into Firestore via Cloud Functions.
