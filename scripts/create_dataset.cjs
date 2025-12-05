
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();
const datasetId = 'links_transactions';

const run = async () => {
    console.log(`Creating dataset ${datasetId}...`);
    try {
        const [dataset] = await bigquery.createDataset(datasetId, {
            location: 'US',
        });
        console.log(`Dataset ${dataset.id} created.`);
    } catch (err) {
        if (err.code === 409) {
            console.log(`Dataset ${datasetId} already exists.`);
        } else {
            console.error('Error creating dataset:', err);
        }
    }
};

run().catch(console.error);
