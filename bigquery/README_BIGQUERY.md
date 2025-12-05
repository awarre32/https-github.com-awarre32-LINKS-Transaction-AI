
# Links Transaction AI - BigQuery Analytics Layer

This directory contains the SQL scripts to build a comprehensive analytics and ML layer for Links Transaction AI on Google BigQuery.

## Setup

1.  **Install Stream Firestore to BigQuery Extension**:
    *   Configure it to stream `tasks` and `documents` collections to the `links_transactions` dataset.


## Loading Data

### Option 1: Streaming (Production)
Configure the "Stream Firestore to BigQuery" extension to stream `tasks` and `documents` collections.

### Option 2: Local Bulk Load (Development/Backfill)
1.  **Scan Dropbox**: Run the ingestion script to generate metadata from your local Dropbox folder:
    ```bash
    node scripts/ingest_dropbox.cjs
    ```
2.  **Load to BigQuery**: Load the generated metadata and other JSON files into BigQuery:
    ```bash
    node scripts/load_local_to_bigquery.cjs
    ```


*   Use `scripts/run_bigquery.cjs` to automate the execution of these scripts (requires BigQuery API access).
*   Schedule `predictions.sql` to run periodically to keep risk scores up to date.

## Querying

*   Always filter by partition columns (`updated_at`, `uploaded_at`).
*   Use `mv_deal_readiness` for fast dashboard loading.
*   Use `SEARCH(text_snippet, 'query')` for fast document searching.
