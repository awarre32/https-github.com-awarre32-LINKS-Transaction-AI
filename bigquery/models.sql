
-- 1. Deal Risk Classifier
CREATE OR REPLACE MODEL `links_transactions.ml_deal_risk_classifier`
OPTIONS(
  MODEL_TYPE = 'BOOSTED_TREE_CLASSIFIER',
  INPUT_LABEL_COLS = ['is_at_risk'],
  DATA_SPLIT_METHOD = 'RANDOM',
  DATA_SPLIT_EVAL_FRACTION = 0.2
) AS
SELECT
  (readiness_percent < 0.7 OR blocked_tasks > 5) AS is_at_risk,
  total_tasks,
  completed_tasks,
  blocked_tasks,
  docs_psa_count,
  docs_title_count,
  docs_esa_count,
  readiness_percent
FROM `links_transactions.deal_features`
WHERE total_tasks > 0;

-- 2. Task Blockage Classifier
CREATE OR REPLACE MODEL `links_transactions.ml_task_blockage_classifier`
OPTIONS(
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
  days_overdue
FROM `links_transactions.task_features`
WHERE updated_at IS NOT NULL;
