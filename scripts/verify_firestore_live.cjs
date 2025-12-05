
const admin = require('firebase-admin');

try {
    admin.initializeApp();
} catch (e) {
    console.log('Initialization failed:', e.message);
}

const db = admin.firestore();

const run = async () => {
    console.log('Verifying Firestore counts...');
    const collections = ['deals', 'tasks', 'documents', 'checklist', 'sites'];

    for (const col of collections) {
        try {
            const snap = await db.collection(col).count().get();
            console.log(`${col}: ${snap.data().count}`);
        } catch (err) {
            console.error(`Error counting ${col}:`, err.message);
        }
    }
};

run().catch(console.error);
