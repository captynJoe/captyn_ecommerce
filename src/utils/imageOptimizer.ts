import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export async function optimizeImage(inputPath: string, outputPath: string) {
  try {
    const image = await fs.readFile(inputPath);
    await sharp(image)
      .resize(240, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 9,
        palette: true
      })
      .toFile(outputPath);

    console.log(`Successfully optimized image: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
}

export async function optimizeLogos() {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Optimize regular logo
  await optimizeImage(
    path.join(publicDir, 'captynlogo.png'),
    path.join(publicDir, 'captynlogo-optimized.png')
  );
  
  // Optimize white logo
  await optimizeImage(
    path.join(publicDir, 'captynlogo-white.png'),
    path.join(publicDir, 'captynlogo-white-optimized.png')
  );
}
