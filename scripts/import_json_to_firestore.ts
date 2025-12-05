import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const loadJson = (filename: string) => {
  const p = path.join(process.cwd(), 'public', 'data', filename);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const app = getApps().length ? getApp() : initializeApp();
const db = getFirestore(app);

const upsertDeals = async () => {
  const raw = loadJson('roadmap.json');
  const deals = Array.isArray(raw) ? raw : raw.deals || [];
  const batch = db.batch();
  const col = db.collection('deals');
  deals.forEach((deal: any, idx: number) => {
    const id = (deal.deal_name || deal.name || `deal_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    batch.set(col.doc(id), {
      deal_name: deal.deal_name || deal.name || id,
      status: deal.status || deal.type || 'Diligence',
      closing_date: deal.closing_date || deal?.key_dates?.closing_target || '',
      ...deal,
    });
  });
  await batch.commit();
  console.log(`Imported deals: ${deals.length}`);
};

const upsertTasks = async () => {
  const raw = loadJson('task_status.json');
  const entries = Object.entries(raw || {});
  const col = db.collection('tasks');
  let batch = db.batch();
  let count = 0;

  for (const [key, val] of entries) {
    const isObj = val && typeof val === 'object';
    const status =
      isObj && (val as any).status
        ? (val as any).status
        : val === true || (typeof val === 'string' && val.toLowerCase() === 'true')
          ? 'Completed'
          : 'Not Started';
    batch.set(col.doc(key), {
      status,
      date: isObj ? (val as any).date || '' : '',
      notes: isObj ? (val as any).notes || '' : '',
      department: isObj ? (val as any).department : undefined,
      targetDate: isObj ? (val as any).targetDate : undefined,
      updatedBy: isObj ? (val as any).updatedBy : undefined,
      originalKey: key,
    });
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`Imported tasks: ${entries.length}`);
};

const upsertDocuments = async () => {
  const raw = loadJson('documents.json');
  const docs = Array.isArray(raw) ? raw : raw.documents || [];
  const col = db.collection('documents');
  let batch = db.batch();
  let count = 0;

  docs.forEach((doc: any, idx: number) => {
    const id = doc.id || doc.filename || `doc_${idx}`;
    batch.set(col.doc(id), doc);
    count++;
    if (count % 300 === 0) {
      batch.commit();
      batch = db.batch();
    }
  });
  await batch.commit();
  console.log(`Imported documents: ${docs.length}`);
};

const upsertChecklist = async () => {
  const raw = loadJson('checklist_data.json');
  const items = Array.isArray(raw) ? raw : raw.checklist || [];
  const col = db.collection('checklist');
  let batch = db.batch();
  items.forEach((item: any, idx: number) => {
    const id = (item.task || `item_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    batch.set(col.doc(id), item);
  });
  await batch.commit();
  console.log(`Imported checklist: ${items.length}`);
};

const upsertSites = async () => {
  const raw = loadJson('monday_data.json');
  const items = Array.isArray(raw) ? raw : raw.sites || [];
  const col = db.collection('sites');
  let batch = db.batch();
  items.forEach((item: any, idx: number) => {
    const id = (item.task || `site_${idx}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    batch.set(col.doc(id), item);
  });
  await batch.commit();
  console.log(`Imported sites: ${items.length}`);
};

const main = async () => {
  await upsertDeals();
  await upsertTasks();
  await upsertDocuments();
  await upsertChecklist();
  await upsertSites();
  console.log('Import complete.');
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
