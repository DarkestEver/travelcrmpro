const { exec } = require('child_process');
const path = require('path');

const dbName = 'travel-crm-b2b';
const outputPath = path.join(__dirname, 'db_backup');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupPath = path.join(outputPath, `backup_${timestamp}`);

console.log('🔄 Starting database export...');
console.log('📦 Database:', dbName);
console.log('📁 Output:', backupPath);
console.log('');

const command = `mongodump --db=${dbName} --out="${backupPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error exporting database:', error.message);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log(stdout);
  console.log('✅ Database exported successfully!');
  console.log('📂 Location:', backupPath);
  process.exit(0);
});
