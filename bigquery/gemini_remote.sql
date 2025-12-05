-- Remote Gemini model + fact extraction
-- Ensure a Vertex AI connection exists and replace CONNECTION_NAME / REGION as needed.
-- Dataset: links-transaction-ai.links_transactions

-- Create a remote Gemini model reference
CREATE OR REPLACE MODEL `links-transaction-ai.links_transactions.gemini_remote`
REMOTE WITH CONNECTION `PROJECT_REGION.CONNECTION_NAME`
OPTIONS (endpoint = 'projects/links-transaction-ai/locations/us-central1/publishers/google/models/gemini-1.5-pro');

-- Example: extract structured facts from PSA / Title / ESA docs
CREATE OR REPLACE TABLE `links-transaction-ai.links_transactions.document_facts` AS
SELECT
  doc_id,
  deal,
  doc_type,
  AI.GENERATE_TEXT(
    MODEL => 'models/gemini-1.5-pro',
    PROMPT => CONCAT(
      'Extract key facts as JSON only. For PSAs include purchase_price, effective_date, outside_date, key_closing_conditions. ',
      'For Title include policy_amount, issue_date, count_of_exceptions. ',
      'For ESA include rec_or_norec and summary_of_concerns. ',
      'Return strictly valid JSON with those keys if applicable. Input follows:\n\n',
      COALESCE(summary, ''),
      '\n',
      COALESCE(text_snippet, '')
    )
  ) AS facts_json
FROM `links-transaction-ai.links_transactions.documents_snapshot`
WHERE doc_type IN ('PSA', 'Title', 'ESA');
