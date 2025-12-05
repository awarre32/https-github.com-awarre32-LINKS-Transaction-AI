import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as crypto from 'crypto';
import * as pdfParse from 'pdf-parse';

// Initialize Admin SDK once per instance
const app = initializeApp();
const db = getFirestore(app);
const storage = getStorage(app);

const DEAL_MAP: Record<string, string> = {
  richs: "Rich's 7-Site Deal",
  slappys: "Slappy's 5-Site Deal",
  arcadia: 'Arcadia',
  clean_as_a_whistle: 'Clean As a Whistle',
  take5_anderson: 'Take 5 Anderson',
  top_edge: 'Top Edge',
};

const inferDeal = (filePath: string): string | null => {
  const parts = filePath.toLowerCase().split('/');
  for (const key of Object.keys(DEAL_MAP)) {
    if (parts.includes(key)) return DEAL_MAP[key];
  }
  return null;
};

const classifyDoc = (filename: string): string | null => {
  const lower = filename.toLowerCase();
  if (lower.includes('psa')) return 'PSA';
  if (lower.includes('title')) return 'Title';
  if (lower.includes('survey')) return 'Survey';
  if (lower.includes('esa') || lower.includes('environmental')) return 'ESA';
  if (lower.includes('financial') || lower.includes('p&l') || lower.includes('ebitda')) return 'Financial';
  return null;
};

const REGION = 'us-central1';
const DEFAULT_BUCKET = 'links-transaction-ai.firebasestorage.app';
const SEED_KEY = process.env.SEED_KEY || 'links-seed';

export const ingestVdrFile = functions
  .region(REGION)
  .storage
  .bucket(DEFAULT_BUCKET)
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name || '';
    if (!filePath.startsWith('vdr/')) return;

    const bucketName = object.bucket || DEFAULT_BUCKET;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const [buffer] = await file.download();

    let text = '';
    let needs_ocr = false;
    try {
      if ((object.contentType || '').includes('pdf')) {
        const parsed = await pdfParse(buffer);
        text = parsed.text || '';
      }
    } catch (err) {
      console.error('PDF parse error', err);
      needs_ocr = true;
    }

    const deal = inferDeal(filePath);
    const docType = classifyDoc(filePath);
    const snippet = text ? text.slice(0, 500) : '';
    const summary = text ? text.split('\n').slice(0, 5).join(' ').slice(0, 500) : '';
    const docId = crypto.createHash('sha1').update(filePath).digest('hex');

    await db.collection('documents').doc(docId).set({
      filename: filePath,
      deal,
      needs_ocr,
      summary,
      text_snippet: snippet,
      full_text: text ? text.slice(0, 5000) : '',
      type: docType,
      url: `gs://${bucketName}/${filePath}`,
      uploadedAt: new Date().toISOString(),
    }, { merge: true });

    return;
  });

export const updateDealStatsOnTaskWrite = functions.region(REGION).firestore
  .document('tasks/{taskId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() as any : null;
    const dealName = after?.originalKey ? String(after.originalKey).split('_')[0] : after?.dealName;
    if (!dealName) return;

    const snap = await db.collection('tasks').where('originalKey', '>=', `${dealName}_`).where('originalKey', '<', `${dealName}~`).get();
    let total = 0, completed = 0, blocked = 0;
    snap.forEach(doc => {
      total += 1;
      const val = doc.data() as any;
      const status = val.status || 'Not Started';
      if (status === 'Completed') completed += 1;
      if (status === 'Blocked') blocked += 1;
    });

    const readiness = total > 0 ? Math.round((completed / total) * 100) : 0;
    const dealId = dealName.replace(/[^a-zA-Z0-9_-]/g, '_');
    await db.collection('deals').doc(dealId).set({
      stats: {
        totalTasks: total,
        completedTasks: completed,
        blockedTasks: blocked,
        readinessPercent: readiness,
        lastComputed: new Date(),
      }
    }, { merge: true });
  });

export const recomputeAllDealStatsNightly = functions.region(REGION).pubsub
  .schedule('0 7 * * *')
  .timeZone('America/New_York')
  .onRun(async () => {
    const dealsSnap = await db.collection('deals').get();
    for (const d of dealsSnap.docs) {
      const dealName = (d.data() as any).deal_name || d.id;
      const snap = await db.collection('tasks').where('originalKey', '>=', `${dealName}_`).where('originalKey', '<', `${dealName}~`).get();
      let total = 0, completed = 0, blocked = 0;
      snap.forEach(doc => {
        total += 1;
        const val = doc.data() as any;
        const status = val.status || 'Not Started';
        if (status === 'Completed') completed += 1;
        if (status === 'Blocked') blocked += 1;
      });
      const readiness = total > 0 ? Math.round((completed / total) * 100) : 0;
      await d.ref.set({ stats: { totalTasks: total, completedTasks: completed, blockedTasks: blocked, readinessPercent: readiness, lastComputed: new Date() } }, { merge: true });
    }
    return null;
  });

