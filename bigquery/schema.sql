
-- 1. Tasks Snapshot (Partitioned + Clustered)
CREATE TABLE IF NOT EXISTS `links_transactions.tasks_snapshot`
(
  task_id STRING,
  deal_name STRING,
  phase_code STRING,
  department STRING,
  status STRING,
  target_date TIMESTAMP,
  actual_date TIMESTAMP,
  updated_at TIMESTAMP,
  updated_by STRING,
  created_at TIMESTAMP,
  notes STRING
)
PARTITION BY TIMESTAMP_TRUNC(updated_at, DAY)
CLUSTER BY deal_name, department, phase_code, status;

-- 2. Tasks History (Partitioned + Clustered)
CREATE TABLE IF NOT EXISTS `links_transactions.tasks_history`
(
  task_id STRING,
  deal_name STRING,
  phase_code STRING,
  department STRING,
  status STRING,
  change_timestamp TIMESTAMP,
  operation STRING,
  data JSON,
  user STRING
)
PARTITION BY TIMESTAMP_TRUNC(change_timestamp, DAY)
CLUSTER BY deal_name, department, phase_code;

-- 3. Documents Snapshot (Partitioned + Clustered)
CREATE TABLE IF NOT EXISTS `links_transactions.documents_snapshot`
(
  doc_id STRING,
  filename STRING,
  deal STRING,
  site STRING,
  doc_type STRING,
  summary STRING,
  text_snippet STRING,
  needs_ocr BOOL,
  url STRING,
  uploaded_at TIMESTAMP
)
PARTITION BY TIMESTAMP_TRUNC(uploaded_at, DAY)
CLUSTER BY deal, doc_type;

-- 4. Deals Snapshot
CREATE TABLE IF NOT EXISTS `links_transactions.deals_snapshot`
(
  deal_name STRING,
  status STRING,
  closing_date STRING,
  stats JSON,
  updated_at TIMESTAMP
);

-- 5. Sites Snapshot
CREATE TABLE IF NOT EXISTS `links_transactions.sites_snapshot`
(
  task STRING,
  status STRING,
  date STRING,
  deal_association STRING,
  updated_at TIMESTAMP
);
