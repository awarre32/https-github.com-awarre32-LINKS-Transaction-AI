import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const cfg = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
};

const main = async () => {
  const app = initializeApp(cfg);
  const db = getFirestore(app);

  const dealsSnap = await getDocs(collection(db, 'deals'));
  console.log('Deals count:', dealsSnap.size);
  dealsSnap.docs.slice(0, 5).forEach((d) => {
    const data = d.data();
    console.log('Deal sample:', d.id, data.deal_name || data.name || '');
  });

  const tasksSnap = await getDocs(query(collection(db, 'tasks'), limit(5)));
  console.log('Tasks sample:', tasksSnap.size);
  tasksSnap.forEach((d) => {
    const data = d.data();
    console.log('Task:', d.id, data.status, data.originalKey);
  });

  const docsSnap = await getDocs(query(collection(db, 'documents'), limit(3)));
  console.log('Documents sample:', docsSnap.size);
  docsSnap.forEach((d) => {
    const data = d.data();
    console.log('Doc:', d.id, data.filename);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
