
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();

const run = async () => {
    console.log('Listing datasets...');
    const [datasets] = await bigquery.getDatasets();

    for (const dataset of datasets) {
        const [metadata] = await dataset.getMetadata();
        console.log(`Dataset: ${dataset.id}, Location: ${metadata.location}`);
    }
};

run().catch(console.error);
