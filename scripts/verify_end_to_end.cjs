
const admin = require('firebase-admin');
const { BigQuery } = require('@google-cloud/bigquery');

// Initialize Firebase
try {
    admin.initializeApp();
} catch (e) {
    console.log('Firebase init failed:', e.message);
}
const db = admin.firestore();
const bigquery = new BigQuery();

const run = async () => {
    console.log('Starting End-to-End Verification...');

    // 1. Simulate Firestore Write (Create a test task)
    console.log('1. Simulating Firestore Write...');
    const testTaskId = 'test_deal_verification_task';
    await db.collection('tasks').doc(testTaskId).set({
        status: 'In Progress',
        department: 'Ops',
        updatedAt: new Date().toISOString(),
        originalKey: 'test_deal_verification_task'
    });
    console.log('   Test task created.');

    // 2. Simulate BigQuery Sync (Insert into mock changelog)
    console.log('2. Simulating BigQuery Sync...');
    const row = {
        document_name: testTaskId,
        timestamp: new Date(),
        operation: 'CREATE',
        data: JSON.stringify({ status: 'In Progress', department: 'Ops', originalKey: 'test_deal_verification_task' })
    };
    try {
        await bigquery.dataset('links_transactions').table('tasks_raw_changelog').insert([row]);
        console.log('   Inserted into tasks_raw_changelog.');
    } catch (err) {
        console.error('   Error inserting into BQ:', err.message);
    }

    // 3. Trigger ML Prediction (Mocked for speed/cost, or run actual SQL)
    console.log('3. Triggering ML Prediction...');
    // In a real scenario, we'd run `predictions.sql`. 
    // Here we will just verify that `sync_predictions.cjs` can read from the prediction table.
    // We'll insert a mock prediction into `task_blockage_predictions` if it exists.
    try {
        // Create table if not exists for testing
        const schema = [{ name: 'task_id', type: 'STRING' }, { name: 'predicted_label', type: 'STRING' }];
        try {
            await bigquery.dataset('links_transactions').table('task_blockage_predictions').create({ schema });
        } catch (e) { }

        await bigquery.dataset('links_transactions').table('task_blockage_predictions').insert([
            { task_id: testTaskId, predicted_label: 'High Risk' }
        ]);
        console.log('   Inserted mock prediction.');
    } catch (err) {
        console.error('   Error inserting mock prediction:', err.message);
    }

    // 4. Run Sync Script
    console.log('4. Running Sync Script...');
    const { execSync } = require('child_process');
    try {
        execSync('node scripts/sync_predictions.cjs', { stdio: 'inherit' });
    } catch (err) {
        console.error('   Sync script failed:', err.message);
    }

    // 5. Verify Firestore Update
    console.log('5. Verifying Firestore Update...');
    const doc = await db.collection('tasks').doc(testTaskId).get();
    const data = doc.data();
    if (data.blockage_risk === 'High Risk') {
        console.log('   SUCCESS: Prediction synced back to Firestore!');
    } else {
        console.error('   FAILURE: Prediction not found in Firestore.', data);
    }

    // Cleanup
    await db.collection('tasks').doc(testTaskId).delete();
};

run().catch(console.error);
