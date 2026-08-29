const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.git', '.next', 'dist', '.turbo', '.vercel'];

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkSync(filepath, filelist);
      }
    } else {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const allFiles = walkSync('.');
let modifiedFiles = 0;

for (const file of allFiles) {
  // Only process source code and docs
  if (!/\.(ts|tsx|js|json|md|sql|html)$/.test(file)) continue;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Case-sensitive replacements
  content = content.replace(/TUKUBI/g, 'TUKUBI');
  content = content.replace(/Tukubi/g, 'Tukubi');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Modified:', file);
  }
}

console.log('Total files updated: ' + modifiedFiles);
