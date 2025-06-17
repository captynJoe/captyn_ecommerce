const sharp = require('sharp');
const path = require('path');

async function optimizeLogos() {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Optimize dark logo
  await sharp(path.join(publicDir, 'captynlogo.png'))
    .resize(240, 96, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({
      quality: 100,
      compressionLevel: 9,
      palette: true
    })
    .toFile(path.join(publicDir, 'captynlogo-optimized.png'));
  
  // Optimize white logo
  await sharp(path.join(publicDir, 'captynlogo-white.png'))
    .resize(240, 96, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({
      quality: 100,
      compressionLevel: 9,
      palette: true
    })
    .toFile(path.join(publicDir, 'captynlogo-white-optimized.png'));
    
  console.log('Logos optimized successfully!');
}

optimizeLogos().catch(console.error);
