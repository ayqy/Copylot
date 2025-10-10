import fs from 'fs';
import path from 'path';
import glob from 'glob';

const projectRoot = process.cwd();
const casesDir = path.join(projectRoot, 'test/cases');
const manifestPath = path.join(projectRoot, 'test/test-manifest.json');

console.log('Building test manifest...');

const htmlFiles = glob.sync('**/*.html', { cwd: casesDir });

let previousManifest: Record<string, Record<string, unknown>> = {};
if (fs.existsSync(manifestPath)) {
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    previousManifest = parsed.reduce<Record<string, Record<string, unknown>>>((acc, entry) => {
      if (typeof entry.path === 'string') {
        acc[entry.path] = entry;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('\x1b[31mError: failed to parse existing manifest; custom fields may be lost.\x1b[0m');
    console.error(error);
  }
}

const manifest = htmlFiles.map(file => {
  const testPath = `cases/${file}`;
  const title = path.basename(file, '.html').replace(/[-_]/g, ' ');
  const snapshotPath = path.join(projectRoot, 'test', 'snapshots', file.replace('.html', '.expected.md'));
  let expected: string | undefined;
  if (fs.existsSync(snapshotPath)) {
    expected = fs.readFileSync(snapshotPath, 'utf-8');
  }
  const baseEntry: Record<string, unknown> = expected !== undefined ? { path: testPath, title, expected } : { path: testPath, title };
  const previous = previousManifest[testPath];
  if (previous) {
    for (const [key, value] of Object.entries(previous)) {
      if (!(key in baseEntry) && key !== 'title') {
        baseEntry[key] = value;
      }
    }
  }
  return baseEntry;
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Manifest created at ${manifestPath} with ${manifest.length} test cases.`);
