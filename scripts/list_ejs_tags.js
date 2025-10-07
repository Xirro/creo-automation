const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'app', 'views', 'Submittal', 'submittal.ejs');
const src = fs.readFileSync(file,'utf8');
const lines = src.split(/\r?\n/);
const regex = /(<%[-=]?[\s\S]*?%>)/g;
let match; let idx=0;
for(let i=0;i<lines.length;i++){
  const line = lines[i];
  while((match = regex.exec(line)) !== null) {
    console.log('line', i+1, ':', match[1].trim());
  }
}
// Also scan across lines for tags spanning lines
let all = src;
let tags = all.match(regex);
if(tags){
  console.log('\nAll tags in file:');
  tags.forEach((t, i)=>{
    // find line number
    const upto = src.indexOf(t);
    const ln = src.substring(0, upto).split(/\r?\n/).length;
    console.log(i+1, 'ln', ln, t.replace(/\r?\n/g,'\\n'));
  });
}
