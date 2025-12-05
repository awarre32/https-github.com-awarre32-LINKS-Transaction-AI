import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, signInAnonymously, connectAuthEmulator, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJO1Psik7vshCPE4zBGKvPw3S7qdmZDEQ",
  authDomain: "links-transaction-ai.firebaseapp.com",
  projectId: "links-transaction-ai",
  storageBucket: "links-transaction-ai.firebasestorage.app",
  messagingSenderId: "447604239474",
  appId: "1:447604239474:web:4d7f4e04c9de4db2f9e6eb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Connect to emulator if in dev mode and flag is set
// You can set VITE_USE_EMULATOR=true in your .env
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  console.log('Using Firebase Emulators');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

// Ensure an authenticated user (anonymous is fine for this app/ruleset)
let authPromise: Promise<User> | null = null;
export const ensureAuth = (): Promise<User> => {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!authPromise) {
    authPromise = signInAnonymously(auth).then(cred => cred.user);
  }
  return authPromise;
};
