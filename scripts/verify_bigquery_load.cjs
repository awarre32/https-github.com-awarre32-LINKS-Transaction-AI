
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();
const datasetId = 'links_transactions';

const verifyTable = async (tableName) => {
    try {
        const [metadata] = await bigquery
            .dataset(datasetId)
            .table(tableName)
            .getMetadata();

        const projectId = bigquery.projectId;
        console.log(`\nTable: ${tableName}`);
        console.log(`  Project: ${projectId}`);
        console.log(`  Dataset: ${datasetId}`);
        console.log(`  Rows: ${metadata.numRows}`);
        console.log(`  Bytes: ${metadata.numBytes}`);
        console.log(`  Location: ${metadata.location}`);
        return parseInt(metadata.numRows);
    } catch (err) {
        console.error(`Error verifying '${tableName}':`, err.message);
        return -1;
    }
};

const run = async () => {
    console.log('Verifying BigQuery data load...');

    const tables = [
        'documents_snapshot',
        'deals_snapshot',
        'tasks_snapshot',
        'sites_snapshot'
    ];

    for (const table of tables) {
        await verifyTable(table);
    }
};

run().catch(console.error);
