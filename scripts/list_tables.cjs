
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();
const datasetId = 'links_transactions';

const run = async () => {
    console.log(`Listing tables in ${datasetId}...`);
    try {
        const [tables] = await bigquery.dataset(datasetId).getTables();
        tables.forEach(table => console.log(table.id));
    } catch (err) {
        console.error('Error listing tables:', err.message);
    }
};

run().catch(console.error);
