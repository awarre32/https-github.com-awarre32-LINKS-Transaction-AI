
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();
const datasetId = 'links_transactions';

const run = async () => {
    console.log('Creating mock streaming tables...');

    const tasksSchema = [
        { name: 'document_name', type: 'STRING' },
        { name: 'timestamp', type: 'TIMESTAMP' },
        { name: 'operation', type: 'STRING' },
        { name: 'data', type: 'JSON' }
    ];

    const docsSchema = [
        { name: 'document_name', type: 'STRING' },
        { name: 'timestamp', type: 'TIMESTAMP' },
        { name: 'operation', type: 'STRING' },
        { name: 'data', type: 'JSON' }
    ];

    try {
        await bigquery.dataset(datasetId).table('tasks_raw_changelog').create({ schema: tasksSchema });
        console.log('Created tasks_raw_changelog');
    } catch (e) {
        if (e.code !== 409) console.error('Error creating tasks_raw_changelog:', e.message);
        else console.log('tasks_raw_changelog already exists');
    }

    try {
        await bigquery.dataset(datasetId).table('documents_raw_changelog').create({ schema: docsSchema });
        console.log('Created documents_raw_changelog');
    } catch (e) {
        if (e.code !== 409) console.error('Error creating documents_raw_changelog:', e.message);
        else console.log('documents_raw_changelog already exists');
    }
};

run().catch(console.error);
