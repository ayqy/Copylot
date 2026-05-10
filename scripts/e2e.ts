import { spawn } from 'node:child_process';

function runCommand(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function run(): Promise<void> {
  const skipBuild = process.env.COPYLOT_E2E_SKIP_BUILD === '1';

  if (!skipBuild) {
    await runCommand('npm', ['run', 'build:prod']);
  }

  await runCommand('npx', ['playwright', 'test', '--config=playwright.config.ts']);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
