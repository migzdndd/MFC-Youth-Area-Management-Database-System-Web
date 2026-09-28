import fs from 'fs';

const content = fs.readFileSync('Frontend/css/style.css', 'utf8');
const lines = content.split('\n');

const selectorMap = {};

// Simple parser for CSS rules with line numbers
let currentSelectors = '';
let currentBody = '';
let inRule = false;
let startLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  if (!inRule) {
    if (trimmed.includes('{') && !trimmed.startsWith('@media') && !trimmed.startsWith('@keyframes') && !trimmed.startsWith('@import') && !trimmed.startsWith('@layer') && !trimmed.startsWith('@font-face')) {
      const parts = line.split('{');
      currentSelectors = parts[0].trim();
      currentBody = parts.slice(1).join('{') + '\n';
      startLine = i + 1;
      inRule = true;
      if (line.includes('}')) {
        const bodyParts = currentBody.split('}');
        const actualBody = bodyParts[0].trim();
        saveRule(currentSelectors, actualBody, startLine, i + 1);
        inRule = false;
        currentSelectors = '';
        currentBody = '';
      }
    }
  } else {
    currentBody += line + '\n';
    if (line.includes('}')) {
      const bodyParts = currentBody.split('}');
      const actualBody = bodyParts[0].trim();
      saveRule(currentSelectors, actualBody, startLine, i + 1);
      inRule = false;
      currentSelectors = '';
      currentBody = '';
    }
  }
}

function saveRule(sel, body, start, end) {
  const normalized = sel.replace(/\s+/g, ' ');
  if (!selectorMap[normalized]) {
    selectorMap[normalized] = [];
  }
  selectorMap[normalized].push({ start, end, body });
}

console.log('=== MULTIPLE DEFINITION SELECTORS ===');
Object.keys(selectorMap).forEach(sel => {
  if (selectorMap[sel].length > 1) {
    console.log(`\nSelector: "${sel}" (${selectorMap[sel].length} occurrences)`);
    selectorMap[sel].forEach(occ => {
      console.log(`  Lines ${occ.start}-${occ.end}:`);
      console.log('    ' + occ.body.split('\n').slice(0, 3).join('\n    '));
    });
  }
});
