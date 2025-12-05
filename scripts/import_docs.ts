
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, connectStorageEmulator } from "firebase/storage";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Polyfills for Node.js environment
const XMLHttpRequest = require('xhr2');
global.XMLHttpRequest = XMLHttpRequest;
const WebSocket = require('ws');
// @ts-ignore
global.WebSocket = WebSocket;

// Configuration
const dotenv = require('dotenv');
dotenv.config();

const firebaseConfig = {
    apiKey: "demo-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Force emulator usage
console.log("Connecting to Firebase Emulators...");
connectFirestoreEmulator(db, 'localhost', 8080);
connectStorageEmulator(storage, 'localhost', 9199);

const IMPORT_DATA_PATH = path.join(__dirname, '../import_data');
const SOURCE_ROOT = "C:\\Users\\AnthonyWarren\\.gemini\\antigravity\\playground\\spectral-crater";

function sanitizeString(str: string): string {
    if (!str) return "";
    // Remove null bytes and other control characters
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
}

async function importDocs() {
    console.log("Starting import...");

    const docsPath = path.join(IMPORT_DATA_PATH, 'documents.json');
    if (!fs.existsSync(docsPath)) {
        console.error("documents.json not found in import_data");
        return;
    }

    const rawData = fs.readFileSync(docsPath, 'utf-8');
    const documents = JSON.parse(rawData);

    console.log(`Found ${documents.length} documents to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const doc of documents) {
        try {
            const fullPath = path.join(SOURCE_ROOT, doc.filename);
            let downloadURL = "";
            let fileType = doc.type || "Imported";

            // 1. Try to upload original file
            if (fs.existsSync(fullPath)) {
                const fileBuffer = fs.readFileSync(fullPath);
                const uint8Array = new Uint8Array(fileBuffer);
                const storageRef = ref(storage, `documents/${path.basename(doc.filename)}`);
                const snapshot = await uploadBytes(storageRef, uint8Array);
                downloadURL = await getDownloadURL(snapshot.ref);
            }
            // 2. If not found, create a text file from content and upload it
            else if (doc.full_text) {
                const textContent = doc.full_text;
                const textBuffer = Buffer.from(textContent, 'utf-8');
                const uint8Array = new Uint8Array(textBuffer);

                const txtFilename = path.basename(doc.filename) + ".txt";
                const storageRef = ref(storage, `documents/${txtFilename}`);
                const snapshot = await uploadBytes(storageRef, uint8Array);
                downloadURL = await getDownloadURL(snapshot.ref);
                fileType = "Text Extract";
            }

            // 3. Create Firestore Record
            const safeText = (doc.full_text || "");
            const safeSnippet = sanitizeString(doc.text_snippet || safeText.substring(0, 500) + "...");
            const safeSummary = sanitizeString(doc.summary || "Imported from analysis");
            const safeFilename = sanitizeString(path.basename(doc.filename) || "unknown_file");

            const docData: any = {
                filename: safeFilename,
                deal: doc.deal || null,
                needs_ocr: false,
                summary: safeSummary,
                text_snippet: safeSnippet,
                type: fileType,
                url: downloadURL || null,
                uploadedAt: new Date().toISOString(),
                originalPath: doc.filename || ""
            };

            Object.keys(docData).forEach(key => docData[key] === undefined && delete docData[key]);

            await addDoc(collection(db, "documents"), docData);
            successCount++;
            if (successCount % 10 === 0) console.log(`Processed ${successCount} documents...`);

        } catch (error) {
            console.error(`Error processing ${doc.filename}:`, error);
            failCount++;
        }
    }

    console.log(`Import complete. Success: ${successCount}, Failed: ${failCount}`);
    process.exit(0);
}

importDocs();
