import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

export function createRoundedMask(
  width: number, 
  height: number, 
  radiusTop: number, 
  radiusBottom: number,
  filename: string
) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Start with transparent background
  ctx.clearRect(0, 0, width, height);
  
  // Create the rounded rectangle shape
  ctx.fillStyle = 'white';
  ctx.beginPath();
  
  if (radiusTop === 0 && radiusBottom === 0) {
    // Simple rectangle
    ctx.rect(0, 0, width, height);
  } else if (radiusTop === radiusBottom) {
    // All corners same radius - use proper arc drawing
    const radius = radiusTop;
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.arcTo(width, 0, width, radius, radius);
    ctx.lineTo(width, height - radius);
    ctx.arcTo(width, height, width - radius, height, radius);
    ctx.lineTo(radius, height);
    ctx.arcTo(0, height, 0, height - radius, radius);
    ctx.lineTo(0, radius);
    ctx.arcTo(0, 0, radius, 0, radius);
  } else {
    // Different top/bottom radii
    ctx.moveTo(radiusTop, 0);
    ctx.lineTo(width - radiusTop, 0);
    ctx.arcTo(width, 0, width, radiusTop, radiusTop);
    ctx.lineTo(width, height - radiusBottom);
    ctx.arcTo(width, height, width - radiusBottom, height, radiusBottom);
    ctx.lineTo(radiusBottom, height);
    ctx.arcTo(0, height, 0, height - radiusBottom, radiusBottom);
    ctx.lineTo(0, radiusTop);
    ctx.arcTo(0, 0, radiusTop, 0, radiusTop);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Save as PNG with proper alpha channel
  const buffer = canvas.toBuffer('image/png');
  const maskPath = path.join(process.cwd(), 'public', 'masks', filename);
  fs.writeFileSync(maskPath, Buffer.from(buffer));
  
  console.log(`Created mask: ${filename} (${width}x${height})`);
  return maskPath;
}

export function createAllMasks() {
  const masksDir = path.join(process.cwd(), 'public', 'masks');
  if (!fs.existsSync(masksDir)) {
    fs.mkdirSync(masksDir, { recursive: true });
  }
  
  // Vertical format masks - adjusted for even dimensions
  // Background image mask (top rounded)
  createRoundedMask(1016, 802, 116, 0, 'vertical_bg_mask.png');
  
  // Face recording mask (top rounded) - even height
  createRoundedMask(1080, 940, 116, 0, 'vertical_face_mask.png');
  
  // Screen recording mask (fully rounded) - even height
  createRoundedMask(1080, 670, 54, 54, 'vertical_screen_mask.png');
  
  // Horizontal format masks
  // PiP mask (all corners rounded)
  createRoundedMask(365, 206, 8, 8, 'horizontal_pip_mask.png');
  
  console.log('All masks created successfully');
}