
-- 1. Parse Tasks Changelog into a "Latest State" View
CREATE OR REPLACE VIEW `links_transactions.tasks_raw_latest` AS
WITH ranked_tasks AS (
  SELECT
    document_name,
    timestamp,
    operation,
    data,
    ROW_NUMBER() OVER (
      PARTITION BY document_name 
      ORDER BY timestamp DESC
    ) as rn
  FROM `links_transactions.tasks_raw_changelog`
)
SELECT
  document_name as task_id,
  JSON_VALUE(data, '$.status') as status,
  JSON_VALUE(data, '$.notes') as notes,
  JSON_VALUE(data, '$.date') as date,
  JSON_VALUE(data, '$.department') as department,
  JSON_VALUE(data, '$.targetDate') as target_date,
  JSON_VALUE(data, '$.updatedBy') as updated_by,
  timestamp as updated_at
FROM ranked_tasks
WHERE rn = 1 AND operation != 'DELETE';

-- 2. Parse Documents Changelog into a "Latest State" View
CREATE OR REPLACE VIEW `links_transactions.documents_raw_latest` AS
WITH ranked_docs AS (
  SELECT
    document_name,
    timestamp,
    operation,
    data,
    ROW_NUMBER() OVER (
      PARTITION BY document_name 
      ORDER BY timestamp DESC
    ) as rn
  FROM `links_transactions.documents_raw_changelog`
)
SELECT
  document_name as doc_id,
  JSON_VALUE(data, '$.filename') as filename,
  JSON_VALUE(data, '$.deal') as deal,
  JSON_VALUE(data, '$.type') as type,
  JSON_VALUE(data, '$.summary') as summary,
  JSON_VALUE(data, '$.text_snippet') as text_snippet,
  JSON_VALUE(data, '$.url') as url,
  timestamp as updated_at
FROM ranked_docs
WHERE rn = 1 AND operation != 'DELETE';
