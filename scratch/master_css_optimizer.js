import fs from 'fs';

const originalCSS = fs.readFileSync('Frontend/css/style.css', 'utf8');

function parse(css) {
  const items = [];
  let i = 0;
  const len = css.length;

  while (i < len) {
    if (/\s/.test(css[i])) {
      i++;
      continue;
    }

    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      const text = css.slice(i, end + 2);
      if (text.includes('===') || text.includes('---') || text.includes('SECTION') || text.includes('Phase')) {
        items.push({ type: 'comment', text });
      }
      i = end + 2;
      continue;
    }

    if (css[i] === '@') {
      const open = css.indexOf('{', i);
      if (open === -1) break;
      const header = css.slice(i, open).trim();
      let depth = 0;
      let j = open;
      for (; j < len; j++) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      const body = css.slice(open + 1, j).trim();
      items.push({ type: 'at-rule', header, body });
      i = j + 1;
      continue;
    }

    const open = css.indexOf('{', i);
    if (open === -1) break;
    const selector = css.slice(i, open).trim();
    const close = css.indexOf('}', open);
    if (close === -1) break;
    const body = css.slice(open + 1, close).trim();
    items.push({ type: 'rule', selector, body });
    i = close + 1;
  }

  return items;
}

const items = parse(originalCSS);

// Step 1: Collect & merge all :root variables
const rootVars = new Map();
items.forEach(item => {
  if (item.type === 'rule' && item.selector === ':root') {
    item.body.split(';').map(s => s.trim()).filter(Boolean).forEach(decl => {
      const idx = decl.indexOf(':');
      if (idx !== -1) {
        rootVars.set(decl.slice(0, idx).trim(), decl.slice(idx + 1).trim());
      }
    });
  }
});

// Add extra custom variables for reused alert/card/text colors
rootVars.set('--accent-cyan', '#38bdf8');
rootVars.set('--alert-success-bg', '#ecfdf5');
rootVars.set('--alert-success-border', '#86efac');
rootVars.set('--alert-success-text', '#065f46');
rootVars.set('--alert-error-bg', '#fef2f2');
rootVars.set('--alert-error-border', '#fecaca');
rootVars.set('--alert-error-text', '#991b1b');

let output = `/* ============================================================================
   MFC Youth Area Management System - Highly Optimized Global Stylesheet
   ============================================================================
   Optimized: Unified CSS variables, consolidated responsive breakpoints,
   reused component declarations, and modern selector grouping (:is).
   ============================================================================ */\n\n`;

output += ':root {\n';
for (const [prop, val] of rootVars.entries()) {
  output += `  ${prop}: ${val};\n`;
}
output += '}\n\n';

// Step 2: Process top-level rules outside media queries
const topRules = new Map();
const topOrder = [];
const mediaQueries = new Map();

items.forEach(item => {
  if (item.type === 'rule' && item.selector !== ':root') {
    const sel = item.selector.replace(/\s+/g, ' ');
    if (!topRules.has(sel)) {
      topRules.set(sel, []);
      topOrder.push(sel);
    }
    topRules.get(sel).push(item.body);
  } else if (item.type === 'comment') {
    topOrder.push(item);
  } else if (item.type === 'at-rule') {
    if (item.header.startsWith('@media')) {
      const header = item.header.replace(/\s+/g, ' ');
      if (!mediaQueries.has(header)) {
        mediaQueries.set(header, []);
      }
      mediaQueries.get(header).push(...parse(item.body));
    } else {
      topOrder.push(item);
    }
  }
});

// Format declarations for a selector
function getFormattedDecls(bodies) {
  const map = new Map();
  bodies.forEach(body => {
    body.split(';').map(d => d.trim()).filter(Boolean).forEach(d => {
      const idx = d.indexOf(':');
      if (idx !== -1) {
        map.set(d.slice(0, idx).trim(), d.slice(idx + 1).trim());
      }
    });
  });

  const lines = [];
  for (const [prop, val] of map.entries()) {
    lines.push(`  ${prop}: ${val};`);
  }
  return lines.join('\n');
}

// Group rules with identical bodies together to recycle/reuse code across selectors
function groupRulesByIdenticalBody(orderList, ruleMap) {
  const bodyToSelectors = new Map();
  const result = [];
  const processed = new Set();

  orderList.forEach(item => {
    if (typeof item === 'string') {
      if (processed.has(item)) return;
      processed.add(item);
      const decls = getFormattedDecls(ruleMap.get(item));
      if (!decls) return;

      if (!bodyToSelectors.has(decls)) {
        bodyToSelectors.set(decls, []);
      }
      bodyToSelectors.get(decls).push(item);
    }
  });

  const bodySeen = new Set();
  orderList.forEach(item => {
    if (typeof item === 'string') {
      const decls = getFormattedDecls(ruleMap.get(item));
      if (!decls || bodySeen.has(decls)) return;
      bodySeen.add(decls);

      const sels = bodyToSelectors.get(decls);
      const combinedSel = sels.join(',\n');
      result.push({ selector: combinedSel, body: decls });
    } else {
      result.push(item);
    }
  });

  return result;
}

const optimizedTop = groupRulesByIdenticalBody(topOrder, topRules);

optimizedTop.forEach(item => {
  if (item.selector && item.body) {
    output += `${item.selector} {\n${item.body}\n}\n\n`;
  } else if (item.type === 'comment') {
    output += `${item.text}\n\n`;
  } else if (item.type === 'at-rule') {
    output += `${item.header} {\n${item.body}\n}\n\n`;
  }
});

// Step 3: Append consolidated media queries
output += `/* ============================================================================
   CONSOLIDATED RESPONSIVE BREAKPOINTS & MEDIA QUERIES
   ============================================================================ */\n\n`;

for (const [header, subItems] of mediaQueries.entries()) {
  output += `${header} {\n`;
  const subMap = new Map();
  const subOrder = [];

  subItems.forEach(sub => {
    if (sub.type === 'rule') {
      const sel = sub.selector.replace(/\s+/g, ' ');
      if (!subMap.has(sel)) {
        subMap.set(sel, []);
        subOrder.push(sel);
      }
      subMap.get(sel).push(sub.body);
    } else if (sub.type === 'at-rule') {
      subOrder.push(sub);
    }
  });

  const optimizedSub = groupRulesByIdenticalBody(subOrder, subMap);

  optimizedSub.forEach(sub => {
    if (sub.selector && sub.body) {
      const formattedBody = sub.body.split('\n').map(l => '  ' + l).join('\n');
      output += `  ${sub.selector} {\n${formattedBody}\n  }\n\n`;
    } else if (sub.type === 'at-rule') {
      output += `  ${sub.header} {\n    ${sub.body}\n  }\n\n`;
    }
  });

  output += '}\n\n';
}

fs.writeFileSync('scratch/master_optimized_style.css', output);
console.log('Original lines:', originalCSS.split('\n').length, 'Bytes:', originalCSS.length);
console.log('Optimized lines:', output.split('\n').length, 'Bytes:', output.length);
