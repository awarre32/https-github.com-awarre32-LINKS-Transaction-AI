
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ROOT = "C:\\Users\\AnthonyWarren\\.gemini\\antigravity\\playground\\spectral-crater";
const PUBLIC_DOCS_DIR = path.join(__dirname, '../public/documents');
const PUBLIC_DATA_FILE = path.join(__dirname, '../public/data/documents.json');
const IMPORT_DATA_FILE = path.join(__dirname, '../import_data/documents.json');

// Ensure directory exists
if (!fs.existsSync(PUBLIC_DOCS_DIR)) {
    fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });
}

function sanitizeString(str: string): string {
    if (!str) return "";
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
}

async function setupLocalFiles() {
    console.log("Starting local file setup...");

    // Read original metadata
    if (!fs.existsSync(IMPORT_DATA_FILE)) {
        console.error("Source documents.json not found in import_data");
        return;
    }

    const rawData = fs.readFileSync(IMPORT_DATA_FILE, 'utf-8');
    const documents = JSON.parse(rawData);
    const updatedDocuments: any[] = [];

    console.log(`Processing ${documents.length} documents...`);
    let copyCount = 0;
    let missingCount = 0;

    for (const doc of documents) {
        const originalFilename = doc.filename;
        const basename = path.basename(originalFilename);
        const safeBasename = sanitizeString(basename).replace(/[^a-zA-Z0-9.-]/g, "_"); // Make URL-safe

        const sourcePath = path.join(SOURCE_ROOT, originalFilename);
        const destPath = path.join(PUBLIC_DOCS_DIR, safeBasename);

        let localUrl = "";

        // 1. Copy File
        if (fs.existsSync(sourcePath)) {
            try {
                fs.copyFileSync(sourcePath, destPath);
                localUrl = `/documents/${safeBasename}`;
                copyCount++;
            } catch (err) {
                console.error(`Failed to copy ${originalFilename}:`, err);
            }
        } else {
            // console.warn(`File missing: ${sourcePath}`);
            missingCount++;
        }

        // 2. Update Document Object
        // We keep the structure compatible with what the app expects
        const safeText = (doc.full_text || "").substring(0, 800000);

        updatedDocuments.push({
            ...doc,
            filename: basename, // Display name
            url: localUrl, // Local path for "View" button
            full_text: safeText, // Keep text for search
            text_snippet: sanitizeString(doc.text_snippet || safeText.substring(0, 200) + "..."),
            summary: sanitizeString(doc.summary || ""),
            uploadedAt: new Date().toISOString()
        });

        if (updatedDocuments.length % 50 === 0) process.stdout.write(".");
    }

    console.log(`\nWriting updated metadata to ${PUBLIC_DATA_FILE}...`);
    fs.writeFileSync(PUBLIC_DATA_FILE, JSON.stringify(updatedDocuments, null, 2));

    console.log(`\nSetup complete.`);
    console.log(`Copied: ${copyCount}`);
    console.log(`Missing: ${missingCount}`);
    console.log(`Total Metadata: ${updatedDocuments.length}`);
}

setupLocalFiles();
