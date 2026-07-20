import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const assetDir = "public/garden";
const width = 300;
const height = 400;
const isBackground = (r, g, b) => r < 70 && g < 105 && b < 90 && g >= r * .85 && g >= b * .8;

await mkdir(assetDir, { recursive: true });

for (let stage = 0; stage <= 4; stage += 1) {
  const input = `${assetDir}/guardian-${stage}.webp`;
  const output = `${assetDir}/guardian-${stage}-alpha.webp`;
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 4) {
    throw new Error(`Unexpected guardian dimensions: ${input}`);
  }

  const visited = new Uint8Array(width * height);
  const queue = [];
  const enqueue = (x, y) => {
    const pixel = y * width + x;
    if (visited[pixel]) return;
    const offset = pixel * 4;
    if (!isBackground(data[offset], data[offset + 1], data[offset + 2])) return;
    visited[pixel] = 1;
    queue.push(pixel);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixel = queue[cursor];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  for (let pixel = 0; pixel < visited.length; pixel += 1) {
    if (visited[pixel]) data[pixel * 4 + 3] = 0;
  }

  await sharp(data, { raw: info })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(output);
}

console.log("Transparent guardian assets generated.");
