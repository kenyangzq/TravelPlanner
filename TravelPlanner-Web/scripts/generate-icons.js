/**
 * TravelPlanner Web - Icon Generation Script
 *
 * This script generates PNG icons from SVG for PWA.
 * Run with: node scripts/generate-icons.js
 *
 * Requires: sharp (npm install -D sharp)
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp if available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  sharp not installed. Install with: npm install -D sharp');
  console.log('📝 Alternatively, use online tools like https://realfavicongenerator.net/');
  process.exit(0);
}

const svgPath = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 192x192
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(outputDir, 'icon-192x192.png'));
    console.log('✅ Generated icon-192x192.png');

    // Generate 512x512
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'icon-512x512.png'));
    console.log('✅ Generated icon-512x512.png');

    console.log('🎉 Icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
