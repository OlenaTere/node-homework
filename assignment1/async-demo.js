const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration

// 1. Callback style


  // Callback hell example (test and leave it in comments):


  // 2. Promise style


      // 3. Async/Await style
// Path to the sample file
const filePath = path.join(__dirname, 'sample-files', 'sample.txt');

// Write a sample file for demonstration
// (optional – only runs if file doesn’t exist yet)
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, 'Hello, async world!');
}

// 1. Callback style
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Callback error:', err.message);
    return;
  }
  console.log('Callback read:', data); // Hello, async world!
});

/*
  // Callback hell example (test and leave it in comments):

  doA((err, resultA) => {
    if (err) return handle(err);
    doB(resultA, (err, resultB) => {
      if (err) return handle(err);
      doC(resultB, (err, resultC) => {
        if (err) return handle(err);
        console.log('All done!', resultC);
      });
    });
  });

  // Problems: hard to read, nested structure, difficult error handling.
*/

// 2. Promise style
fs.promises
  .readFile(filePath, 'utf8')
  .then((data) => {
    console.log('Promise read:', data); // Hello, async world!
  })
  .catch((err) => {
    console.error('Promise error:', err.message);
  });

// 3. Async/Await style
(async () => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    console.log('Async/Await read:', data); // Hello, async world!
  } catch (err) {
    console.error('Async/Await error:', err.message);
  }
})();