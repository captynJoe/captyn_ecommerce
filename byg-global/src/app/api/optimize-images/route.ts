import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    
    // Optimize regular logo
    const regularLogo = await fs.readFile(path.join(publicDir, 'captynlogo.png'));
    await sharp(regularLogo)
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
    const whiteLogo = await fs.readFile(path.join(publicDir, 'captynlogo-white.png'));
    await sharp(whiteLogo)
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

    return NextResponse.json({ 
      success: true, 
      message: 'Images optimized successfully' 
    });
  } catch (error) {
    console.error('Error optimizing images:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to optimize images' 
    }, { status: 500 });
  }
}
