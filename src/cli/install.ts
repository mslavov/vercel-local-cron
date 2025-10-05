import { readFile, writeFile, access } from 'fs/promises';
import { resolve } from 'path';
import { spawn } from 'child_process';

/**
 * Detect which package manager is being used
 */
async function detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
  const cwd = process.cwd();

  try {
    await access(resolve(cwd, 'bun.lockb'));
    return 'bun';
  } catch {}

  try {
    await access(resolve(cwd, 'pnpm-lock.yaml'));
    return 'pnpm';
  } catch {}

  try {
    await access(resolve(cwd, 'yarn.lock'));
    return 'yarn';
  } catch {}

  return 'npm';
}

/**
 * Install vercel-local-cron as a dev dependency
 */
async function installPackage(packageManager: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = packageManager === 'npm'
      ? ['install', '--save-dev', 'vercel-local-cron']
      : packageManager === 'yarn'
      ? ['add', '--dev', 'vercel-local-cron']
      : ['add', '-D', 'vercel-local-cron'];

    const proc = spawn(packageManager, args, {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${packageManager} install failed with code ${code}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Update package.json dev script
 */
async function updatePackageJson(): Promise<void> {
  const packageJsonPath = resolve(process.cwd(), 'package.json');

  try {
    const content = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Update the dev script
    const currentDevScript = packageJson.scripts.dev || 'next dev';

    if (currentDevScript.includes('vercel-local-cron')) {
      console.log('⚠️  Dev script already configured with vercel-local-cron');
      return;
    }

    packageJson.scripts.dev = 'vercel-local-cron run';

    // Write back with proper formatting
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

    console.log('✅ Updated package.json dev script');
  } catch (error) {
    throw new Error(`Failed to update package.json: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Run the install command
 */
export async function installCommand(): Promise<void> {
  console.log('🚀 Installing vercel-local-cron...\n');

  try {
    // Detect package manager
    const packageManager = await detectPackageManager();
    console.log(`📦 Detected package manager: ${packageManager}\n`);

    // Install the package
    console.log('📥 Installing vercel-local-cron as dev dependency...\n');
    await installPackage(packageManager);

    // Update package.json
    console.log('\n📝 Updating package.json...\n');
    await updatePackageJson();

    console.log('\n✅ Installation complete!\n');
    console.log('Next steps:');
    console.log('  1. Make sure you have a vercel.json file with cron jobs defined');
    console.log('  2. Add CRON_SECRET to your .env.local file');
    console.log('  3. Run: npm run dev\n');

  } catch (error) {
    console.error('❌ Installation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
