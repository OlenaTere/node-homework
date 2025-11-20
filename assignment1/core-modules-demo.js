const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

//const fsp = fs.promises;

// OS module
console.log('Platform:', os.platform());
console.log('CPU:', os.cpus()[0].model);
console.log('Total Memory:', os.totalmem());

// Path module
const joinedPath = path.join(sampleFilesDir, 'demo.txt');
console.log('Joined path:', joinedPath);

// fs.promises API
(async () => {
  try {
    //write a file
    await fs.promises.writeFile(joinedPath, 'Hello from fs.promises!', 'utf8');
    //read the same file
    const text = await fs.promises.readFile(joinedPath, 'utf8');
    console.log('fs.promises read:', text);
  } catch (err) {
    console.error('File operation error:', err.message);
  }
})