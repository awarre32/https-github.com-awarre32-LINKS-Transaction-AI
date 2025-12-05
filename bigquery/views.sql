
-- 1. Materialized View: Deal Readiness
CREATE MATERIALIZED VIEW IF NOT EXISTS `links_transactions.mv_deal_readiness`
AS
SELECT
  deal_name,
  COUNT(*) AS total_tasks,
  COUNTIF(status = 'Completed') AS completed_tasks,
  COUNTIF(status = 'Blocked') AS blocked_tasks,
  SAFE_DIVIDE(COUNTIF(status = 'Completed'), COUNT(*)) AS readiness_percent,
  MAX(updated_at) AS last_update
FROM `links_transactions.tasks_snapshot`
GROUP BY deal_name;

-- 2. Materialized View: Department Workload
CREATE MATERIALIZED VIEW IF NOT EXISTS `links_transactions.mv_department_workload`
AS
SELECT
  deal_name,
  department,
  COUNTIF(status != 'Completed') AS open_tasks,
  COUNTIF(status = 'Blocked') AS blocked_tasks,
  COUNTIF(status = 'In Progress') AS in_progress_tasks
FROM `links_transactions.tasks_snapshot`
GROUP BY deal_name, department;

-- 3. View: Current Tasks by Deal
CREATE OR REPLACE VIEW `links_transactions.v_current_tasks_by_deal` AS
SELECT *
FROM `links_transactions.tasks_snapshot`
ORDER BY deal_name, phase_code;

-- 4. Search Index on Documents
CREATE SEARCH INDEX IF NOT EXISTS documents_search_index
ON `links_transactions.documents_snapshot` (filename, summary, text_snippet);
