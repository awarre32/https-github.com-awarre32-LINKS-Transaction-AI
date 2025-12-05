
-- 1. Create Remote Model (Requires Connection)
CREATE OR REPLACE MODEL `links_transactions.gemini_remote_model`
REMOTE WITH CONNECTION `us-central1.gemini-connection`
OPTIONS (endpoint = 'gemini-1.5-pro');

-- 2. Extract Facts
CREATE OR REPLACE TABLE `links_transactions.document_facts` AS
SELECT
  d.deal,
  d.doc_id,
  d.doc_type,
  ML.GENERATE_TEXT(
    MODEL `links_transactions.gemini_remote_model`,
    (
      SELECT STRUCT(
        CONCAT(
          'Extract key facts from this document as JSON. For PSAs, include: purchase_price, effective_date, outside_date, key_closing_conditions. ',
          'For title policies, include: policy_amount, issue_date, count_of_exceptions. ',
          'For ESA, include: rec_or_norec, summary_of_concerns. ',
          'Return ONLY valid JSON with those keys if applicable.'
        ) AS prompt,
        d.summary || '\n' || d.text_snippet AS input_text
      )
    )
  ).output_text AS facts_json
FROM `links_transactions.documents_snapshot` d
WHERE d.doc_type IN ('PSA', 'Title', 'ESA');
