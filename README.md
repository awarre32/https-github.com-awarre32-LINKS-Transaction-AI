# LINKS Transaction AI

Internal cockpit + AI assistant for Links Car Wash deals. React + Vite + TypeScript with Firebase (Auth/Firestore/Storage/Functions/Hosting) and Gemini for RAG.

## Env Setup

Create `.env` with your Firebase + Gemini keys (copy from `.env.example`):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=links-transaction-ai
VITE_FIREBASE_STORAGE_BUCKET=links-transaction-ai.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
# set to true when using emulators
# VITE_USE_EMULATOR=true
```

Install deps:
```
npm install
```

Run dev (optionally with emulators):
```
# start emulators in another shell: firebase emulators:start --only firestore,auth,storage
VITE_USE_EMULATOR=true npm run dev
```

Build / deploy hosting:
```
npm run build
firebase deploy --only hosting
```

## Firestore as source of truth
Collections:
- `deals` – roadmap & stats
- `tasks` – diligence/closing/integration tasks (keys match `<Deal>_<Phase>_<Task>`)
- `documents` – VDR index (ingested from Storage)
- `checklist` – template integration tasks
- `sites` – site-level status

Dept/deal filters are non-blocking: all views stay visible; filters only narrow the data.

## Scripts (run with service account via GOOGLE_APPLICATION_CREDENTIALS)
- `npm run import:firestore` – load the 5 seed JSONs from `public/data` into Firestore.
- `npm run export:json` – snapshot Firestore back into `public/data`.
- `npm run seed:firestore` – legacy seed helper (optional).

## Functions (Node 18, in /functions)
- Storage trigger `ingestVdrFile`: watches `vdr/**`, parses PDFs, classifies, writes to `documents`.
- Firestore trigger `updateDealStatsOnTaskWrite`: recomputes per-deal task stats.
- Scheduled `recomputeAllDealStatsNightly`: nightly safety recompute.

To deploy functions:
```
cd functions
npm install
npm run build
firebase deploy --only functions
```

## VDR ingestion flow
1) Sync local Dropbox VDR to Storage under `vdr/` (e.g., `vdr/richs/...`, `vdr/slappys/...`).
2) `ingestVdrFile` extracts text (pdf-parse), infers deal/type, writes metadata to `documents`.

## AI / Gemini
- `services/geminiService.ts` implements retrieval with deal/department context.
- Deal cards include AI actions: Verify Title, Summarize ESA, Missing Docs.
- DocumentChat sends deal/dept context and returns evidence-backed answers.

## UI
- Sidebar with enlarged Links logo.
- Dept/Deal filters at top of main content; filters never block views.
- Dashboard: readiness, blockers, charts, AI deal tools.
- TaskBoard: department/deal-filtered tasks with inline status updates (persist to Firestore).
- Sites: per-deal open task counts for selected department.
- Documents/Chat: role-aware AI responses with evidence.

## Seeding live data (hosted JSON → Firestore)
- Cloud Function `seedFromHostedJson` pulls the 5 canonical JSON files from Hosting (`/data/*.json`) and writes them into Firestore with sanitized IDs and trimmed document metadata.
- Endpoint (secured by key): `https://us-central1-links-transaction-ai.cloudfunctions.net/seedFromHostedJson?key=links-seed`
- Run after deploying functions to backfill: visit the URL once, or call via curl.

## BigQuery analytics layer
- See `bigquery/README_BIGQUERY.md` for Firestore→BigQuery streaming expectations, schema/materialized views, embeddings, and BigQuery ML models (deal risk, task blockage).
- Apply the SQL files in `bigquery/` via `bq query --use_legacy_sql=false < file.sql` in the order listed in that README.
