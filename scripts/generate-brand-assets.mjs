import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'assets', 'images');

const sourceCandidates = [
  path.join(root, 'assets', 'brand', 'logo-source.png'),
  path.join(
    root,
    '..',
    '.cursor',
    'projects',
    'c-Users-USER-Documents-GitHub-trakkit-mobile-rn',
    'assets',
    'c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_TraKKiT_Logos__2__2_-e39a8a76-6bec-4242-a36b-5f3288e89eb9.png',
  ),
];

const source = sourceCandidates.find((p) => fs.existsSync(p));
if (!source) {
  console.error('Logo source not found. Place logo at assets/brand/logo-source.png');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(root, 'assets', 'brand'), { recursive: true });
if (!fs.existsSync(path.join(root, 'assets', 'brand', 'logo-source.png'))) {
  fs.copyFileSync(source, path.join(root, 'assets', 'brand', 'logo-source.png'));
}

const logo = sharp(source).ensureAlpha();

async function writePng(name, size, fit = 'contain', background = { r: 255, g: 255, b: 255, alpha: 0 }) {
  await logo
    .clone()
    .resize(size, size, { fit, background })
    .png()
    .toFile(path.join(outDir, name));
  console.log('Wrote', name);
}

await writePng('icon.png', 1024);
await writePng('splash-icon.png', 512, 'contain', { r: 255, g: 255, b: 255, alpha: 1 });
await writePng('favicon.png', 192);
await writePng('android-icon-foreground.png', 1024);
await writePng('android-icon-monochrome.png', 432, 'contain', { r: 0, g: 0, b: 0, alpha: 0 });

// Solid white background tile for adaptive icon
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
})
  .png()
  .toFile(path.join(outDir, 'android-icon-background.png'));

const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(
  icoSizes.map((size) => logo.clone().resize(size, size, { fit: 'contain' }).png().toBuffer()),
);
const ico = await toIco(icoBuffers);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), ico);
console.log('Wrote favicon.ico');
