const { spawn } = require('child_process');
const cp = spawn('node', ['dist/server.cjs'], {
  env: { ...process.env, NODE_ENV: 'production', PORT: '3001' }
});

cp.stdout.on('data', (d) => process.stdout.write(d));
cp.stderr.on('data', (d) => process.stdout.write(d));

setTimeout(() => cp.kill(), 3000);
