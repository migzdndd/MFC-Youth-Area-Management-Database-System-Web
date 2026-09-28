import fs from 'fs';

const css = fs.readFileSync('Frontend/css/style.css', 'utf8');

// Find all rule blocks
const ruleRegex = /([^{}]+)\s*\{([^}]+)\}/g;
let match;
const rules = [];

while ((match = ruleRegex.exec(css)) !== null) {
  const selector = match[1].trim();
  const body = match[2].trim();
  rules.push({ selector, body });
}

console.log(`Parsed ${rules.length} total rules.`);

// Group by common component prefixes
const categories = {
  button: [],
  card: [],
  modal: [],
  table: [],
  input: [],
  form: [],
  badge: [],
  sidebar: [],
  toast: [],
  alert: []
};

rules.forEach(r => {
  const s = r.selector.toLowerCase();
  for (const cat in categories) {
    if (s.includes(cat) || s.includes('.' + cat) || s.includes('#' + cat)) {
      categories[cat].push(r);
    }
  }
});

console.log('\nRule count by component category:');
for (const cat in categories) {
  console.log(`  - ${cat}: ${categories[cat].length} rules`);
}

// Find rules with identical body declarations (exact duplicates or near-duplicates)
const bodyMap = {};
rules.forEach(r => {
  const normBody = r.body.split(';').map(d => d.trim()).filter(Boolean).sort().join('; ');
  if (normBody.length > 20) {
    if (!bodyMap[normBody]) {
      bodyMap[normBody] = [];
    }
    bodyMap[normBody].push(r.selector);
  }
});

console.log('\nIdentical Declaration Blocks (Shared Styling Candidates):');
let identicalCount = 0;
for (const body in bodyMap) {
  if (bodyMap[body].length > 1) {
    identicalCount++;
    console.log(`\nCandidate #${identicalCount} (${bodyMap[body].length} selectors):`);
    console.log('  Selectors:', bodyMap[body].slice(0, 8).join(', '));
    console.log('  Body:', body.slice(0, 100) + '...');
  }
}
