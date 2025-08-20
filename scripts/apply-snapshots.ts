import fs from 'fs';
import path from 'path';
import clipboard from 'clipboardy';

async function applySnapshots() {
  console.log('Reading snapshot batch from clipboard...');
  try {
    const clipboardContent = await clipboard.read();
    if (!clipboardContent) {
      console.error('Error: Clipboard is empty.');
      return;
    }

    const snapshots: Record<string, string> = JSON.parse(clipboardContent);
    const projectRoot = process.cwd();
    let appliedCount = 0;

    for (const relativePath in snapshots) {
      const absolutePath = path.join(projectRoot, relativePath);
      const content = snapshots[relativePath];
      
      console.log(`Updating snapshot for: ${relativePath}`);
      
      // Ensure directory exists
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(absolutePath, content, 'utf-8');
      appliedCount++;
    }

    console.log(`
Successfully applied ${appliedCount} snapshot(s).`);

  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Error: Clipboard content is not valid JSON. Please copy the batch from the test runner page.');
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

applySnapshots();
