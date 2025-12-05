const fs = require('fs');
const path = require('path');

const roadmapPath = path.join('public', 'data', 'roadmap.json');
const roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));

console.log(`Total Deals: ${roadmap.deals.length}`);
console.log('Deal Names:');
roadmap.deals.forEach(d => console.log(`- ${d.deal_name} (${d.status})`));

const expected = 17;
if (roadmap.deals.length === expected) {
    console.log(`\nSUCCESS: Found exactly ${expected} deals.`);
} else {
    console.error(`\nFAILURE: Expected ${expected} deals, found ${roadmap.deals.length}.`);
    process.exit(1);
}
