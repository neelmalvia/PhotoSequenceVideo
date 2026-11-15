/**
 * Renders the app icons for both platforms from the SVGs in assets/brand.
 *
 *   node scripts/generate-app-icons.mjs
 *
 * Android: legacy square + round icons per density, and an adaptive icon
 * (foreground image + background color) for Android 8+.
 * iOS: a single 1024px universal icon (Xcode derives the other sizes).
 *
 * Uses `sharp`, which react-native-bootsplash already depends on.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brand = path.join(root, 'assets/brand');
const androidRes = path.join(root, 'android/app/src/main/res');
const iosIconSet = path.join(
  root,
  'ios/PhotoSequenceVideo/Images.xcassets/AppIcon.appiconset',
);

const BACKGROUND = '#0B0B0F';

/** Android launcher sizes (48dp) and adaptive layer sizes (108dp) per density. */
const DENSITIES = {
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
};

const iconSvg = await readFile(path.join(brand, 'app-icon.svg'));
const markSvg = await readFile(path.join(brand, 'logo-mark.svg'));

const render = (svg, size) =>
  sharp(svg, { density: 384 }).resize(size, size).png();

/** Applies a mask (rounded square or circle) to a rendered icon. */
async function masked(svg, size, mask) {
  const shape =
    mask === 'circle'
      ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/>`
      : `<rect width="${size}" height="${size}" rx="${size * 0.22}"/>`;
  const maskSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${shape}</svg>`,
  );
  return render(svg, size)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * Adaptive foreground: the mark centred on a transparent 108dp canvas, kept
 * inside the 66dp safe zone so no launcher mask can clip it.
 */
async function adaptiveForeground(size) {
  const markWidth = Math.round(size * 0.5);
  const mark = await sharp(markSvg, { density: 384 })
    .resize({ width: markWidth })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

for (const [density, scale] of Object.entries(DENSITIES)) {
  const dir = path.join(androidRes, `mipmap-${density}`);
  await mkdir(dir, { recursive: true });
  const launcher = Math.round(48 * scale);
  const layer = Math.round(108 * scale);
  await writeFile(
    path.join(dir, 'ic_launcher.png'),
    await masked(iconSvg, launcher, 'rounded'),
  );
  await writeFile(
    path.join(dir, 'ic_launcher_round.png'),
    await masked(iconSvg, launcher, 'circle'),
  );
  await writeFile(
    path.join(dir, 'ic_launcher_foreground.png'),
    await adaptiveForeground(layer),
  );
}

const anydpi = path.join(androidRes, 'mipmap-anydpi-v26');
await mkdir(anydpi, { recursive: true });
const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
await writeFile(path.join(anydpi, 'ic_launcher.xml'), adaptiveXml);
await writeFile(path.join(anydpi, 'ic_launcher_round.xml'), adaptiveXml);
await writeFile(
  path.join(androidRes, 'values/ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BACKGROUND}</color>
</resources>
`,
);

// iOS: one 1024px universal icon. It must be opaque (no alpha channel).
await mkdir(iosIconSet, { recursive: true });
await writeFile(
  path.join(iosIconSet, 'AppIcon-1024.png'),
  await render(iconSvg, 1024).flatten({ background: BACKGROUND }).toBuffer(),
);
await writeFile(
  path.join(iosIconSet, 'Contents.json'),
  `${JSON.stringify(
    {
      images: [
        {
          filename: 'AppIcon-1024.png',
          idiom: 'universal',
          platform: 'ios',
          size: '1024x1024',
        },
      ],
      info: { author: 'xcode', version: 1 },
    },
    null,
    2,
  )}\n`,
);

console.log('App icons generated for Android and iOS.');
