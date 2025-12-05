
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();
const datasetId = 'links_transactions';

const run = async () => {
    console.log('Verifying ML predictions...');
    try {
        const [rows] = await bigquery.query({
            query: `SELECT * FROM \`${datasetId}.deal_risk_predictions\``,
            location: 'US'
        });
        console.log(`Found ${rows.length} deal risk predictions.`);
        rows.forEach(row => {
            console.log(`Deal: ${row.deal_name}, Risk: ${row.predicted_is_at_risk}, Probs: ${JSON.stringify(row.predicted_is_at_risk_probs)}`);
        });
    } catch (err) {
        console.error('Error verifying predictions:', err.message);
    }
};

run().catch(console.error);
