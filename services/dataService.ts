import { db } from "../firebaseConfig";
import { collection, onSnapshot, QuerySnapshot, DocumentData as FirestoreDocumentData } from "firebase/firestore";
import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap } from "../types";

// Helper to convert snapshot to array
const mapSnapshot = <T>(snapshot: QuerySnapshot<FirestoreDocumentData>): T[] => {
  return snapshot.docs.map(doc => doc.data() as T);
};

// 1. Roadmap / Deals
export const subscribeToDeals = (callback: (deals: DealRoadmap[]) => void) => {
  return onSnapshot(collection(db, "deals"), (snapshot) => {
    callback(mapSnapshot<DealRoadmap>(snapshot));
  });
};

// 2. Tasks
// Returns TaskMap shape to match existing app structure
export const subscribeToTasks = (callback: (tasks: TaskMap) => void) => {
  return onSnapshot(collection(db, "tasks"), (snapshot) => {
    const taskMap: TaskMap = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // We stored the original key in the 'id' field or 'originalKey' field in seedService.
      // Or we used the doc ID as the key.
      const key = doc.id; 
      taskMap[key] = {
        status: data.status,
        date: data.date,
        notes: data.notes
      };
    });
    callback(taskMap);
  });
};

// 3. Documents
export const subscribeToDocuments = (callback: (docs: DocumentData[]) => void) => {
  return onSnapshot(collection(db, "documents"), (snapshot) => {
    callback(mapSnapshot<DocumentData>(snapshot));
  });
};

// 4. Checklist
export const subscribeToChecklist = (callback: (list: ChecklistItem[]) => void) => {
  return onSnapshot(collection(db, "checklist"), (snapshot) => {
    callback(mapSnapshot<ChecklistItem>(snapshot));
  });
};

// 5. Sites (Monday)
export const subscribeToSites = (callback: (sites: MondayItem[]) => void) => {
  return onSnapshot(collection(db, "sites"), (snapshot) => {
    callback(mapSnapshot<MondayItem>(snapshot));
  });
};
