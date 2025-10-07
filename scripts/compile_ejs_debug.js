const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const file = path.join(__dirname, '..', 'app', 'views', 'Submittal', 'submittal.ejs');
const src = fs.readFileSync(file, 'utf8');
try {
  const tmpl = ejs.compile(src, {filename: file});
  console.log('EJS compiled successfully');
} catch (err) {
  console.error('EJS compile error:');
  console.error(err && err.stack ? err.stack : err);
  if (err && err.message) console.error('message:', err.message);
  // Attempt naive line search around 'else'
  const lines = src.split(/\r?\n/);
  for (let i=0;i<lines.length;i++){
    if (/\belse\b/.test(lines[i])){
      console.log('line', i+1, ':', lines[i]);
    }
  }
  process.exit(1);
}
