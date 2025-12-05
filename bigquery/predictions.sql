
-- 1. Deal Risk Predictions
CREATE OR REPLACE TABLE `links_transactions.deal_risk_predictions` AS
SELECT
  deal_name,
  predicted_is_at_risk,
  predicted_is_at_risk_probs,
  CURRENT_TIMESTAMP() AS prediction_time
FROM ML.PREDICT(
  MODEL `links_transactions.ml_deal_risk_classifier`,
  TABLE `links_transactions.deal_features`
);

-- 2. Task Blockage Predictions
CREATE OR REPLACE TABLE `links_transactions.task_blockage_predictions` AS
SELECT
  task_id,
  deal_name,
  predicted_is_blocked,
  predicted_is_blocked_probs,
  CURRENT_TIMESTAMP() AS prediction_time
FROM ML.PREDICT(
  MODEL `links_transactions.ml_task_blockage_classifier`,
  TABLE `links_transactions.task_features`
);
