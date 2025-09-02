const os = require('os');

console.log('System Performance Analysis:');
console.log('===========================');
console.log(`CPU Cores: ${os.cpus().length}`);
console.log(`CPU Model: ${os.cpus()[0].model}`);
console.log(`Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`Platform: ${os.platform()}`);
console.log(`Architecture: ${os.arch()}`);

console.log('\nFFmpeg Optimization Suggestions:');
console.log('================================');
console.log(`1. Remove -filter_complex_threads 1 (we don't need it with masks)`);
console.log(`2. Use -threads ${os.cpus().length} or -threads 0 (auto)`);
console.log(`3. Consider -preset fast/medium instead of ultrafast`);
console.log(`4. Enable hardware acceleration if available`);
console.log(`5. Process multiple videos in parallel`);