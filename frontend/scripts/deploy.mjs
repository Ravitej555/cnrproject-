import { execSync } from 'child_process';
import { mkdtempSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

console.log('📦 Building project bundle...');
execSync('npm run build', { stdio: 'inherit' });

const tempDir = mkdtempSync(join(tmpdir(), 'gh-pages-'));
console.log('📁 Copying dist to temporary directory:', tempDir);
cpSync('dist', tempDir, { recursive: true });

try {
  const run = (cmd) => execSync(cmd, { cwd: tempDir, stdio: 'inherit' });
  console.log('🚀 Initializing git and deploying to gh-pages...');
  run('git init');
  run('git checkout -b gh-pages');
  run('git add -A');
  run('git commit -m "Deploy to GitHub Pages: ' + new Date().toISOString() + '"');
  run('git remote add origin https://github.com/Ravitej555/cnrproject-.git');
  run('git push -f origin gh-pages');
  console.log('✅ Live demo deployment complete!');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
