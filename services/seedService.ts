import { db } from "../firebaseConfig";
import { collection, doc, writeBatch, setDoc } from "firebase/firestore";
import { MOCK_ROADMAP, MOCK_TASK_STATUS, MOCK_DOCUMENTS, MOCK_CHECKLIST, MOCK_MONDAY } from "../constants";

export const seedDatabase = async () => {
  console.log("Starting database seeding...");
  const batch = writeBatch(db);

  try {
    // 1. Roadmap (Deals)
    // We will store deals in a 'deals' collection for better scalability than a single JSON blob
    const dealsRef = collection(db, "deals");
    MOCK_ROADMAP.deals.forEach((deal) => {
      // Create a safe ID from the deal name
      const id = deal.deal_name.replace(/[^a-zA-Z0-9]/g, "_");
      const docRef = doc(dealsRef, id);
      batch.set(docRef, deal);
    });

    // 2. Tasks
    // MOCK_TASK_STATUS is an object where keys are "Deal_Phase_TaskName"
    const tasksRef = collection(db, "tasks");
    Object.entries(MOCK_TASK_STATUS).forEach(([key, value]) => {
      // Attempt to parse key: Deal_Phase_Task
      // This is a bit heuristic because deal names can have underscores or spaces.
      // But looking at the data: "Rich's 7-Site Deal_R-1_Wire..."
      // The separator seems to be "_" but deal names contain spaces.
      // We will store the original ID as the document ID to maintain reference integrity for now.
      
      const parts = key.split('_');
      // A simple heuristic parsing if needed, but for now we trust the key is the ID.
      // We can add parsed fields for querying.
      
      const docRef = doc(tasksRef, key); // Use the composite key as ID
      batch.set(docRef, {
        id: key,
        ...value,
        originalKey: key
      });
    });

    // 3. Documents
    const docsRef = collection(db, "documents");
    MOCK_DOCUMENTS.forEach((d) => {
      const id = d.filename.replace(/\./g, "_");
      const docRef = doc(docsRef, id);
      batch.set(docRef, d);
    });

    // 4. Checklist (Templates)
    const checklistRef = collection(db, "checklist");
    MOCK_CHECKLIST.forEach((item, index) => {
      const docRef = doc(checklistRef, `template_${index}`);
      batch.set(docRef, item);
    });

    // 5. Monday (Sites)
    const sitesRef = collection(db, "sites");
    MOCK_MONDAY.forEach((site, index) => {
      const id = `${site.task}_${index}`.replace(/[^a-zA-Z0-9]/g, "_");
      const docRef = doc(sitesRef, id);
      batch.set(docRef, site);
    });

    await batch.commit();
    console.log("Database seeded successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, error };
  }
};
