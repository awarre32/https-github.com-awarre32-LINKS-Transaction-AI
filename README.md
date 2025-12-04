# LINKS Transaction AI

A React + TypeScript application for managing M&A transactions, powered by Firebase and Gemini AI.

## Branding

This project uses the official **Links Car Wash** branding.

### Brand Colors
- **Primary Green:** `#006747` (Buttons, Headers, Accents)
- **Dark Green:** `#052e22` (Sidebar, Dark Backgrounds)
- **Background:** `#F5F7FA` (App Canvas)
- **White:** `#FFFFFF` (Cards, Text on Green)

### Assets
Logos are stored in `src/assets/` and `public/`.
- `links-logo.png` (Standard Color)
- `links-logo-white.png` (White for dark backgrounds)
- `links-logo-transparent.png` (High-res transparent)

**Note:** Do not modify the logos or colors without checking the brand guidelines.

## Architecture

This project has been refactored to use **Firebase** as the single source of truth for all data, replacing the previous Google Cloud Storage (JSON) and GitHub integration.

### Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Database:** Firebase Firestore (Real-time updates)
- **AI:** Google Gemini (via Firebase Extension or direct API)
- **State Management:** React Context (DataContext)

### Data Sources
All data is stored in Firestore collections:
- `deals` (Roadmap)
- `tasks` (Diligence & Closing tasks)
- `documents` (VDR index)
- `checklist` (Integration templates)
- `sites` (Monday.com site list)

## Setup & Configuration

### 1. Environment Variables
Create a `.env` file in the root directory (copy `.env.example` if available) and add your Firebase and Gemini credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional: Use Local Emulators
# VITE_USE_EMULATOR=true
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Seed the Database
When you first run the app, if your Firestore is empty, you will see a **"Seed Database"** button in the sidebar. Click it to populate Firestore with the initial mock data (deals, tasks, etc.).

## Testing with Emulators

1. Ensure you have the Firebase CLI installed (`npm install -g firebase-tools`).
2. Run emulators:
   ```bash
   firebase emulators:start
   ```
3. In a separate terminal, run the app with emulator mode enabled:
   ```bash
   VITE_USE_EMULATOR=true npm run dev
   ```

## Folder Structure

- `src/components`: UI components (Dashboard, TaskBoard, DocumentChat, etc.)
- `src/contexts`: DataContext handling Firestore subscriptions.
- `src/services`:
  - `dataService.ts`: Firestore helper functions.
  - `geminiService.ts`: AI logic.
  - `seedService.ts`: Database seeding utility.
- `src/types.ts`: TypeScript interfaces.

## Migration Notes

- **GCS Removed:** The app no longer fetches JSON files from Google Cloud Storage.
- **GitHub Removed:** No Git logic exists in the client.
- **Real-time:** Updates to Firestore are reflected immediately in the UI.
