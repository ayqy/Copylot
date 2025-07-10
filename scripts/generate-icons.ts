import sharp from 'sharp';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 32, 48, 128];
const inputSvg = join(__dirname, '../src/assets/icon.svg');
const outputDir = join(__dirname, '../public/icons');

export async function generateIcons() {
  console.log('Generating icons...');
  console.log('Input SVG:', inputSvg);
  console.log('Output dir:', outputDir);
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log('Created output directory');
  }

  // Check if SVG file exists
  if (!existsSync(inputSvg)) {
    throw new Error(`SVG file not found: ${inputSvg}`);
  }

  const svgBuffer = readFileSync(inputSvg);
  console.log(`SVG file read successfully, size: ${svgBuffer.length} bytes`);

  // Generate PNGs for each size
  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}.png`);
    
    try {
      console.log(`Processing ${size}x${size} icon...`);
      
      await sharp(svgBuffer, {
        density: 300
      })
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Failed to generate ${size}px icon:`, error);
      
      // Fallback: create a simple colored square PNG
      try {
        console.log(`Generating fallback ${size}px icon...`);
        
        await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 79, g: 70, b: 229, alpha: 1 }
          }
        })
        .png()
        .toFile(outputPath);
        
        console.log(`✅ Generated fallback ${size}px icon`);
      } catch (fallbackError) {
        console.error(`❌ Failed to generate fallback ${size}px icon:`, fallbackError);
      }
    }
  }
  
  console.log('Icon generation completed');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIcons().catch(console.error);
} 