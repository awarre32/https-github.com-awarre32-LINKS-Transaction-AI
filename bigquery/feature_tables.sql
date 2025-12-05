-- links_transactions feature tables
-- These tables sit on top of the Stream Firestore to BigQuery extension outputs.
-- Dataset: links-transaction-ai.links_transactions

-- 1) Task features (partitioned + clustered)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.task_features`
PARTITION BY DATE(feature_updated_at)
CLUSTER BY deal_name, department, phase_code, status AS
SELECT
  task_id,
  deal_name,
  phase_code,
  department,
  status,
  target_date,
  actual_date,
  updated_at,
  created_at,
  updated_by,
  original_key,
  CASE
    WHEN target_date IS NULL THEN NULL
    ELSE DATE_DIFF(DATE(target_date), CURRENT_DATE(), DAY)
  END AS days_to_target,
  CASE
    WHEN target_date IS NULL THEN NULL
    ELSE GREATEST(DATE_DIFF(CURRENT_DATE(), DATE(target_date), DAY), 0)
  END AS days_overdue,
  status = 'Blocked' AS is_blocked,
  status = 'Completed' AS is_completed,
  CONCAT(COALESCE(original_key, ''), ' ', COALESCE(JSON_VALUE(raw_json, '$.notes'), '')) AS text_description,
  CONCAT(COALESCE(deal_name, 'Unknown'), ':', COALESCE(phase_code, '')) AS deal_phase,
  COALESCE(updated_at, created_at, CURRENT_TIMESTAMP()) AS feature_updated_at
FROM `links-transaction-ai.links_transactions.tasks_snapshot`;

-- 2) Deal features (partitioned + clustered)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.deal_features`
PARTITION BY DATE(updated_at)
CLUSTER BY deal_name AS
WITH task_agg AS (
  SELECT
    deal_name,
    COUNT(*) AS total_tasks,
    COUNTIF(status = 'Completed') AS completed_tasks,
    COUNTIF(status = 'Blocked') AS blocked_tasks,
    COUNTIF(department = 'Legal') AS legal_tasks_total,
    COUNTIF(department = 'Legal' AND status = 'Completed') AS legal_tasks_completed,
    COUNTIF(department = 'Ops') AS ops_tasks_total,
    COUNTIF(department = 'Ops' AND status = 'Completed') AS ops_tasks_completed,
    MAX(feature_updated_at) AS tasks_updated_at
  FROM `links-transaction-ai.links_transactions.task_features`
  GROUP BY deal_name
),
doc_agg AS (
  SELECT
    deal,
    COUNTIF(LOWER(doc_type) LIKE 'psa%') AS docs_psa_count,
    COUNTIF(LOWER(doc_type) LIKE 'title%') AS docs_title_count,
    COUNTIF(LOWER(doc_type) LIKE 'esa%') AS docs_esa_count,
    COUNTIF(LOWER(doc_type) LIKE 'co%') AS docs_co_count,
    COUNTIF(LOWER(doc_type) LIKE 'zoning%') AS docs_zoning_count,
    MAX(uploaded_at) AS docs_updated_at
  FROM `links-transaction-ai.links_transactions.documents_snapshot`
  GROUP BY deal
),
site_agg AS (
  SELECT
    COALESCE(deal_name, deal) AS deal_name,
    COUNT(*) AS sites_actual
  FROM `links-transaction-ai.links_transactions.sites_snapshot`
  GROUP BY COALESCE(deal_name, deal)
)
SELECT
  COALESCE(d.deal_name, d.name, ta.deal_name, da.deal) AS deal_name,
  d.deal_type,
  SAFE_CAST(d.sites_expected AS INT64) AS sites_expected,
  sa.sites_actual,
  ta.total_tasks,
  ta.completed_tasks,
  ta.blocked_tasks,
  ta.legal_tasks_total,
  ta.legal_tasks_completed,
  ta.ops_tasks_total,
  ta.ops_tasks_completed,
  CASE
    WHEN ta.total_tasks IS NULL OR ta.total_tasks = 0 THEN NULL
    ELSE SAFE_DIVIDE(ta.completed_tasks, ta.total_tasks)
  END AS readiness_percent,
  CASE
    WHEN SAFE_CAST(d.closing_date AS DATE) IS NULL THEN NULL
    ELSE DATE_DIFF(SAFE_CAST(d.closing_date AS DATE), CURRENT_DATE(), DAY)
  END AS days_to_target_close,
  da.docs_psa_count,
  da.docs_title_count,
  da.docs_esa_count,
  da.docs_co_count,
  da.docs_zoning_count,
  da.docs_psa_count = 0 AS missing_psa,
  da.docs_title_count = 0 AS missing_title,
  da.docs_esa_count = 0 AS missing_esa,
  da.docs_co_count = 0 AS missing_co,
  da.docs_zoning_count = 0 AS missing_zoning,
  COALESCE(ta.tasks_updated_at, da.docs_updated_at, CURRENT_TIMESTAMP()) AS updated_at
FROM `links-transaction-ai.links_transactions.deals_snapshot` d
LEFT JOIN task_agg ta ON ta.deal_name = COALESCE(d.deal_name, d.name)
LEFT JOIN doc_agg da ON da.deal = COALESCE(d.deal_name, d.name)
LEFT JOIN site_agg sa ON sa.deal_name = COALESCE(d.deal_name, d.name);

-- 3) Site features (partitioned + clustered)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.site_features`
PARTITION BY DATE(updated_at)
CLUSTER BY deal_name, site_label AS
WITH site_tasks AS (
  SELECT
    s.task AS site_label,
    COALESCE(s.deal_association, s.deal_name, s.deal) AS deal_name,
    s.status,
    s.date,
    COUNTIF(t.department = 'Ops') AS ops_tasks_total,
    COUNTIF(t.department = 'Ops' AND t.status = 'Completed') AS ops_tasks_completed,
    COUNTIF(t.department = 'Legal') AS legal_tasks_total,
    COUNTIF(t.department = 'Legal' AND t.status = 'Completed') AS legal_tasks_completed,
    MAX(t.feature_updated_at) AS tasks_updated_at
  FROM `links-transaction-ai.links_transactions.sites_snapshot` s
  LEFT JOIN `links-transaction-ai.links_transactions.task_features` t
    ON COALESCE(t.deal_name, '') = COALESCE(s.deal_association, s.deal_name, s.deal, '')
  GROUP BY site_label, deal_name, s.status, s.date
)
SELECT
  deal_name,
  site_label,
  status,
  date_under_contract,
  ops_tasks_total,
  ops_tasks_completed,
  legal_tasks_total,
  legal_tasks_completed,
  CASE
    WHEN (ops_tasks_total + legal_tasks_total) = 0 THEN NULL
    ELSE SAFE_DIVIDE(ops_tasks_completed + legal_tasks_completed, ops_tasks_total + legal_tasks_total)
  END AS readiness_percent,
  COALESCE(tasks_updated_at, CURRENT_TIMESTAMP()) AS updated_at
FROM (
  SELECT
    deal_name,
    site_label,
    status,
    SAFE_CAST(date AS DATE) AS date_under_contract,
    ops_tasks_total,
    ops_tasks_completed,
    legal_tasks_total,
    legal_tasks_completed,
    tasks_updated_at
  FROM site_tasks
);
