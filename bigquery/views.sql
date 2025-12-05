-- Views and materialized views for Links Transaction AI analytics
-- Dataset: links-transaction-ai.links_transactions

-- Materialized view: per-deal readiness
CREATE OR REPLACE MATERIALIZED VIEW `links-transaction-ai.links_transactions.mv_deal_readiness`
PARTITION BY DATE(last_update)
CLUSTER BY deal_name AS
SELECT
  deal_name,
  COUNT(*) AS total_tasks,
  COUNTIF(status = 'Completed') AS completed_tasks,
  COUNTIF(status = 'Blocked') AS blocked_tasks,
  SAFE_DIVIDE(COUNTIF(status = 'Completed'), NULLIF(COUNT(*), 0)) AS readiness_percent,
  MAX(updated_at) AS last_update
FROM `links-transaction-ai.links_transactions.tasks_snapshot`
GROUP BY deal_name;

-- Materialized view: workload by deal + department
CREATE OR REPLACE MATERIALIZED VIEW `links-transaction-ai.links_transactions.mv_department_workload`
CLUSTER BY deal_name, department AS
SELECT
  deal_name,
  department,
  COUNTIF(status != 'Completed') AS open_tasks,
  COUNTIF(status = 'Blocked') AS blocked_tasks,
  COUNTIF(status = 'In Progress') AS in_progress_tasks,
  MAX(updated_at) AS last_update
FROM `links-transaction-ai.links_transactions.tasks_snapshot`
GROUP BY deal_name, department;

-- Standard view: tasks filtered by deal (for app/dashboard use)
CREATE OR REPLACE VIEW `links-transaction-ai.links_transactions.vw_tasks_by_deal` AS
SELECT *
FROM `links-transaction-ai.links_transactions.tasks_snapshot`
WHERE deal_name IS NOT NULL;

-- Standard view: blockers by deal/department
CREATE OR REPLACE VIEW `links-transaction-ai.links_transactions.vw_blockers` AS
SELECT
  deal_name,
  department,
  phase_code,
  status,
  updated_at,
  task_id,
  original_key
FROM `links-transaction-ai.links_transactions.tasks_snapshot`
WHERE status = 'Blocked';

-- Document coverage view vs required doc types
WITH required AS (
  SELECT deal_name, doc_type
  FROM (
    SELECT DISTINCT deal_name FROM `links-transaction-ai.links_transactions.tasks_snapshot`
  ), UNNEST(['PSA', 'Title', 'ESA', 'CO', 'Survey']) AS doc_type
),
actual AS (
  SELECT
    COALESCE(deal, 'Unknown') AS deal_name,
    COALESCE(doc_type, 'Unknown') AS doc_type,
    COUNT(*) AS doc_count,
    MAX(uploaded_at) AS latest_upload
  FROM `links-transaction-ai.links_transactions.documents_snapshot`
  GROUP BY deal_name, doc_type
)
CREATE OR REPLACE VIEW `links-transaction-ai.links_transactions.vw_document_coverage` AS
SELECT
  r.deal_name,
  r.doc_type,
  COALESCE(a.doc_count, 0) AS doc_count,
  a.latest_upload,
  COALESCE(a.doc_count, 0) = 0 AS is_missing
FROM required r
LEFT JOIN actual a
  ON a.deal_name = r.deal_name AND LOWER(a.doc_type) = LOWER(r.doc_type);

-- Search index for fast document keyword search
CREATE SEARCH INDEX IF NOT EXISTS `links-transaction-ai.links_transactions.idx_documents_snapshot_text`
ON `links-transaction-ai.links_transactions.documents_snapshot` (filename, summary, text_snippet);
