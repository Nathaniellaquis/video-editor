import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

// Create masks with ACTUAL rounded corners (not just white rectangles)
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
  
  // Set up for drawing the rounded rectangle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  
  // Draw rounded rectangle path
  if (radiusTop === 0 && radiusBottom === 0) {
    // Simple rectangle
    ctx.rect(0, 0, width, height);
  } else if (radiusTop === radiusBottom) {
    // All corners same radius
    ctx.roundRect(0, 0, width, height, radiusTop);
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
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  const maskPath = path.join(process.cwd(), 'public', 'masks', filename);
  fs.writeFileSync(maskPath, Buffer.from(buffer));
  
  console.log(`Created mask: ${filename} (${width}x${height}, top radius: ${radiusTop}px, bottom radius: ${radiusBottom}px)`);
  return maskPath;
}

// Regenerate all masks with proper dimensions and radii
export function regenerateAllMasks() {
  const masksDir = path.join(process.cwd(), 'public', 'masks');
  if (!fs.existsSync(masksDir)) {
    fs.mkdirSync(masksDir, { recursive: true });
  }
  
  console.log('Regenerating masks with proper rounded corners...\n');
  
  // Vertical format masks
  // Screen recording mask (54px radius on all corners) - adjusted for even height
  createRoundedMask(1080, 670, 54, 54, 'vertical_screen_mask.png');
  
  // Face recording mask (116px radius on top corners only) - adjusted for even height
  createRoundedMask(1080, 940, 116, 0, 'vertical_face_mask.png');
  
  // Background image mask (116px radius on top corners only)
  createRoundedMask(1016, 802, 116, 0, 'vertical_bg_mask.png');
  
  // Horizontal format masks
  // PiP mask (8px radius on all corners)
  createRoundedMask(365, 206, 8, 8, 'horizontal_pip_mask.png');
  
  console.log('\n✅ All masks regenerated with proper rounded corners!');
}

// Run if called directly
if (require.main === module) {
  regenerateAllMasks();
}