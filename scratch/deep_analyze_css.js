import fs from 'fs';

const content = fs.readFileSync('Frontend/css/style.css', 'utf8');
const lines = content.split('\n');

// Extract all comment blocks to see sections
const comments = [];
let currentComment = [];
let commentStart = 0;

lines.forEach((line, idx) => {
  if (line.includes('/*')) {
    currentComment = [line];
    commentStart = idx + 1;
  } else if (currentComment.length > 0) {
    currentComment.push(line);
    if (line.includes('*/')) {
      const fullText = currentComment.join('\n').trim();
      if (fullText.length > 10) {
        comments.push({ start: commentStart, end: idx + 1, text: fullText });
      }
      currentComment = [];
    }
  }
});

console.log('=== CSS SECTIONS DETECTED ===');
comments.filter(c => c.text.includes('===') || c.text.includes('---') || c.text.includes('SECTION') || c.text.includes('Header')).forEach(c => {
  console.log(`L${c.start}-L${c.end}:`);
  console.log(c.text.split('\n').slice(0, 4).join('\n'));
  console.log('---');
});

// Check selector duplication
const selectorMap = {};
const ruleRegex = /([^{}]+)\{([^}]+)\}/g;
let match;
while ((match = ruleRegex.exec(content)) !== null) {
  const sel = match[1].trim().replace(/\s+/g, ' ');
  const body = match[2].trim().replace(/\s+/g, ' ');
  if (!selectorMap[sel]) {
    selectorMap[sel] = [];
  }
  selectorMap[sel].push(body);
}

const duplicatedSelectors = Object.keys(selectorMap).filter(sel => selectorMap[sel].length > 1);
console.log(`\nFound ${duplicatedSelectors.length} duplicated selector blocks out of ${Object.keys(selectorMap).length} unique selectors.`);
console.log('Sample duplicated selectors:');
duplicatedSelectors.slice(0, 25).forEach(sel => {
  console.log(`  - "${sel}" appears ${selectorMap[sel].length} times`);
});
