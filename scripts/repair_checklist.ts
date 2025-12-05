
import fs from 'fs';
import path from 'path';

const checklistPath = path.join(process.cwd(), 'checklist_data.json');

interface RawItem {
    task: string;
    date: string | null;
    status: string;
}

interface FixedItem {
    task: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    status: string;
    date: string | null;
}

const run = () => {
    console.log(`Reading from ${checklistPath}...`);
    const rawData: RawItem[] = JSON.parse(fs.readFileSync(checklistPath, 'utf-8'));

    const fixedData: FixedItem[] = [];
    let currentCategory = "General";

    rawData.forEach(item => {
        // Identify header rows by "0.0" date or specific keywords if needed
        if (item.date === "0.0") {
            currentCategory = item.task;
            console.log(`Found category header: ${currentCategory}`);
        } else {
            // It's a real task
            fixedData.push({
                task: item.task,
                category: currentCategory,
                priority: 'Medium', // Default priority
                status: item.status,
                date: item.date
            });
        }
    });

    console.log(`Processed ${rawData.length} raw items into ${fixedData.length} fixed items.`);

    fs.writeFileSync(checklistPath, JSON.stringify(fixedData, null, 2));
    console.log(`Wrote fixed data to ${checklistPath}`);
};

run();
