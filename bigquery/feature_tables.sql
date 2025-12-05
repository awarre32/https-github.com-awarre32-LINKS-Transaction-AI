
-- 1. Task Features
CREATE OR REPLACE TABLE `links_transactions.task_features`
PARTITION BY TIMESTAMP_TRUNC(updated_at, DAY)
CLUSTER BY deal_name, department, phase_code, status
AS
SELECT
  task_id,
  deal_name,
  phase_code,
  department,
  status,
  created_at,
  updated_at,
  target_date,
  actual_date,
  TIMESTAMP_DIFF(target_date, updated_at, DAY) AS days_to_target,
  GREATEST(0, TIMESTAMP_DIFF(updated_at, target_date, DAY)) AS days_overdue,
  status = 'Blocked' AS is_blocked,
  status = 'Completed' AS is_completed,
  notes AS text_description,
  CONCAT(deal_name, ':', phase_code) AS deal_phase
FROM `links_transactions.tasks_snapshot`;

-- 2. Deal Features
CREATE OR REPLACE TABLE `links_transactions.deal_features`
PARTITION BY TIMESTAMP_TRUNC(updated_at, DAY)
CLUSTER BY deal_name
AS
SELECT
  d.deal_name,
  d.status AS deal_type,
  (SELECT COUNT(*) FROM `links_transactions.sites_snapshot` s WHERE s.deal_association = d.deal_name) AS sites_actual,
  (SELECT COUNT(*) FROM `links_transactions.tasks_snapshot` t WHERE t.deal_name = d.deal_name) AS total_tasks,
  (SELECT COUNT(*) FROM `links_transactions.tasks_snapshot` t WHERE t.deal_name = d.deal_name AND t.status = 'Completed') AS completed_tasks,
  (SELECT COUNT(*) FROM `links_transactions.tasks_snapshot` t WHERE t.deal_name = d.deal_name AND t.status = 'Blocked') AS blocked_tasks,
  (SELECT COUNT(*) FROM `links_transactions.documents_snapshot` doc WHERE doc.deal = d.deal_name AND doc.doc_type = 'PSA') AS docs_psa_count,
  (SELECT COUNT(*) FROM `links_transactions.documents_snapshot` doc WHERE doc.deal = d.deal_name AND doc.doc_type = 'Title') AS docs_title_count,
  (SELECT COUNT(*) FROM `links_transactions.documents_snapshot` doc WHERE doc.deal = d.deal_name AND doc.doc_type = 'ESA') AS docs_esa_count,
  SAFE_DIVIDE((SELECT COUNT(*) FROM `links_transactions.tasks_snapshot` t WHERE t.deal_name = d.deal_name AND t.status = 'Completed'), (SELECT COUNT(*) FROM `links_transactions.tasks_snapshot` t WHERE t.deal_name = d.deal_name)) AS readiness_percent,
  CURRENT_TIMESTAMP() AS updated_at
FROM `links_transactions.deals_snapshot` d;

-- 3. Site Features
CREATE OR REPLACE TABLE `links_transactions.site_features`
PARTITION BY TIMESTAMP_TRUNC(updated_at, DAY)
CLUSTER BY deal_name, site_label
AS
SELECT
  deal_association AS deal_name,
  task AS site_label,
  status,
  CAST(date AS TIMESTAMP) AS date_under_contract,
  CURRENT_TIMESTAMP() AS updated_at
FROM `links_transactions.sites_snapshot`;
