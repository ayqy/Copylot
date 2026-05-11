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
  const onlyNativeUi = process.env.COPYLOT_E2E_ONLY_NATIVE_UI === '1';
  const skipNativeUi = onlyNativeUi ? false : process.env.COPYLOT_E2E_NATIVE_UI_SKIP !== '0';

  if (!skipBuild) {
    await runCommand('npm', ['run', 'build:e2e']);
  }

  if (!onlyNativeUi) {
    await runCommand('npx', ['playwright', 'test', '--config=playwright.config.ts', '--project=main']);
  }

  if (!skipNativeUi) {
    await runCommand('npx', ['playwright', 'test', '--config=playwright.config.ts', '--project=native-ui']);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
