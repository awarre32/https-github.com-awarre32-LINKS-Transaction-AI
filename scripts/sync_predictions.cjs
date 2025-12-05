
const { BigQuery } = require('@google-cloud/bigquery');
const admin = require('firebase-admin');

// Initialize BigQuery
const bigquery = new BigQuery();

// Initialize Firebase Admin
try {
    admin.initializeApp();
} catch (e) {
    console.log('Initialization failed:', e.message);
}
const db = admin.firestore();

const run = async () => {
    console.log('Syncing predictions to Firestore...');

    // 1. Sync Deal Risk Predictions
    // Note: Using a mock query if the table doesn't exist yet for this run
    const dealQuery = `
    SELECT deal_name, predicted_label as risk_score
    FROM \`links_transactions.deal_risk_predictions\`
  `;

    try {
        const [dealRows] = await bigquery.query({ query: dealQuery, location: 'US' });
        console.log(`Found ${dealRows.length} deal predictions.`);

        const batch = db.batch();
        dealRows.forEach(row => {
            // Assuming deal_name matches document ID or we need a lookup. 
            // For this project, deal_name is often the ID or close to it.
            // We'll try to find the doc by deal_name field first.
            // For simplicity in this script, we'll assume ID = sanitized deal_name or update by query.
            // Actually, let's just update by query to be safe.
        });

        // Since we can't batch update by query, we'll just log for now or try direct ID if known.
        // Let's try to match by 'deal_name' field.
        for (const row of dealRows) {
            const snapshot = await db.collection('deals').where('deal_name', '==', row.deal_name).get();
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    batch.update(doc.ref, { risk_score: row.risk_score, last_predicted: new Date() });
                });
            }
        }
        await batch.commit();
        console.log('Synced deal predictions.');

    } catch (err) {
        console.warn('Error syncing deal predictions (table might not exist yet):', err.message);
    }

    // 2. Sync Task Blockage Predictions
    const taskQuery = `
    SELECT task_id, predicted_label as blockage_risk
    FROM \`links_transactions.task_blockage_predictions\`
  `;

    try {
        const [taskRows] = await bigquery.query({ query: taskQuery, location: 'US' });
        console.log(`Found ${taskRows.length} task predictions.`);

        // Process in chunks of 400 for batching
        const chunks = [];
        for (let i = 0; i < taskRows.length; i += 400) {
            chunks.push(taskRows.slice(i, i + 400));
        }

        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(row => {
                const ref = db.collection('tasks').doc(row.task_id);
                batch.update(ref, { blockage_risk: row.blockage_risk, last_predicted: new Date() });
            });
            await batch.commit();
        }
        console.log('Synced task predictions.');

    } catch (err) {
        console.warn('Error syncing task predictions (table might not exist yet):', err.message);
    }
};

run().catch(console.error);
