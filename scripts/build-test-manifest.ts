import fs from 'fs';
import path from 'path';
import glob from 'glob';

const projectRoot = process.cwd();
const casesDir = path.join(projectRoot, 'test/cases');
const manifestPath = path.join(projectRoot, 'test/test-manifest.json');

console.log('Building test manifest...');

const htmlFiles = glob.sync('**/*.html', { cwd: casesDir });

const manifest = htmlFiles.map(file => {
  const testPath = `cases/${file}`;
  const title = path.basename(file, '.html').replace(/[-_]/g, ' ');
  const snapshotPath = path.join(projectRoot, 'test', 'snapshots', file.replace('.html', '.expected.md'));
  let expected: string | undefined;
  if (fs.existsSync(snapshotPath)) {
    expected = fs.readFileSync(snapshotPath, 'utf-8');
  }
  return expected !== undefined ? { path: testPath, title, expected } : { path: testPath, title };
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Manifest created at ${manifestPath} with ${manifest.length} test cases.`);
