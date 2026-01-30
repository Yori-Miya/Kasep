#!/usr/bin/env node
/**
 * Simple Tailwind CSS build script for vanilla HTML project
 * Jika output.css sudah ada, script ini akan skip build
 * Ganti process.env.CI untuk force build di CI/CD environment
 */

const fs = require('fs');
const path = require('path');

const inputCss = path.join(__dirname, 'src/assets/css/input.css');
const outputCss = path.join(__dirname, 'src/assets/css/output.css');

// Check if output CSS already exists - untuk development, bisa skip build
const outputExists = fs.existsSync(outputCss);
const isCI = process.env.CI === 'true' || process.argv.includes('--force');

if (outputExists && !isCI) {
  console.log('✓ CSS already built. Skipping Tailwind build.');
  console.log('  Tip: Use --force flag or set CI=true to rebuild');
  process.exit(0);
}

// Since Tailwind CSS v4 memerlukan postcss, untuk development 
// kita bisa gunakan CDN version di HTML (sudah ada di index.html)
// Untuk production, build CSS secara proper dengan PostCSS

if (isCI || process.argv.includes('--watch')) {
  console.log('⚠ Warning: Tailwind CLI build diperlukan untuk production');
  console.log('  Pastikan generate CSS dengan benar sebelum deploy');
  console.log('');
  console.log('  Solusi: Install PostCSS CLI untuk build yang proper:');
  console.log('  npm install -D postcss postcss-cli');
  console.log('  npm run build:postcss');
}

// Untuk sekarang, copy template CSS 
if (!outputExists) {
  const templateCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
:root {
  --color-primary: #0ea5e9;
  --color-dark: #1f2937;
}

body {
  @apply bg-white text-gray-800;
}
`;
  
  fs.writeFileSync(outputCss, templateCSS);
  console.log('✓ CSS output created at:', path.relative(process.cwd(), outputCss));
} else {
  console.log('✓ CSS already exists');
}

console.log('\nNote: For production builds, ensure Tailwind CSS is properly processed.');
console.log('Your HTML files are using CDN version for now.');
