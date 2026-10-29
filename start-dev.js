import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('----------------------------------------------------');
console.log('🚀 Khởi động Nền tảng Soạn thảo LaTeX Cộng Tác...');
console.log('----------------------------------------------------');

// Start backend server
const serverProc = spawn(npmCmd, ['run', 'start'], {
  cwd: path.resolve(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Start client Vite dev server
const clientProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nĐang dừng các dịch vụ...');
  try {
    if (isWin) {
      if (serverProc.pid) spawn('taskkill', ['/pid', serverProc.pid.toString(), '/f', '/t']);
      if (clientProc.pid) spawn('taskkill', ['/pid', clientProc.pid.toString(), '/f', '/t']);
    } else {
      serverProc.kill('SIGINT');
      clientProc.kill('SIGINT');
    }
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

