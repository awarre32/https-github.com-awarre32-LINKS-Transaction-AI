-- BigQuery ML models for Links Transaction AI
-- Dataset: links-transaction-ai.links_transactions

-- 1) Deal risk classifier (is the deal at risk of missing target close?)
CREATE OR REPLACE MODEL `links-transaction-ai.links_transactions.ml_deal_risk_classifier`
OPTIONS (
  MODEL_TYPE = 'BOOSTED_TREE_CLASSIFIER',
  INPUT_LABEL_COLS = ['is_at_risk'],
  DATA_SPLIT_METHOD = 'RANDOM',
  DATA_SPLIT_EVAL_FRACTION = 0.2
) AS
SELECT
  -- Label: at risk if close is within 30 days and readiness below 0.7 or blocked ratio high
  (
    (days_to_target_close IS NOT NULL AND days_to_target_close < 30 AND readiness_percent < 0.7)
    OR SAFE_DIVIDE(blocked_tasks, NULLIF(total_tasks, 0)) > 0.15
  ) AS is_at_risk,
  total_tasks,
  completed_tasks,
  blocked_tasks,
  legal_tasks_total,
  legal_tasks_completed,
  ops_tasks_total,
  ops_tasks_completed,
  days_to_target_close,
  docs_psa_count,
  docs_title_count,
  docs_esa_count,
  docs_co_count,
  docs_zoning_count,
  missing_psa,
  missing_title,
  missing_esa,
  missing_co,
  missing_zoning
FROM `links-transaction-ai.links_transactions.deal_features`
WHERE total_tasks IS NOT NULL AND total_tasks > 0;

-- Evaluate deal risk model
SELECT * FROM ML.EVALUATE(MODEL `links-transaction-ai.links_transactions.ml_deal_risk_classifier`);

-- Persist deal risk predictions
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

-- 2) Task blockage classifier (probability a task is blocked)
CREATE OR REPLACE MODEL `links-transaction-ai.links_transactions.ml_task_blockage_classifier`
OPTIONS (
  MODEL_TYPE = 'LOGISTIC_REG',
  INPUT_LABEL_COLS = ['is_blocked'],
  DATA_SPLIT_METHOD = 'RANDOM',
  DATA_SPLIT_EVAL_FRACTION = 0.2
) AS
SELECT
  is_blocked,
  phase_code,
  department,
  days_to_target,
  days_overdue,
  readiness_percent AS deal_readiness
FROM `links-transaction-ai.links_transactions.task_features` tf
LEFT JOIN `links-transaction-ai.links_transactions.deal_features` df
  ON tf.deal_name = df.deal_name
WHERE tf.updated_at IS NOT NULL;

-- Evaluate blockage model
SELECT * FROM ML.EVALUATE(MODEL `links-transaction-ai.links_transactions.ml_task_blockage_classifier`);

-- Persist task blockage predictions
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

-- 3) Optional: deal readiness regression (forecast readiness percent)
CREATE OR REPLACE MODEL `links-transaction-ai.links_transactions.ml_deal_readiness_regressor`
OPTIONS (
  MODEL_TYPE = 'LINEAR_REG',
  INPUT_LABEL_COLS = ['readiness_percent'],
  DATA_SPLIT_METHOD = 'RANDOM',
  DATA_SPLIT_EVAL_FRACTION = 0.2
) AS
SELECT
  readiness_percent,
  total_tasks,
  completed_tasks,
  blocked_tasks,
  legal_tasks_completed,
  ops_tasks_completed,
  days_to_target_close,
  docs_psa_count,
  docs_title_count,
  docs_esa_count,
  docs_co_count,
  docs_zoning_count
FROM `links-transaction-ai.links_transactions.deal_features`
WHERE readiness_percent IS NOT NULL;

-- Evaluate readiness model
SELECT * FROM ML.EVALUATE(MODEL `links-transaction-ai.links_transactions.ml_deal_readiness_regressor`);
