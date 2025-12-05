Links Transaction AI – BigQuery Layer
=====================================

This folder adds a BigQuery analytics sidecar for the Firestore/Storage-backed app. It is designed to work with the Firebase **Stream Firestore to BigQuery** extension and modern BigQuery optimizations (partitioning, clustering, materialized views, search indexes, embeddings, and BigQuery ML).

Datasets and naming
-------------------
- Project: `links-transaction-ai`
- Dataset: `links_transactions`
- Extension outputs expected:
  - `links_transactions.tasks_raw_changelog`, `links_transactions.tasks_raw_latest`
  - `links_transactions.documents_raw_changelog`, `links_transactions.documents_raw_latest`
- Derived tables / views in this folder reference that dataset explicitly.

Extension configuration (for reference)
---------------------------------------
- Instance 1: tasks
  - Collection path: `tasks`
  - Dataset: `links_transactions`
  - Table prefix: `tasks`
- Instance 2: documents (recommended)
  - Collection path: `documents`
  - Dataset: `links_transactions`
  - Table prefix: `documents`

File map
--------
- `schema.sql` – snapshot/history tables from the extension streams, plus placeholders for deals/sites.
- `feature_tables.sql` – partitioned & clustered feature tables: `task_features`, `deal_features`, `site_features`.
- `views.sql` – materialized views (`mv_deal_readiness`, `mv_department_workload`), coverage views, and the documents search index.
- `embeddings.sql` – document and task embeddings via `AI.GENERATE_EMBEDDING` (`text-embedding-004`).
- `models.sql` – BigQuery ML models (deal risk, task blockage, optional readiness regression) + evaluation and prediction tables.
- `gemini_remote.sql` – remote Gemini model reference and example fact extraction into `document_facts`.
- `predictions.sql` – helper statements for scheduled prediction refresh tables.

How to apply
------------
Run from repo root (adjust for your env/credentials). Order matters:

1) Create base tables  
`bq query --use_legacy_sql=false < bigquery/schema.sql`

2) Create feature tables  
`bq query --use_legacy_sql=false < bigquery/feature_tables.sql`

3) Create views/materialized views + search index  
`bq query --use_legacy_sql=false < bigquery/views.sql`

4) Generate embeddings (requires AI embedding model enabled)  
`bq query --use_legacy_sql=false < bigquery/embeddings.sql`

5) Train models + create prediction tables  
`bq query --use_legacy_sql=false < bigquery/models.sql`

6) (Optional) Configure remote Gemini + fact extraction  
Edit `gemini_remote.sql` with your CONNECTION_NAME, then:  
`bq query --use_legacy_sql=false < bigquery/gemini_remote.sql`

7) Schedule prediction refreshes  
Use `bigquery/predictions.sql` as the scheduled query body (hourly or 4x/day, WRITE_TRUNCATE).

Backfill guidance
-----------------
- Use the extension’s backfill option to push existing Firestore data into BigQuery.
- For deals/sites (not streamed yet), load JSON exports into `deals_snapshot` / `sites_snapshot` or point external tables at Cloud Storage JSON.
- Keep raw changelog tables small by partition pruning on `timestamp` and clustering filters.

Querying best practices
-----------------------
- Avoid `SELECT *` in production; project only needed columns.
- Always filter on partition columns:
  - `tasks_snapshot`: `updated_at`
  - `tasks_history`: `timestamp`
  - `documents_snapshot`: `uploaded_at`
  - Feature tables: `feature_updated_at` / `updated_at`
- Add early filters on clustered columns: `deal_name`, `department`, `phase_code`, `status`, `doc_type`.
- Prefer materialized views (`mv_deal_readiness`, `mv_department_workload`) for dashboards.
- Use the search index on `documents_snapshot` for keyword lookups (SEARCH or LIKE).
- For Looker Studio/BI Engine, pin the high-traffic tables/views (tasks_snapshot, mv_deal_readiness, mv_department_workload).

Sanity-check queries
--------------------
- Tasks last 30 days:
```sql
SELECT deal_name, department, status, COUNT(*) AS task_count
FROM `links-transaction-ai.links_transactions.tasks_snapshot`
WHERE updated_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY deal_name, department, status
ORDER BY task_count DESC;
```

- Documents by type:
```sql
SELECT deal, doc_type, COUNT(*) AS doc_count
FROM `links-transaction-ai.links_transactions.documents_snapshot`
GROUP BY deal, doc_type
ORDER BY deal, doc_type;
```

- Materialized view check:
```sql
SELECT * FROM `links-transaction-ai.links_transactions.mv_deal_readiness`
ORDER BY readiness_percent ASC;
```

- Prediction check:
```sql
SELECT deal_name, risk_probability
FROM `links-transaction-ai.links_transactions.deal_risk_predictions`
ORDER BY risk_probability DESC
LIMIT 20;
```

Notes on costs and performance
------------------------------
- Partitioning + clustering are already applied; keep queries inside recent partitions when possible.
- Materialized views reduce repeated aggregation costs; refresh automatically when base tables change.
- Embeddings and Gemini calls incur AI charges; run them on deltas or via scheduled batches.
- Set reservation/slot/BΙ Engine size to match dashboard concurrency; start small and monitor.
