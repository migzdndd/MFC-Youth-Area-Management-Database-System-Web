import fs from 'fs';

const css = fs.readFileSync('scratch/master_optimized_style.css', 'utf8');

let openBraces = 0;
let closeBraces = 0;

for (let i = 0; i < css.length; i++) {
  if (css[i] === '{') openBraces++;
  if (css[i] === '}') closeBraces++;
}

console.log(`Open braces: ${openBraces}, Close braces: ${closeBraces}`);
if (openBraces === closeBraces) {
  console.log('SUCCESS: All CSS braces match perfectly!');
} else {
  console.log('ERROR: Mismatched CSS braces!');
}
