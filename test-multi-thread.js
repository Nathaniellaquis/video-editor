const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');

// Test multi-threading performance
const videoPath = path.join(__dirname, 'uploads', 'screen_1756842163265.mp4');
const maskPath = path.join(__dirname, 'public', 'masks', 'vertical_screen_mask.png');

async function testWithThreads(threadCount, outputName) {
  const outputPath = path.join(__dirname, outputName);
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const filterArray = [];
    filterArray.push('color=c=#FF5733:s=1080x1920:d=5[bg]');
    filterArray.push('[0:v]scale=1080:670:force_original_aspect_ratio=increase,crop=1080:670,format=yuva420p[screen_raw]');
    filterArray.push('[1:v]scale=1080:670,format=rgba[screenmask]');
    filterArray.push('[screenmask]alphaextract[screenmask_alpha]');
    filterArray.push('[screen_raw][screenmask_alpha]alphamerge,format=yuva420p[screen]');
    filterArray.push('[bg][screen]overlay=0:625[out]');

    const command = ffmpeg()
      .input(videoPath)
      .input(maskPath)
      .complexFilter(filterArray)
      .outputOptions([
        '-map', '[out]',
        '-c:v', 'libx264',
        '-preset', 'fast', // Changed from ultrafast to fast for better comparison
        '-crf', '23',
        '-t', '5',
        '-threads', String(threadCount)
      ])
      .save(outputPath)
      .on('end', () => {
        const duration = (Date.now() - startTime) / 1000;
        resolve({ threads: threadCount, duration });
      })
      .on('error', (err) => {
        console.error(`Error with ${threadCount} threads:`, err.message);
        resolve({ threads: threadCount, duration: -1 });
      });
  });
}

async function runTests() {
  console.log(`System has ${os.cpus().length} CPU cores\n`);
  console.log('Testing FFmpeg multi-threading performance...\n');
  
  const tests = [
    { threads: 1, name: 'test-1-thread.mp4' },
    { threads: 2, name: 'test-2-threads.mp4' },
    { threads: 4, name: 'test-4-threads.mp4' },
    { threads: 0, name: 'test-auto-threads.mp4' } // 0 = auto-detect
  ];
  
  if (os.cpus().length >= 8) {
    tests.push({ threads: 8, name: 'test-8-threads.mp4' });
  }
  
  const results = [];
  
  for (const test of tests) {
    console.log(`Testing with ${test.threads === 0 ? 'auto' : test.threads} thread(s)...`);
    const result = await testWithThreads(test.threads, test.name);
    results.push(result);
    console.log(`Completed in ${result.duration.toFixed(2)}s\n`);
  }
  
  console.log('Results Summary:');
  console.log('================');
  results.forEach(r => {
    const threads = r.threads === 0 ? 'Auto' : r.threads;
    console.log(`${threads} thread(s): ${r.duration.toFixed(2)}s`);
  });
  
  const fastest = results.reduce((min, r) => r.duration < min.duration ? r : min);
  const baseline = results.find(r => r.threads === 1);
  
  if (baseline && fastest.threads !== 1) {
    const speedup = baseline.duration / fastest.duration;
    console.log(`\n🚀 Best performance: ${fastest.threads === 0 ? 'Auto' : fastest.threads} threads`);
    console.log(`   ${speedup.toFixed(1)}x faster than single-threaded!`);
  }
}

runTests();