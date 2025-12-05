
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
    location: 'US',
    defaultDataset: { datasetId },
  };

  try {
    const [job] = await bigquery.createQueryJob(options);
    console.log(`Job ${job.id} started.`);
    await job.getQueryResults();
    console.log(`Job ${job.id} completed.`);
  } catch (err) {
    console.error(`Error running ${path.basename(filePath)}:`, err.message);
  }
};

const run = async () => {
  const files = [
    'schema.sql',
    'feature_tables.sql',
    'views.sql',
    // 'embeddings.sql', // Uncomment if embedding model is set up
    'models.sql',     // Uncomment if data is populated
    'predictions.sql' // Uncomment if models are trained
  ];

  for (const file of files) {
    await runQuery(path.join(__dirname, '../bigquery', file));
  }
};

run().catch(console.error);
