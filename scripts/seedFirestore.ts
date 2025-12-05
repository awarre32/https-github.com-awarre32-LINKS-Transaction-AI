import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Seed Firestore collections from local JSON files.
 * Expects service account key in GOOGLE_APPLICATION_CREDENTIALS or uses application default.
 * Collections:
 *  - deals            <- roadmap.json (deals[])
 *  - tasks            <- task_status.json (key -> status/notes/date)
 *  - documents        <- documents.json (array)
 *  - checklist        <- checklist_data.json (array)
 *  - sites            <- monday_data.json (array)
 */

const loadJson = (filename: string) => {
  const p = path.join(process.cwd(), filename);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const app = getApps().length ? getApp() : initializeApp();
const db = getFirestore(app);

const seedDeals = async () => {
  const raw = loadJson('roadmap.json');
  const deals = Array.isArray(raw) ? raw : raw.deals || [];
  const batch = db.batch();
  const col = db.collection('deals');
  deals.forEach((deal: any, idx: number) => {
    const id = deal.deal_name || deal.name || `deal_${idx}`;
    batch.set(col.doc(id), {
      deal_name: deal.deal_name || deal.name || id,
      status: deal.status || deal.type || 'Diligence',
      closing_date: deal.closing_date || deal?.key_dates?.closing_target || '',
      ...deal
    });
  });
  await batch.commit();
  console.log(`Seeded deals: ${deals.length}`);
};

const seedTasks = async () => {
  const raw = loadJson('task_status.json');
  const entries = Object.entries(raw || {});
  const batch = db.batch();
  const col = db.collection('tasks');
  entries.forEach(([key, val]) => {
    const v = (val as any);
    const status =
      typeof v === 'object' && v.status ? v.status :
      v === true || (typeof v === 'string' && v.toLowerCase() === 'true') ? 'Completed' : 'Not Started';
    batch.set(col.doc(key), {
      status,
      date: typeof v === 'object' ? v.date || '' : '',
      notes: typeof v === 'object' ? v.notes || '' : '',
      originalKey: key,
    });
  });
  await batch.commit();
  console.log(`Seeded tasks: ${entries.length}`);
};

const seedDocuments = async () => {
  const raw = loadJson('documents.json');
  const docs = Array.isArray(raw) ? raw : raw.documents || [];
  const batch = db.batch();
  const col = db.collection('documents');
  docs.slice(0, 300).forEach((doc: any, idx: number) => {
    // limit batch size to keep it reasonable; adjust as needed
    const id = doc.id || doc.filename || `doc_${idx}`;
    batch.set(col.doc(id), doc);
  });
  await batch.commit();
  console.log(`Seeded documents (first 300): ${Math.min(docs.length, 300)} of ${docs.length}`);
};

const seedChecklist = async () => {
  const raw = loadJson('checklist_data.json');
  const items = Array.isArray(raw) ? raw : raw.checklist || [];
  const batch = db.batch();
  const col = db.collection('checklist');
  items.forEach((item: any, idx: number) => {
    const id = item.task ? item.task.replace(/[^a-zA-Z0-9]/g, '_') : `item_${idx}`;
    batch.set(col.doc(id), item);
  });
  await batch.commit();
  console.log(`Seeded checklist: ${items.length}`);
};

const seedSites = async () => {
  const raw = loadJson('monday_data.json');
  const items = Array.isArray(raw) ? raw : raw.sites || [];
  const batch = db.batch();
  const col = db.collection('sites');
  items.forEach((item: any, idx: number) => {
    const id = item.task ? item.task.replace(/[^a-zA-Z0-9]/g, '_') : `site_${idx}`;
    batch.set(col.doc(id), item);
  });
  await batch.commit();
  console.log(`Seeded sites: ${items.length}`);
};

const main = async () => {
  await seedDeals();
  await seedTasks();
  await seedDocuments();
  await seedChecklist();
  await seedSites();
  console.log("Seeding complete.");
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
