# LINKS Transaction AI

Internal acquisitions, diligence, and integration assistant for Links Car Wash. This application serves as a centralized "Deal Room" dashboard, visualizing the M&A pipeline and providing an AI-powered document search interface.

## 🚀 Features

- **Portfolio Dashboard**: Real-time visualization of active deals, sites under contract, and critical path blockers.
- **Task & Diligence Tracker**: Kanban-style board for tracking standard acquisition phases (R-1 to Integration).
- **Document AI (RAG)**: Retrieval-Augmented Generation chat interface using Google Gemini 2.5 Flash to answer questions about PSAs, ESAs, and Title Commitments.
- **Integration Planning**: Standardized operational checklists mapped to active deals.
- **Site Profiles**: Individual site tracking integrated with Monday.com data structures.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Charts**: Recharts
- **AI**: Google GenAI SDK (`gemini-2.5-flash`)
- **Data Source**: Google Cloud Storage (Public Bucket) with Fallback to Local Mocks.
- **Icons**: Lucide React

## 📂 Project Structure

```
/
├── components/       # UI Components (Dashboard, TaskBoard, DocumentChat, etc.)
├── contexts/         # React Context for global state (DataContext)
├── services/         # External API integrations
│   ├── dataService.ts   # Google Cloud Storage fetch logic
│   └── geminiService.ts # Google Gemini AI interaction logic
├── types.ts          # TypeScript interfaces for data models
├── constants.ts      # Fallback mock data
└── App.tsx           # Main application shell and routing
```

## 🔌 Data Architecture

The application attempts to fetch live data from a public Google Cloud Storage bucket (`links-transaction-ai`) on startup.

1.  **Live Mode**: Fetches `roadmap.json`, `task_status.json`, `documents.json`, etc., from GCS.
2.  **Offline/Fallback Mode**: If the fetch fails (network error or CORS block), the app seamlessly switches to `constants.ts` (Mock Data) to ensure the UI remains functional.

## 🤖 AI Integration

The **Document Chat** uses a specialized RAG pipeline:
1.  **Retrieval**: Filters the loaded `documents.json` and `task_status.json` based on user keywords.
2.  **Context Injection**: Injects relevant text snippets and task notes into the Gemini prompt.
3.  **Generation**: Uses `gemini-2.5-flash` to synthesize an answer with citations.

## 📦 Setup

1.  Ensure `process.env.API_KEY` is set with a valid Google GenAI API key.
2.  Install dependencies and run the development server.

```bash
npm install
npm start
```
