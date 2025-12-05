import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log("Initializing Firebase with project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const importData = async () => {
    console.log("Starting data ingestion (Optimized Mode)...");

    try {
        // 1. Roadmap (Deals)
        const roadmapPath = path.resolve(__dirname, "../import_data/roadmap.json");
        if (fs.existsSync(roadmapPath)) {
            const roadmapData = JSON.parse(fs.readFileSync(roadmapPath, "utf-8"));
            const dealsRef = collection(db, "deals");
            const deals = Array.isArray(roadmapData) ? roadmapData : roadmapData.deals || [];

            console.log(`Found ${deals.length} deals to import.`);

            for (let i = 0; i < deals.length; i += 25) {
                const chunk = deals.slice(i, i + 25);
                const dealBatch = writeBatch(db);

                chunk.forEach((deal: any) => {
                    const id = deal.deal_name ? deal.deal_name.replace(/[^a-zA-Z0-9]/g, "_") : `deal_${Date.now()}_${Math.random()}`;
                    const docRef = doc(dealsRef, id);
                    dealBatch.set(docRef, deal);
                });

                await dealBatch.commit();
                console.log(`Committed deals batch ${i / 25 + 1} / ${Math.ceil(deals.length / 25)}`);
                await sleep(500); // Throttle 500ms
            }
        } else {
            console.warn("roadmap.json not found.");
        }

        // 2. Documents
        const docsPath = path.resolve(__dirname, "../import_data/documents.json");
        if (fs.existsSync(docsPath)) {
            const docsData = JSON.parse(fs.readFileSync(docsPath, "utf-8"));
            const docsRef = collection(db, "documents");

            console.log(`Found ${docsData.length} documents to import.`);

            for (let i = 0; i < docsData.length; i += 25) {
                const chunk = docsData.slice(i, i + 25);
                const docBatch = writeBatch(db);

                chunk.forEach((d: any) => {
                    let id = d.filename ? d.filename.replace(/[/\\]/g, "_") : doc(docsRef).id;
                    const docRef = doc(docsRef, id);
                    docBatch.set(docRef, d);
                });

                await docBatch.commit();
                console.log(`Committed documents batch ${i / 25 + 1} / ${Math.ceil(docsData.length / 25)}`);
                await sleep(1000); // Throttle 1s for larger documents payload
            }
        } else {
            console.warn("documents.json not found.");
        }

        console.log("Data ingestion complete.");
        process.exit(0);

    } catch (error) {
        console.error("Error importing data:", error);
        process.exit(1);
    }
};

importData();