type SeedCounts = {
  deals: number;
  tasks: number;
  documents: number;
  checklist: number;
  sites: number;
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const cleanUndefined = (val: any): any => {
  if (Array.isArray(val)) {
    return val.map(cleanUndefined);
  }
  if (val && typeof val === 'object') {
    const out: Record<string, any> = {};
    Object.entries(val).forEach(([k, v]) => {
      if (v === undefined) return;
      out[k] = cleanUndefined(v);
    });
    return out;
  }
  return val;
};

const sanitizeId = (raw: string, prefix: string, idx: number): string => {
  const cleaned = (raw || '').replace(/\//g, '_').trim();
  return cleaned || `${prefix}_${idx}`;
};

const truncateString = (val: any, max: number): string => {
  if (typeof val !== 'string') return '';
  return val.length > max ? val.slice(0, max) : val;
};

const sanitizeDocumentEntry = (entry: any, idx: number) => {
  const filename = entry.filename || entry.file || `doc_${idx}`;
  return {
    filename,
    deal: entry.deal || entry.deal_name || null,
    site: entry.site || null,
    type: entry.type || entry.doc_type || null,
    needs_ocr: Boolean(entry.needs_ocr),
    summary: truncateString(entry.summary || entry.description || '', 1200),
    text_snippet: truncateString(entry.text_snippet || entry.snippet || '', 2000),
    uploadedAt: entry.uploadedAt || entry.uploaded_at || new Date().toISOString(),
    url: entry.url || entry.link || '',
  };
};

export const seedFromHostedJson = functions.region(REGION).runWith({ memory: '1GB', timeoutSeconds: 540 }).https.onRequest(async (req, res) => {
  if (!SEED_KEY || req.query.key !== SEED_KEY) {
    res.status(403).send('Forbidden');
    return;
  }

  const base = 'https://links-transaction-ai.web.app/data';
  const fetchJson = async (name: string) => {
    const r = await fetch(`${base}/${name}`);
    if (!r.ok) throw new Error(`Failed to fetch ${name}: ${r.status}`);
    return r.json();
  };

  const counts: SeedCounts = { deals: 0, tasks: 0, documents: 0, checklist: 0, sites: 0 };

  // Deals
  const dealsRaw: any = await fetchJson('roadmap.json');
  const dealsArr: any[] = Array.isArray(dealsRaw) ? dealsRaw : dealsRaw.deals || [];
  for (const batchArr of chunk(dealsArr, 400)) {
    const batch = db.batch();
    batchArr.forEach((deal, idx) => {
      const rawId = deal.deal_name || deal.name || `deal_${counts.deals + idx}`;
      const id = sanitizeId(rawId, 'deal', counts.deals + idx).replace(/[^a-zA-Z0-9_-]/g, '_');
      batch.set(db.collection('deals').doc(id), cleanUndefined({
        deal_name: deal.deal_name || deal.name || id,
        status: deal.status || deal.type || 'Diligence',
        closing_date: deal.closing_date || deal?.key_dates?.closing_target || '',
        ...deal,
      }));
    });
    await batch.commit();
    counts.deals += batchArr.length;
  }

  // Tasks
  const tasksRaw: any = await fetchJson('task_status.json');
  const taskEntries = Object.entries(tasksRaw || {});
  for (const batchArr of chunk(taskEntries, 400)) {
    const batch = db.batch();
    batchArr.forEach(([key, val], idx) => {
      const isObj = val && typeof val === 'object';
      const status = isObj && (val as any).status
        ? (val as any).status
        : val === true || (typeof val === 'string' && (val as string).toLowerCase() === 'true')
          ? 'Completed'
          : 'Not Started';
      const payload: Record<string, unknown> = {
        status,
        date: isObj ? (val as any).date || '' : '',
        notes: isObj ? (val as any).notes || '' : '',
        originalKey: key,
      };
      if (isObj && (val as any).department) payload.department = (val as any).department;
      if (isObj && (val as any).targetDate) payload.targetDate = (val as any).targetDate;
      if (isObj && (val as any).updatedBy) payload.updatedBy = (val as any).updatedBy;
      const docId = sanitizeId(key, 'task', counts.tasks + idx);
      batch.set(db.collection('tasks').doc(docId), cleanUndefined(payload));
    });
    await batch.commit();
    counts.tasks += batchArr.length;
  }

  // Documents
  const docsRaw: any = await fetchJson('documents.json');
  const docsArr: any[] = Array.isArray(docsRaw) ? docsRaw : docsRaw.documents || [];
  for (const batchArr of chunk(docsArr, 50)) {
    const batch = db.batch();
    batchArr.forEach((docEntry, idx) => {
      const rawId = docEntry.id || docEntry.filename || `doc_${counts.documents + idx}`;
      const id = sanitizeId(rawId, 'doc', counts.documents + idx);
      const sanitized = sanitizeDocumentEntry(docEntry, counts.documents + idx);
      batch.set(db.collection('documents').doc(id), cleanUndefined(sanitized));
    });
    await batch.commit();
    counts.documents += batchArr.length;
  }

  // Checklist
  const checklistRaw: any = await fetchJson('checklist_data.json');
  const checklistArr: any[] = Array.isArray(checklistRaw) ? checklistRaw : checklistRaw.checklist || [];
  for (const batchArr of chunk(checklistArr, 400)) {
    const batch = db.batch();
    batchArr.forEach((item, idx) => {
      const rawId = item.task || `item_${counts.checklist + idx}`;
      const id = sanitizeId(rawId, 'item', counts.checklist + idx).replace(/[^a-zA-Z0-9_-]/g, '_');
      batch.set(db.collection('checklist').doc(id), cleanUndefined(item));
    });
    await batch.commit();
    counts.checklist += batchArr.length;
  }

  // Sites
  const sitesRaw: any = await fetchJson('monday_data.json');
  const sitesArr: any[] = Array.isArray(sitesRaw) ? sitesRaw : sitesRaw.sites || [];
  for (const batchArr of chunk(sitesArr, 400)) {
    const batch = db.batch();
    batchArr.forEach((item, idx) => {
      const rawId = item.task || `site_${counts.sites + idx}`;
      const id = sanitizeId(rawId, 'site', counts.sites + idx).replace(/[^a-zA-Z0-9_-]/g, '_');
      batch.set(db.collection('sites').doc(id), cleanUndefined(item));
    });
    await batch.commit();
    counts.sites += batchArr.length;
  }

  res.status(200).json({ ok: true, counts });
});
