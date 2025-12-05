const fs = require('fs');
const path = require('path');

const mondayPath = path.join('public', 'data', 'monday_data.json');
const checklistPath = path.join('public', 'data', 'checklist_data.json');
const roadmapPath = path.join('public', 'data', 'roadmap.json');
const taskStatusPath = path.join('public', 'data', 'task_status.json');

console.log('Reading data...');
const sites = JSON.parse(fs.readFileSync(mondayPath, 'utf8'));
let checklist = JSON.parse(fs.readFileSync(checklistPath, 'utf8'));

// Handle if checklist is wrapped in an object
if (!Array.isArray(checklist) && checklist.checklist) {
    checklist = checklist.checklist;
}

console.log(`Found ${sites.length} sites and ${checklist.length} checklist items.`);

const deals = sites.map(site => {
  return {
    deal_name: site.task, // Use the site name as the deal name
    status: site.status,
    closing_date: site.date,
    site_addresses: [site.task], // It's a single site deal now
    phases: [
      {
        id: "CHK",
        name: "Operational Checklist",
        tasks: checklist.map(t => ({
          role: "Ops",
          department: t.category || "Ops",
          action: t.task,
          deadline: "TBD",
          ref: "Checklist",
          evidence: ""
        }))
      }
    ]
  };
});

const roadmap = { deals };

const taskStatus = {};
deals.forEach(deal => {
  deal.phases.forEach(phase => {
    phase.tasks.forEach(task => {
      // Sanitize key: replace spaces and special chars if needed, but the app seems to split by '_'
      // The current app uses `sanitizeId` in functions but locally we need keys that match
      // In Dashboard.tsx: const parts = key.split('_'); const dealName = parts[0];
      // So the key must start with dealName + "_"

      // If dealName contains "_", it might be an issue. Let's check keys.
      // "Rich's Car Wash(Wallisville)"
      // Key: "Rich's Car Wash(Wallisville)_Equip Ordered"
      // Split by '_' -> ["Rich's Car Wash(Wallisville)", "Equip Ordered"]
      // This works fine as long as deal name doesn't contain "_".
      // But deal names might contain characters that are problematic.
      // However, DataContext.tsx deriveDealNamesFromTasks splits by '_'.
      // If deal name is "Take_5", it splits to "Take", "5".

      // We should probably sanitize the deal name for the key, OR use a separator that isn't likely in the name.
      // BUT `Dashboard.tsx` relies on `key.startsWith(deal.deal_name)`.
      // So the key MUST start with the EXACT deal name string from roadmap.deals.

      const key = `${deal.deal_name}_${task.action}`;
      taskStatus[key] = {
        status: 'Not Started',
        date: '',
        notes: '',
        department: task.department
      };
    });
  });
});

console.log('Writing output files...');
fs.writeFileSync(roadmapPath, JSON.stringify(roadmap, null, 2));
fs.writeFileSync(taskStatusPath, JSON.stringify(taskStatus, null, 2));

console.log(`Successfully generated roadmap.json with ${deals.length} deals.`);
console.log(`Successfully generated task_status.json with ${Object.keys(taskStatus).length} tasks.`);
