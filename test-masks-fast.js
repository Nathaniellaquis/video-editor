const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Test the mask approach (should be MUCH faster than geq)
const videoPath = path.join(__dirname, 'uploads', 'screen_1756842163265.mp4');
const maskPath = path.join(__dirname, 'public', 'masks', 'vertical_screen_mask.png');
const outputPath = path.join(__dirname, 'test-masks-fast.mp4');

const filterArray = [];

// Create background
filterArray.push('color=c=#FF5733:s=1080x1920:d=1[bg]');

// Scale video to target size
filterArray.push('[0:v]scale=1080:670:force_original_aspect_ratio=increase,crop=1080:670,format=yuva420p[screen_raw]');

// Apply mask for rounded corners
filterArray.push('[1:v]scale=1080:670,format=rgba[screenmask]');
filterArray.push('[screenmask]alphaextract[screenmask_alpha]');
filterArray.push('[screen_raw][screenmask_alpha]alphamerge,format=yuva420p[screen]');

// Overlay on background
filterArray.push('[bg][screen]overlay=0:625[out]');

console.log('Testing mask-based approach (pre-generated rounded corners)...');
console.log('This should be MUCH faster than geq!');

const startTime = Date.now();

const command = ffmpeg()
  .input(videoPath)
  .input(maskPath)
  .complexFilter(filterArray)
  .outputOptions([
    '-map', '[out]',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-t', '5'  // 5 seconds test
  ])
  .save(outputPath)
  .on('start', (commandLine) => {
    console.log('\nFFmpeg command:', commandLine);
  })
  .on('progress', (progress) => {
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`Progress: ${progress.percent ? progress.percent.toFixed(1) : 0}% | Speed: ${progress.currentFps} fps | Time: ${elapsed.toFixed(1)}s`);
  })
  .on('end', () => {
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Success! Video created in ${totalTime.toFixed(1)} seconds`);
    console.log(`Output: ${outputPath}`);
    console.log('\nThis should have rounded corners AND process at normal speed!');
  })
  .on('error', (err) => {
    console.error('\n❌ Error:', err.message);
  });