
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DROPBOX_PATH = 'C:\\Users\\AnthonyWarren\\Links Development Dropbox\\Links Development\\Sites Under Contract';
const OUTPUT_FILE = path.join(__dirname, '../public/data/dropbox_documents.json');

const classifyDoc = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes('psa')) return 'PSA';
    if (lower.includes('title')) return 'Title';
    if (lower.includes('survey')) return 'Survey';
    if (lower.includes('esa') || lower.includes('environmental')) return 'ESA';
    if (lower.includes('financial') || lower.includes('p&l') || lower.includes('ebitda')) return 'Financial';
    if (lower.includes('zoning')) return 'Zoning';
    if (lower.includes('contract')) return 'Contract';
    return 'Other';
};

const getAllFiles = (dirPath, arrayOfFiles, dealName) => {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            // If we are at the root, the folder name is likely the Deal Name
            const nextDealName = dealName || file;
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, nextDealName);
        } else {
            // It's a file
            if (file.startsWith('.') || file.toLowerCase() === 'desktop.ini') return;

            const docType = classifyDoc(file);
            const docId = crypto.createHash('sha1').update(fullPath).digest('hex');

            arrayOfFiles.push({
                doc_id: docId,
                filename: file,
                deal: dealName || 'Uncategorized',
                site: null, // Could try to infer from nested folders if needed
                doc_type: docType,
                summary: `Imported from ${fullPath}`,
                text_snippet: '', // No OCR for now
                needs_ocr: true,
                url: `file://${fullPath}`, // Local reference
                uploaded_at: new Date().toISOString()
            });
        }
    });

    return arrayOfFiles;
};

const run = () => {
    console.log(`Scanning ${DROPBOX_PATH}...`);
    if (!fs.existsSync(DROPBOX_PATH)) {
        console.error(`Path not found: ${DROPBOX_PATH}`);
        return;
    }

    const docs = getAllFiles(DROPBOX_PATH, [], null);
    console.log(`Found ${docs.length} documents.`);

    const output = { documents: docs };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Wrote metadata to ${OUTPUT_FILE}`);
};

run();
