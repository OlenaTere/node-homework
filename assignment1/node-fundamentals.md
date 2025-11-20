# Node.js Fundamentals

## What is Node.js?
Node.js is basically a program that lets us run JavaScript outside the browser.
Usually, JavaScript in the browser is all about working with the webpage — things like document and window.
Node doesn’t have any of that. We run it through the command line, and it lets us use JavaScript for backend things like reading files, building APIs, or creating servers.


## How does Node.js differ from running JavaScript in the browser?
The browser and Node are environments with notable differences:

Browser JavaScript:
•	Has window, document, cookies, DOM, etc.
Node:
•	Has modules like fs, path, http
•	No DOM, no window
•	And we control the environment, meaning we pick the Node version and tools we want.


## What is the V8 engine, and how does Node use it?
The V8 engine is Google’s super-fast JavaScript engine — the same one that Chrome uses.
It takes JavaScript and turns it into machine code.
Node uses this engine to run JavaScript on your computer and adds extra features around it, like file access and networking.


## What are some key use cases for Node.js?
Building highly-scalable, data-intensive services and APIs, and real-time apps 

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
Node supports two modules systems.

**CommonJS (default in Node.js):**
CommonJS uses require() to import and module.exports to export.
This was the original module system used in Node.
```js
// math.js
const add = (a, b) => a + b;
module.exports = add;

// app.js
const add = require('./math');
console.log(add(2, 3)); // Output: 5
```

**ES Modules (supported in modern Node.js):**
ES Modules use import and export keywords.
They are part of the modern JavaScript standard and now supported in Node.js.
```js
// / math.js
export const add = (a, b) => a + b;

// app.js
import { add } from './math.js';
console.log(add(2, 3)); // Output: 5
``` 

