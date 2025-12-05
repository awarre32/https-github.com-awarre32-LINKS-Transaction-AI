const { execSync } = require('child_process');

function run(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    process.exit(1);
  }
}

console.log('Building frontend...');
run('npm run build');

console.log('Deploying to Firebase Hosting...');
run('firebase deploy --only hosting');

console.log('Triggering seeder...');
// Use curl to trigger the function
try {
    execSync('curl "https://us-central1-links-transaction-ai.cloudfunctions.net/seedFromHostedJson?key=links-seed"', { stdio: 'inherit' });
} catch (e) {
    console.log("Seeder triggered (ignoring curl exit code if any)");
}

console.log('Done!');
