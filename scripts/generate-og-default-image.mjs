import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '..');
const logoPath = path.join(projectRoot, 'src/images/logo.svg');
const outputPath = path.join(projectRoot, 'public/og-default.png');

const canvasWidth = 1200;
const canvasHeight = 630;
const logoMaxWidth = Math.round(canvasWidth * 0.65);

const backgroundBuffer = await sharp({
  create: {
    width: canvasWidth,
    height: canvasHeight,
    channels: 3,
    background: '#FFFFFF',
  },
})
  .png()
  .toBuffer();

const resizedLogo = await sharp(logoPath)
  .resize({ width: logoMaxWidth, fit: 'inside' })
  .png()
  .toBuffer();

const { width: logoWidth = 0, height: logoHeight = 0 } = await sharp(resizedLogo).metadata();
const leftOffset = Math.round((canvasWidth - logoWidth) / 2);
const topOffset = Math.round((canvasHeight - logoHeight) / 2);

await sharp(backgroundBuffer)
  .composite([{ input: resizedLogo, left: leftOffset, top: topOffset }])
  .png()
  .toFile(outputPath);

console.log(`Generated ${outputPath} (${canvasWidth}x${canvasHeight})`);
