
-- 1. Document Embeddings
CREATE OR REPLACE TABLE `links_transactions.document_embeddings` AS
SELECT
  d.doc_id,
  d.deal,
  d.doc_type,
  d.summary,
  d.text_snippet,
  ML.GENERATE_EMBEDDING(
    MODEL `links_transactions.embedding_model`,
    (d.summary || '\n' || d.text_snippet)
  ).embedding AS embedding
FROM `links_transactions.documents_snapshot` d
WHERE d.summary IS NOT NULL;

-- 2. Task Embeddings
CREATE OR REPLACE TABLE `links_transactions.task_embeddings` AS
SELECT
  task_id,
  deal_name,
  department,
  notes AS text,
  ML.GENERATE_EMBEDDING(
    MODEL `links_transactions.embedding_model`,
    notes
  ).embedding AS embedding
FROM `links_transactions.tasks_snapshot`
WHERE notes IS NOT NULL;
