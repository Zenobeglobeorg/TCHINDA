#!/usr/bin/env node
/**
 * Convertit assets/images/assets_images_logo.png (ou logo.png) en assets_images_logo.webp
 * Usage: node scripts/convert-logo-to-webp.mjs
 * Prérequis: npm install sharp --save-dev
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets', 'images');
const destPath = path.join(assetsDir, 'assets_images_logo.webp');
const sources = [
  path.join(assetsDir, 'assets_images_logo.png'),
  path.join(assetsDir, 'logo.png'),
];

const sourcePath = sources.find((p) => fs.existsSync(p));
if (!sourcePath) {
  console.error(
    'Aucun fichier source trouvé. Placez assets_images_logo.png ou logo.png dans client/assets/images/'
  );
  process.exit(1);
}

try {
  const sharp = (await import('sharp')).default;
  await sharp(sourcePath)
    .webp({ quality: 90 })
    .toFile(destPath);
  console.log('OK:', path.basename(sourcePath), '-> assets_images_logo.webp');
} catch (err) {
  if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('sharp')) {
    console.error('Installez sharp: npm install sharp --save-dev');
  } else {
    console.error(err.message);
  }
  process.exit(1);
}
