import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
} from 'firebase/auth';

// Polyfill atob/btoa for Firebase Web SDK in Node.
if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (data) => Buffer.from(data, 'base64').toString('binary');
}
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (data) => Buffer.from(data, 'binary').toString('base64');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const firebaseConfig = {
  apiKey: 'AIzaSyCJO1Psik7vshCPE4zBGKvPw3S7qdmZDEQ',
  authDomain: 'links-transaction-ai.firebaseapp.com',
  projectId: 'links-transaction-ai',
  storageBucket: 'links-transaction-ai.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loadJson = (filename) => {
  const p = path.join(root, 'public', 'data', filename);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const ensureAuth = async () => {
  const cred = await signInAnonymously(auth);
  return cred.user;
};

const upsertDeals = async () => {
  const raw = loadJson('roadmap.json');
  const deals = Array.isArray(raw) ? raw : raw.deals || [];
  let count = 0;
  for (const deal of deals) {
    const id = (deal.deal_name || deal.name || `deal_${count}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    await setDoc(doc(db, 'deals', id), {
      deal_name: deal.deal_name || deal.name || id,
      status: deal.status || deal.type || 'Diligence',
      closing_date: deal.closing_date || deal?.key_dates?.closing_target || '',
      ...deal,
    });
    count += 1;
    if (count % 100 === 0) console.log(`Deals written: ${count}`);
  }
  console.log(`Imported deals: ${deals.length}`);
};

const upsertTasks = async () => {
  const raw = loadJson('task_status.json');
  const entries = Object.entries(raw || {});
  let count = 0;
  for (const [key, val] of entries) {
    const isObj = val && typeof val === 'object';
    const status =
      isObj && val.status
        ? val.status
        : val === true || (typeof val === 'string' && val.toLowerCase() === 'true')
          ? 'Completed'
          : 'Not Started';
    await setDoc(doc(db, 'tasks', key), {
      status,
      date: isObj ? val.date || '' : '',
      notes: isObj ? val.notes || '' : '',
      department: isObj ? val.department : undefined,
      targetDate: isObj ? val.targetDate : undefined,
      updatedBy: isObj ? val.updatedBy : undefined,
      originalKey: key,
    });
    count += 1;
    if (count % 300 === 0) console.log(`Tasks written: ${count}`);
  }
  console.log(`Imported tasks: ${entries.length}`);
};

const upsertDocuments = async () => {
  const raw = loadJson('documents.json');
  const docs = Array.isArray(raw) ? raw : raw.documents || [];
  let count = 0;
  for (const docEntry of docs) {
    const id = docEntry.id || docEntry.filename || `doc_${count}`;
    await setDoc(doc(db, 'documents', id), docEntry);
    count += 1;
    if (count % 200 === 0) console.log(`Documents written: ${count}`);
  }
  console.log(`Imported documents: ${docs.length}`);
};

const upsertChecklist = async () => {
  const raw = loadJson('checklist_data.json');
  const items = Array.isArray(raw) ? raw : raw.checklist || [];
  let count = 0;
  for (const item of items) {
    const id = (item.task || `item_${count}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    await setDoc(doc(db, 'checklist', id), item);
    count += 1;
  }
  console.log(`Imported checklist: ${items.length}`);
};

const upsertSites = async () => {
  const raw = loadJson('monday_data.json');
  const items = Array.isArray(raw) ? raw : raw.sites || [];
  let count = 0;
  for (const item of items) {
    const id = (item.task || `site_${count}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    await setDoc(doc(db, 'sites', id), item);
    count += 1;
  }
  console.log(`Imported sites: ${items.length}`);
};

const main = async () => {
  await ensureAuth();
  console.log('Authenticated anonymously; seeding Firestore...');
  await upsertDeals();
  await upsertTasks();
  await upsertDocuments();
  await upsertChecklist();
  await upsertSites();
  console.log('Import complete.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
