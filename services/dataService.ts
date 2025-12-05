
import { db, storage, ensureAuth } from "../firebaseConfig";
import { collection, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap, TaskStatus } from "../types";

const preferFirestore = import.meta.env.VITE_USE_FIRESTORE !== 'false';

const mapDealStatus = (status?: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("closing")) return "Closing";
  if (normalized.includes("psa")) return "PSA";
  if (normalized.includes("diligence") || normalized.includes("inspect")) return "Diligence";
  if (normalized.includes("integration")) return "Integration";
  return "Diligence";
};

const ensureRuntimeAuth = async () => {
  if (!preferFirestore) return;
  await ensureAuth();
};

// 1. Roadmap / Deals
export const subscribeToDeals = (callback: (deals: DealRoadmap[]) => void) => {
  const unsubRef: { fn: () => void } = { fn: () => { } };
  ensureRuntimeAuth().then(() => {
    unsubRef.fn = onSnapshot(collection(db, "deals"), (snap) => {
      const items: DealRoadmap[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        items.push({
          deal_name: data.deal_name || data.name || d.id,
          status: mapDealStatus(data.status || data.type),
          closing_date: data.closing_date || "",
          ...data
        });
      });
      callback(items);
    });
  }).catch(err => console.error("Deals subscription error:", err));
  return () => unsubRef.fn();
};

// 2. Tasks
export const subscribeToTasks = (callback: (tasks: TaskMap) => void) => {
  const unsubRef: { fn: () => void } = { fn: () => { } };
  ensureRuntimeAuth().then(() => {
    unsubRef.fn = onSnapshot(collection(db, "tasks"), (snap) => {
      const mapped: TaskMap = {};
      snap.forEach(d => {
        const val = d.data() as any;
        mapped[d.id] = {
          status: val.status || "Not Started",
          date: val.date || "",
          notes: val.notes || "",
          department: val.department,
          targetDate: val.targetDate,
          updatedBy: val.updatedBy
        };
      });
      callback(mapped);
    });
  }).catch(err => console.error("Tasks subscription error:", err));
  return () => unsubRef.fn();
};

// 3. Documents
export const subscribeToDocuments = (callback: (docs: DocumentData[]) => void) => {
  const unsubRef: { fn: () => void } = { fn: () => { } };
  ensureRuntimeAuth().then(() => {
    unsubRef.fn = onSnapshot(collection(db, "documents"), (snap) => {
      const docs: DocumentData[] = [];
      snap.forEach(d => {
        const val = d.data() as any;
        docs.push({
          id: d.id,
          filename: val.filename || d.id,
          deal: val.deal || null,
          needs_ocr: Boolean(val.needs_ocr),
          summary: val.summary || "",
          text_snippet: val.text_snippet || "",
          full_text: val.full_text,
          type: val.type,
          url: val.url,
          uploadedAt: val.uploadedAt,
        });
      });
      callback(docs);
    });
  }).catch(err => console.error("Documents subscription error:", err));
  return () => unsubRef.fn();
};

// 4. Checklist
export const subscribeToChecklist = (callback: (list: ChecklistItem[]) => void) => {
  const unsubRef: { fn: () => void } = { fn: () => { } };
  ensureRuntimeAuth().then(() => {
    unsubRef.fn = onSnapshot(collection(db, "checklist"), (snap) => {
      const list: ChecklistItem[] = [];
      snap.forEach(d => {
        const val = d.data() as any;
        list.push({
          task: val.task,
          category: val.category,
          priority: val.priority,
          ...val
        });
      });
      callback(list);
    });
  }).catch(err => console.error("Checklist subscription error:", err));
  return () => unsubRef.fn();
};

// 5. Sites (Monday)
export const subscribeToSites = (callback: (sites: MondayItem[]) => void) => {
  const unsubRef: { fn: () => void } = { fn: () => { } };
  ensureRuntimeAuth().then(() => {
    unsubRef.fn = onSnapshot(collection(db, "sites"), (snap) => {
      const sites: MondayItem[] = [];
      snap.forEach(d => {
        const val = d.data() as any;
        sites.push({
          task: val.task || d.id,
          status: val.status || "Under Contract",
          date: val.date || "",
          deal_association: val.deal_association,
          ...val
        });
      });
      callback(sites);
    });
  }).catch(err => console.error("Sites subscription error:", err));
  return () => unsubRef.fn();
};

// 6a. Update Task Status (write-through to Firestore if available)
export const setTaskStatus = async (key: string, status: TaskStatus['status']) => {
  if (!preferFirestore) return;
  await ensureAuth();
  const refDoc = doc(db, "tasks", key);
  await updateDoc(refDoc, { status });
};

// 6b. Upload Document
export const uploadDocument = async (file: File, dealName?: string) => {
  if (!preferFirestore) {
    console.warn("Uploads disabled: Firestore/Storage not enabled (set VITE_USE_FIRESTORE=true).");
    alert("Uploads require Firebase enabled. Set VITE_USE_FIRESTORE=true and redeploy.");
    return false;
  }

  try {
    await ensureAuth();
    const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    const docData: DocumentData = {
      filename: file.name,
      deal: dealName || null,
      needs_ocr: true,
      summary: "Pending analysis...",
      text_snippet: "Processing...",
      type: "Other",
      url: downloadURL,
      uploadedAt: new Date().toISOString()
    };

    await addDoc(collection(db, "documents"), docData);
    return true;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};
