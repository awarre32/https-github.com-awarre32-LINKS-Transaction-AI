
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');
const os = require('os');

const bigquery = new BigQuery();
const datasetId = 'links_transactions';

// Helper to write NDJSON for BigQuery load
const writeNdjson = (data, filename) => {
    const tempPath = path.join(os.tmpdir(), filename);
    const stream = fs.createWriteStream(tempPath);
    data.forEach(row => {
        stream.write(JSON.stringify(row) + '\n');
    });
    stream.end();
    return new Promise((resolve) => {
        stream.on('finish', () => resolve(tempPath));
    });
};

const loadTable = async (tableName, data, schema) => {
    console.log(`Preparing to load ${data.length} rows into ${tableName}...`);
    const tempFile = await writeNdjson(data, `${tableName}_${Date.now()}.json`);

    try {
        const [job] = await bigquery
            .dataset(datasetId)
            .table(tableName)
            .load(tempFile, {
                sourceFormat: 'NEWLINE_DELIMITED_JSON',
                schema: { fields: schema },
                writeDisposition: 'WRITE_TRUNCATE', // Replace existing data
                autodetect: false
            });

        console.log(`Job ${job.id} started.`);
        const [errors] = await job.promise();
        if (errors && errors.length > 0) {
            console.error(`Errors loading ${tableName}:`, errors);
        } else {
            console.log(`Successfully loaded ${tableName}.`);
        }
    } catch (err) {
        console.error(`Failed to load ${tableName}:`, err);
    } finally {
        fs.unlinkSync(tempFile);
    }
};

const run = async () => {
    // 1. Documents
    console.log('Reading documents from Dropbox scan...');
    const docsRaw = JSON.parse(fs.readFileSync('public/data/dropbox_documents.json', 'utf8'));
    const docsData = (Array.isArray(docsRaw) ? docsRaw : docsRaw.documents).map(d => ({
        doc_id: d.id || d.filename,
        filename: d.filename,
        deal: d.deal,
        site: d.site,
        doc_type: d.type,
        summary: (d.summary || '').substring(0, 10000), // Truncate for safety
        text_snippet: (d.text_snippet || '').substring(0, 20000),
        needs_ocr: !!d.needs_ocr,
        url: d.url,
        uploaded_at: d.uploadedAt || new Date().toISOString()
    }));

    await loadTable('documents_snapshot', docsData, [
        { name: 'doc_id', type: 'STRING' },
        { name: 'filename', type: 'STRING' },
        { name: 'deal', type: 'STRING' },
        { name: 'site', type: 'STRING' },
        { name: 'doc_type', type: 'STRING' },
        { name: 'summary', type: 'STRING' },
        { name: 'text_snippet', type: 'STRING' },
        { name: 'needs_ocr', type: 'BOOLEAN' },
        { name: 'url', type: 'STRING' },
        { name: 'uploaded_at', type: 'TIMESTAMP' }
    ]);

    // 2. Deals (Roadmap)
    console.log('Reading roadmap...');
    const roadmapRaw = JSON.parse(fs.readFileSync('import_data/roadmap.json', 'utf8'));
    const dealsData = (Array.isArray(roadmapRaw) ? roadmapRaw : roadmapRaw.deals).map(d => ({
        deal_name: d.deal_name || d.name,
        status: d.status || d.type,
        closing_date: d.closing_date || (d.key_dates ? d.key_dates.closing_target : null),
        stats: JSON.stringify(d.stats || {}),
        updated_at: new Date().toISOString()
    }));

    await loadTable('deals_snapshot', dealsData, [
        { name: 'deal_name', type: 'STRING' },
        { name: 'status', type: 'STRING' },
        { name: 'closing_date', type: 'STRING' },
        { name: 'stats', type: 'JSON' },
        { name: 'updated_at', type: 'TIMESTAMP' }
    ]);

    // 3. Tasks
    console.log('Reading tasks...');
    const tasksRaw = JSON.parse(fs.readFileSync('public/data/task_status.json', 'utf8'));
    const tasksData = Object.entries(tasksRaw).map(([key, val]) => {
        const isObj = val && typeof val === 'object';
        const status = isObj ? val.status : (val === true || val === 'true' ? 'Completed' : 'Not Started');
        const parts = key.split('_');
        return {
            task_id: key,
            deal_name: parts[0],
            phase_code: parts[1] || 'Unknown',
            department: isObj ? val.department : null,
            status: status,
            target_date: isObj && val.targetDate ? new Date(val.targetDate).toISOString() : null,
            actual_date: null,
            updated_at: new Date().toISOString(),
            updated_by: isObj ? val.updatedBy : null,
            created_at: new Date().toISOString(),
            notes: isObj ? val.notes : null
        };
    });

    await loadTable('tasks_snapshot', tasksData, [
        { name: 'task_id', type: 'STRING' },
        { name: 'deal_name', type: 'STRING' },
        { name: 'phase_code', type: 'STRING' },
        { name: 'department', type: 'STRING' },
        { name: 'status', type: 'STRING' },
        { name: 'target_date', type: 'TIMESTAMP' },
        { name: 'actual_date', type: 'TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP' },
        { name: 'updated_by', type: 'STRING' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'notes', type: 'STRING' }
    ]);

    // 4. Sites (Monday)
    console.log('Reading sites...');
    const sitesRaw = JSON.parse(fs.readFileSync('public/data/monday_data.json', 'utf8'));
    const sitesData = (Array.isArray(sitesRaw) ? sitesRaw : sitesRaw.sites).map(s => ({
        task: s.task,
        status: s.status,
        date: s.date,
        deal_association: s.deal_association,
        updated_at: new Date().toISOString()
    }));

    await loadTable('sites_snapshot', sitesData, [
        { name: 'task', type: 'STRING' },
        { name: 'status', type: 'STRING' },
        { name: 'date', type: 'STRING' },
        { name: 'deal_association', type: 'STRING' },
        { name: 'updated_at', type: 'TIMESTAMP' }
    ]);

    console.log('All loads completed.');
};

run().catch(console.error);
