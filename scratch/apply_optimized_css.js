import fs from 'fs';

const optimized = fs.readFileSync('scratch/master_optimized_style.css', 'utf8');
fs.writeFileSync('Frontend/css/style.css', optimized, 'utf8');

console.log('Successfully updated Frontend/css/style.css with optimized styles!');
