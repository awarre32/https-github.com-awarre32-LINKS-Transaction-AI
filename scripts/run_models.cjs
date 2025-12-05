
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');

const bigquery = new BigQuery();
const datasetId = 'links_transactions';

const runQuery = async (filePath) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running ${path.basename(filePath)}...`);

    const options = {
        query: sql,
        defaultDataset: { datasetId },
    };

    try {
        const [job] = await bigquery.createQueryJob(options);
        console.log(`Job ${job.id} started.`);
        const [rows] = await job.getQueryResults();
        console.log(`Job ${job.id} completed.`);
    } catch (err) {
        console.error(`Error running ${path.basename(filePath)}:`, err.message);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
};

const run = async () => {
    await runQuery(path.join(__dirname, '../bigquery/models.sql'));
    await runQuery(path.join(__dirname, '../bigquery/predictions.sql'));
};

run().catch(console.error);
