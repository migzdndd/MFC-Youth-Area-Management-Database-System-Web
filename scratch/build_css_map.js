import fs from 'fs';

const content = fs.readFileSync('Frontend/css/style.css', 'utf8');

// Parse top-level blocks (comments, rules, @media, @keyframes)
function parseCSS(css) {
  const blocks = [];
  let i = 0;
  const len = css.length;

  while (i < len) {
    // Skip whitespace
    if (/\s/.test(css[i])) {
      i++;
      continue;
    }

    // Comment
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      const commentText = css.slice(i, end + 2);
      blocks.push({ type: 'comment', content: commentText });
      i = end + 2;
      continue;
    }

    // @rule (like @media, @keyframes, @import, @layer)
    if (css[i] === '@') {
      const nameEnd = css.indexOf('{', i);
      if (nameEnd === -1) break;
      const header = css.slice(i, nameEnd).trim();
      
      // Find matching closing brace
      let depth = 0;
      let j = nameEnd;
      for (; j < len; j++) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      const body = css.slice(nameEnd + 1, j).trim();
      blocks.push({ type: 'at-rule', header, body });
      i = j + 1;
      continue;
    }

    // Standard rule
    const openBrace = css.indexOf('{', i);
    if (openBrace === -1) break;

    const selector = css.slice(i, openBrace).trim();
    const closeBrace = css.indexOf('}', openBrace);
    if (closeBrace === -1) break;

    const declarations = css.slice(openBrace + 1, closeBrace).trim();
    blocks.push({ type: 'rule', selector, declarations });
    i = closeBrace + 1;
  }

  return blocks;
}

const parsed = parseCSS(content);
console.log('Parsed blocks count:', parsed.length);

const types = {};
parsed.forEach(b => types[b.type] = (types[b.type] || 0) + 1);
console.log('Block types breakdown:', types);

fs.writeFileSync('scratch/parsed_blocks.json', JSON.stringify(parsed.slice(0, 50), null, 2));
