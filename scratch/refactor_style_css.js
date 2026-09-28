import fs from 'fs';

const content = fs.readFileSync('Frontend/css/style.css', 'utf8');

function parseFullCSS(css) {
  const items = [];
  let i = 0;
  const len = css.length;

  while (i < len) {
    // Skip whitespace
    if (/\s/.test(css[i])) {
      let ws = '';
      while (i < len && /\s/.test(css[i])) {
        ws += css[i];
        i++;
      }
      // Preserve section breaks if comment follows
      continue;
    }

    // Comment
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      const commentText = css.slice(i, end + 2);
      items.push({ type: 'comment', text: commentText });
      i = end + 2;
      continue;
    }

    // At-rule (@media, @keyframes, etc.)
    if (css[i] === '@') {
      const openBrace = css.indexOf('{', i);
      if (openBrace === -1) break;
      const header = css.slice(i, openBrace).trim();

      let depth = 0;
      let j = openBrace;
      for (; j < len; j++) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      const body = css.slice(openBrace + 1, j).trim();
      items.push({ type: 'at-rule', header, body });
      i = j + 1;
      continue;
    }

    // Standard rule
    const openBrace = css.indexOf('{', i);
    if (openBrace === -1) break;

    const selector = css.slice(i, openBrace).trim();
    const closeBrace = css.indexOf('}', openBrace);
    if (closeBrace === -1) break;

    const body = css.slice(openBrace + 1, closeBrace).trim();
    items.push({ type: 'rule', selector, body });
    i = closeBrace + 1;
  }

  return items;
}

const items = parseFullCSS(content);

console.log('Original items parsed:', items.length);

// 1. Process :root variables
const rootVars = new Map();
const nonRootItems = [];

items.forEach(item => {
  if (item.type === 'rule' && item.selector === ':root') {
    const decls = item.body.split(';').map(d => d.trim()).filter(Boolean);
    decls.forEach(d => {
      const parts = d.split(':');
      if (parts.length >= 2) {
        const prop = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        rootVars.set(prop, val);
      }
    });
  } else {
    nonRootItems.push(item);
  }
});

console.log(`Merged ${rootVars.size} :root CSS custom properties.`);

// Construct merged :root
let rootCSS = ':root {\n';
for (const [prop, val] of rootVars.entries()) {
  rootCSS += `  ${prop}: ${val};\n`;
}
rootCSS += '}\n\n';

// 2. Consolidate rules & media queries
const mediaMap = new Map(); // header -> list of inner rules
const topRulesMap = new Map(); // selector -> merged declarations map (prop -> val)
const orderedTopSelectors = [];

nonRootItems.forEach(item => {
  if (item.type === 'at-rule' && item.header.startsWith('@media')) {
    const header = item.header.replace(/\s+/g, ' ');
    if (!mediaMap.has(header)) {
      mediaMap.set(header, []);
    }
    const innerItems = parseFullCSS(item.body);
    mediaMap.get(header).push(...innerItems);
  } else if (item.type === 'rule') {
    const sel = item.selector.replace(/\s+/g, ' ');
    if (!topRulesMap.has(sel)) {
      topRulesMap.set(sel, []);
      orderedTopSelectors.push(sel);
    }
    topRulesMap.get(sel).push(item.body);
  } else {
    // Keep comments / keyframes / font-face
    orderedTopSelectors.push(item);
  }
});

// Build optimized top-level CSS
let optimizedCSS = `/* ============================================================================
   MFC Youth Area Management System - Optimized Global Stylesheet
   ============================================================================ */\n\n`;

optimizedCSS += rootCSS;

const processedSelectors = new Set();

orderedTopSelectors.forEach(item => {
  if (typeof item === 'string') {
    if (processedSelectors.has(item)) return;
    processedSelectors.add(item);

    const bodies = topRulesMap.get(item);
    // Combine declarations
    const declMap = new Map();
    const declList = [];

    bodies.forEach(body => {
      const decls = body.split(';').map(d => d.trim()).filter(Boolean);
      decls.forEach(d => {
        const colonIdx = d.indexOf(':');
        if (colonIdx !== -1) {
          const prop = d.slice(0, colonIdx).trim();
          const val = d.slice(colonIdx + 1).trim();
          declMap.set(prop, val);
        } else {
          declList.push(d);
        }
      });
    });

    optimizedCSS += `${item} {\n`;
    for (const [prop, val] of declMap.entries()) {
      optimizedCSS += `  ${prop}: ${val};\n`;
    }
    declList.forEach(d => {
      optimizedCSS += `  ${d};\n`;
    });
    optimizedCSS += '}\n\n';
  } else if (item.type === 'comment') {
    // Only include meaningful section header comments
    if (item.text.includes('===') || item.text.includes('---') || item.text.includes('SECTION')) {
      optimizedCSS += `${item.text}\n\n`;
    }
  } else if (item.type === 'at-rule') {
    // Keyframes or non-media at-rules
    optimizedCSS += `${item.header} {\n${item.body}\n}\n\n`;
  }
});

// Consolidate @media queries at the bottom or grouped logically
optimizedCSS += `/* ============================================================================
   CONSOLIDATED RESPONSIVE & ACCESSIBILITY MEDIA QUERIES
   ============================================================================ */\n\n`;

for (const [header, innerItems] of mediaMap.entries()) {
  optimizedCSS += `${header} {\n`;

  // Merge inner rules for this media query
  const innerSelectorMap = new Map();
  const innerOrder = [];

  innerItems.forEach(inner => {
    if (inner.type === 'rule') {
      const sel = inner.selector.replace(/\s+/g, ' ');
      if (!innerSelectorMap.has(sel)) {
        innerSelectorMap.set(sel, []);
        innerOrder.push(sel);
      }
      innerSelectorMap.get(sel).push(inner.body);
    } else if (inner.type === 'comment') {
      // ignore minor comments inside media queries
    } else if (inner.type === 'at-rule') {
      innerOrder.push(inner);
    }
  });

  const innerProcessed = new Set();
  innerOrder.forEach(sel => {
    if (typeof sel === 'string') {
      if (innerProcessed.has(sel)) return;
      innerProcessed.add(sel);

      const bodies = innerSelectorMap.get(sel);
      const declMap = new Map();
      bodies.forEach(body => {
        const decls = body.split(';').map(d => d.trim()).filter(Boolean);
        decls.forEach(d => {
          const colonIdx = d.indexOf(':');
          if (colonIdx !== -1) {
            const prop = d.slice(0, colonIdx).trim();
            const val = d.slice(colonIdx + 1).trim();
            declMap.set(prop, val);
          }
        });
      });

      optimizedCSS += `  ${sel} {\n`;
      for (const [prop, val] of declMap.entries()) {
        optimizedCSS += `    ${prop}: ${val};\n`;
      }
      optimizedCSS += '  }\n';
    } else if (sel.type === 'at-rule') {
      optimizedCSS += `  ${sel.header} {\n    ${sel.body}\n  }\n`;
    }
  });

  optimizedCSS += '}\n\n';
}

fs.writeFileSync('scratch/optimized_style.css', optimizedCSS);
console.log('Original size:', (content.length / 1024).toFixed(2), 'KB, lines:', content.split('\n').length);
console.log('Optimized size:', (optimizedCSS.length / 1024).toFixed(2), 'KB, lines:', optimizedCSS.split('\n').length);
