-- Embedding generation using BigQuery AI functions.
-- Ensure the "Text embedding" model is enabled for the project.
-- Dataset: links-transaction-ai.links_transactions

-- Document embeddings (semantic search over metadata/snippets)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.document_embeddings`
PARTITION BY DATE(uploaded_at)
CLUSTER BY deal, doc_type AS
SELECT
  doc_id,
  deal,
  doc_type,
  summary,
  text_snippet,
  uploaded_at,
  AI.GENERATE_EMBEDDING(
    MODEL => 'text-embedding-004',
    TEXT => CONCAT(COALESCE(summary, ''), '\n', COALESCE(text_snippet, ''))
  ).embedding AS embedding
FROM `links-transaction-ai.links_transactions.documents_snapshot`
WHERE summary IS NOT NULL OR text_snippet IS NOT NULL;

-- Task embeddings (optional, for blockage prediction + semantic search)
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.task_embeddings`
PARTITION BY DATE(updated_at)
CLUSTER BY deal_name, department AS
SELECT
  task_id,
  deal_name,
  department,
  status,
  updated_at,
  text_description,
  AI.GENERATE_EMBEDDING(
    MODEL => 'text-embedding-004',
    TEXT => text_description
  ).embedding AS embedding
FROM `links-transaction-ai.links_transactions.task_features`;
