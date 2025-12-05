
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();

const run = async () => {
    console.log('Verifying search capability...');
    try {
        const [rows] = await bigquery.query({
            query: "SELECT filename FROM `links_transactions.documents_snapshot` WHERE filename LIKE '%PSA%' LIMIT 3",
            location: 'US'
        });
        console.log('Found PSAs:', rows);
    } catch (err) {
        console.error('Error verifying search:', err.message);
    }
};

run().catch(console.error);
