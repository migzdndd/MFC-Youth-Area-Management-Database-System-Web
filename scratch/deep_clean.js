import fs from 'fs';

let css = fs.readFileSync('scratch/optimized_style.css', 'utf8');

console.log('Starting deep optimization pass...');

// 1. Convert verbose selector chains to :is()
const replacements = [
  {
    target: 'button:hover, button:focus-visible, .btn:hover, .btn:focus-visible, a:hover, a:focus-visible',
    replacement: ':is(button, .btn, a):is(:hover, :focus-visible)'
  },
  {
    target: 'button:active, .btn:active, .btn-auth:active',
    replacement: ':is(button, .btn, .btn-auth):active'
  },
  {
    target: '.badge:hover, .info-badge:hover, .info-status:hover, .login-meta-row span:hover, .info-pills span:hover',
    replacement: ':is(.badge, .info-badge, .info-status, .login-meta-row span, .info-pills span):hover'
  },
  {
    target: '.badge, .info-badge, .info-status, .login-meta-row span, .info-pills span',
    replacement: ':is(.badge, .info-badge, .info-status, .login-meta-row span, .info-pills span)'
  }
];

replacements.forEach(r => {
  if (css.includes(r.target)) {
    css = css.replaceAll(r.target, r.replacement);
    console.log(`Replaced selector chain: "${r.target.slice(0, 40)}..."`);
  }
});

// 2. Extract shared utility classes in :root for common glassmorphic / flex pattern tokens if beneficial
// Check occurrence count of 'display: flex;\n  align-items: center;\n  justify-content: center;'
const flexCenterPattern = /display:\s*flex;\s*align-items:\s*center;\s*justify-content:\s*center;/g;
const flexCenterCount = (css.match(flexCenterPattern) || []).length;
console.log(`"flex center" combination occurs ${flexCenterCount} times in CSS.`);

const backdropBlurPattern = /backdrop-filter:\s*blur\(/g;
const blurCount = (css.match(backdropBlurPattern) || []).length;
console.log(`"backdrop-filter: blur()" occurs ${blurCount} times.`);

fs.writeFileSync('scratch/optimized_style_v2.css', css);
console.log('Version 2 size:', (css.length / 1024).toFixed(2), 'KB, lines:', css.split('\n').length);
