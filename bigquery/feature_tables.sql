
-- 1. Task Features
CREATE OR REPLACE TABLE `links_transactions.task_features`
PARTITION BY DATE(updated_at)
CLUSTER BY deal_name, department, status
AS
SELECT
  task_id,
  SPLIT(task_id, '_')[OFFSET(0)] as deal_name,
  SPLIT(task_id, '_')[OFFSET(1)] as phase_code,
  department,
  status,
  CAST(NULL AS TIMESTAMP) as created_at, -- Not available in simple view
  updated_at,
  CAST(target_date AS TIMESTAMP) as target_date,
  CAST(NULL AS TIMESTAMP) as actual_date,
  DATE_DIFF(DATE(updated_at), DATE(CAST(target_date AS TIMESTAMP)), DAY) as days_overdue,
  status = 'Blocked' as is_blocked,
  status = 'Completed' as is_completed,
  CONCAT(task_id, ' ', COALESCE(notes, '')) as text_description
FROM `links_transactions.tasks_raw_latest`;

-- 2. Deal Features
CREATE OR REPLACE TABLE `links_transactions.deal_features`
PARTITION BY DATE(updated_at)
CLUSTER BY deal_name
AS
WITH task_agg AS (
  SELECT
    deal_name,
    COUNT(*) as total_tasks,
    COUNTIF(status = 'Completed') as completed_tasks,
    COUNTIF(status = 'Blocked') as blocked_tasks,
    COUNTIF(department = 'Legal') as legal_tasks_total,
    COUNTIF(department = 'Legal' AND status = 'Completed') as legal_tasks_completed,
    COUNTIF(department = 'Ops') as ops_tasks_total,
    COUNTIF(department = 'Ops' AND status = 'Completed') as ops_tasks_completed,
    MAX(updated_at) as last_task_update
  FROM `links_transactions.task_features`
  GROUP BY deal_name
),
doc_agg AS (
  SELECT
    deal,
    COUNTIF(type = 'PSA') as docs_psa_count,
    COUNTIF(type = 'Title') as docs_title_count,
    COUNTIF(type = 'ESA') as docs_esa_count,
    COUNTIF(type = 'Financial') as docs_financial_count,
    MAX(updated_at) as last_doc_update
  FROM `links_transactions.documents_raw_latest`
  GROUP BY deal
)
SELECT
  t.deal_name,
  'Acquisition' as deal_type,
  t.total_tasks,
  t.completed_tasks,
  t.blocked_tasks,
  t.legal_tasks_total,
  t.legal_tasks_completed,
  t.ops_tasks_total,
  t.ops_tasks_completed,
  d.docs_psa_count,
  d.docs_title_count,
  d.docs_esa_count,
  d.docs_financial_count,
  (d.docs_psa_count = 0) as missing_psa,
  SAFE_DIVIDE(t.completed_tasks, t.total_tasks) as readiness_percent,
  GREATEST(t.last_task_update, d.last_doc_update) as updated_at
FROM task_agg t
LEFT JOIN doc_agg d ON t.deal_name = d.deal;

-- 3. Site Features (Optional)
CREATE OR REPLACE TABLE `links_transactions.site_features`
AS
SELECT
  deal_name,
  'Unknown Site' as site_label,
  'Under Contract' as status,
  CURRENT_TIMESTAMP() as date_under_contract,
  ops_tasks_total,
  ops_tasks_completed
FROM `links_transactions.deal_features`;
