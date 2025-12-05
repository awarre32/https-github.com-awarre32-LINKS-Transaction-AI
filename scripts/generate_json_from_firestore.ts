import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length ? getApp() : initializeApp();
const db = getFirestore(app);

const writeJson = (filename: string, data: any) => {
  const outDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const p = path.join(outDir, filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${filename}`);
};

const exportDeals = async () => {
  const snap = await db.collection('deals').get();
  const deals = snap.docs.map(d => d.data());
  writeJson('roadmap.json', { deals });
};

const exportTasks = async () => {
  const snap = await db.collection('tasks').get();
  const tasks: Record<string, any> = {};
  snap.forEach(d => { tasks[d.id] = d.data(); });
  writeJson('task_status.json', tasks);
};

const exportDocuments = async () => {
  const snap = await db.collection('documents').limit(1000).get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  writeJson('documents.json', docs);
};

const exportChecklist = async () => {
  const snap = await db.collection('checklist').get();
  const items = snap.docs.map(d => d.data());
  writeJson('checklist_data.json', items);
};

const exportSites = async () => {
  const snap = await db.collection('sites').get();
  const items = snap.docs.map(d => d.data());
  writeJson('monday_data.json', items);
};

const main = async () => {
  await exportDeals();
  await exportTasks();
  await exportDocuments();
  await exportChecklist();
  await exportSites();
  console.log('Export complete.');
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
