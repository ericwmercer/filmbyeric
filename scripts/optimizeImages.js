'use strict';

import fs from 'fs';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import { exit } from 'process';

const DEFAULT_QUALITY = 30;

/**
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {number | undefined} qualityOverride
 */
function validateArgs(inputPath, outputPath, qualityOverride) {
  if (fs.existsSync(inputPath) && fs.existsSync(outputPath)) {
    console.log(`Input dir:\t${inputPath}`);
  } else {
    throw new Error(`Directory not found: ${inputPath}`);
  }

  if (qualityOverride != undefined) {
    if (qualityOverride > 0 && qualityOverride <= 100) {
      console.log(`Quality:\t${qualityOverride}`);
    } else {
      throw new Error(`Invalid value:\t${qualityOverride}`);
    }
  }
}

/**
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {number | undefined} qualityOverride
 */
function optimizeImages(inputPath, outputPath, qualityOverride) {
  const inputGlob = `${inputPath}/*.{jpg,jpeg}`;
  console.log(`Matching glob:\t${inputGlob}`);
  console.log(`Output dir:\t${outputPath}`);

  return imagemin(
    [
      inputGlob,
    ],
    {
      destination: outputPath,
      plugins: [
        imageminMozjpeg({
          progressive: true,
          quality: qualityOverride ?? DEFAULT_QUALITY
        }),
      ]
    }
  );
}

try {
  const [imageDir, quality] = process.argv.slice(2);
  const inputPath = `dist/images/${imageDir}/film`;
  const outputPath = `dist/images/${imageDir}`;
  const qualityOverride = !!quality ? Number(quality) : undefined;

  validateArgs(inputPath, outputPath, qualityOverride);
  await optimizeImages(inputPath, outputPath, qualityOverride);
  exit(0);
} catch (error) {
  console.log(error);
  exit(1);
}
