import fs from 'fs';

const content = fs.readFileSync('Frontend/css/style.css', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Total size:', (content.length / 1024).toFixed(2), 'KB');

// Let's find major sections or duplicate blocks
const headers = [];
lines.forEach((line, index) => {
  if (line.includes('/*') && (line.includes('===') || line.includes('---') || line.includes('SECTION') || line.includes('Module') || line.includes('Styles') || line.includes('Component'))) {
    headers.push({ line: index + 1, text: line.trim() });
  }
});

console.log(`\nFound ${headers.length} major headers:`);
headers.forEach(h => console.log(`L${h.line}: ${h.text}`));

// Count selector rules
const selectorMatches = content.match(/([^{}]+)\s*\{([^}]+)\}/g) || [];
console.log(`\nTotal CSS rules found: ${selectorMatches.length}`);
