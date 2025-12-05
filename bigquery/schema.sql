-- Dataset: links-transaction-ai.links_transactions
-- Base tables derived from Firestore → BigQuery extension outputs.
-- Extension raw outputs assumed:
--   links_transactions.tasks_raw_latest
--   links_transactions.tasks_raw_changelog
--   links_transactions.documents_raw_latest
--   links_transactions.documents_raw_changelog

-- 1) Tasks snapshot (current state), partitioned + clustered
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.tasks_snapshot`
PARTITION BY DATE(updated_at)
CLUSTER BY deal_name, department, phase_code, status AS
SELECT
  document_name                                   AS task_id,
  JSON_VALUE(data, '$.dealName')                  AS deal_name,
  JSON_VALUE(data, '$.phaseCode')                 AS phase_code,
  JSON_VALUE(data, '$.department')                AS department,
  JSON_VALUE(data, '$.status')                    AS status,
  SAFE.PARSE_TIMESTAMP(JSON_VALUE(data, '$.targetDate'))  AS target_date,
  SAFE.PARSE_TIMESTAMP(JSON_VALUE(data, '$.actualDate'))  AS actual_date,
  SAFE.PARSE_TIMESTAMP(JSON_VALUE(data, '$.updatedAt'))   AS updated_at,
  SAFE.PARSE_TIMESTAMP(JSON_VALUE(data, '$.createdAt'))   AS created_at,
  JSON_VALUE(data, '$.updatedBy')                 AS updated_by,
  JSON_VALUE(data, '$.originalKey')               AS original_key,
  data                                             AS raw_json
FROM `links-transaction-ai.links_transactions.tasks_raw_latest`;

-- 2) Tasks history (change log)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.tasks_history`
PARTITION BY DATE(timestamp)
CLUSTER BY deal_name, department, phase_code AS
SELECT
  document_name                                   AS task_id,
  JSON_VALUE(data, '$.dealName')                  AS deal_name,
  JSON_VALUE(data, '$.phaseCode')                 AS phase_code,
  JSON_VALUE(data, '$.department')                AS department,
  JSON_VALUE(data, '$.status')                    AS status,
  timestamp                                       AS change_timestamp,
  operation,
  data                                            AS raw_json
FROM `links-transaction-ai.links_transactions.tasks_raw_changelog`;

-- 3) Documents snapshot (metadata only), partitioned + clustered
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.documents_snapshot`
PARTITION BY DATE(uploaded_at)
CLUSTER BY deal, doc_type AS
SELECT
  document_name                                   AS doc_id,
  JSON_VALUE(data, '$.filename')                  AS filename,
  JSON_VALUE(data, '$.deal')                      AS deal,
  JSON_VALUE(data, '$.site')                      AS site,
  JSON_VALUE(data, '$.type')                      AS doc_type,
  JSON_VALUE(data, '$.summary')                   AS summary,
  JSON_VALUE(data, '$.text_snippet')              AS text_snippet,
  CAST(JSON_VALUE(data, '$.needs_ocr') AS BOOL)   AS needs_ocr,
  JSON_VALUE(data, '$.url')                       AS url,
  SAFE.PARSE_TIMESTAMP(JSON_VALUE(data, '$.uploadedAt')) AS uploaded_at,
  data                                            AS raw_json
FROM `links-transaction-ai.links_transactions.documents_raw_latest`;

-- 4) Deals + sites snapshots (small tables, no partition needed unless dates exist)
-- Replace source SELECT with your chosen load/backfill method (JSON load / Firestore export).
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.deals_snapshot` AS
SELECT * FROM UNNEST([]); -- placeholder; load via bq load or external table

CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.sites_snapshot` AS
SELECT * FROM UNNEST([]); -- placeholder; load via bq load or external table
