/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp not found. Run: npm install sharp --save-dev');
    process.exit(1);
  }

  const svgPath = path.join(__dirname, '../assets/app-icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [
    { name: 'app-icon.png', size: 1024 },
    { name: 'favicon.png', size: 32 },
    { name: 'splash.png', size: 1284 },
  ];

  for (const { name, size } of sizes) {
    const outPath = path.join(__dirname, '../assets', name);
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }
}

generate().catch(console.error);
