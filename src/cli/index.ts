import { spawn } from 'child_process';
import { config } from 'dotenv';
import { parseVercelConfig } from '../config/parser.js';
import { detectPort, getPortFromEnv } from '../port/detector.js';
import { CronScheduler, setupShutdownHandlers } from '../scheduler/index.js';

/**
 * Main CLI entry point that wraps next dev
 */
export async function runCli(): Promise<void> {
  console.log('🚀 Starting Vercel Local Cron...\n');

  try {
    // Load environment variables
    config({ path: '.env.local' });

    // Load configuration
    const vercelConfig = await parseVercelConfig();

    if (!vercelConfig.crons || vercelConfig.crons.length === 0) {
      console.log('⚠️  No cron jobs defined in vercel.json. Exiting.');
      process.exit(0);
    }

    // Try to get port from environment first
    let port = getPortFromEnv();
    let portDetected = false;

    // Start Next.js dev server
    console.log('📦 Starting Next.js dev server...\n');
    const nextProcess = spawn('npx', ['next', 'dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    let scheduler: CronScheduler | null = null;

    // Monitor stdout for port detection
    nextProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      process.stdout.write(output);

      // Try to detect port from output if not already detected
      if (!portDetected) {
        const detectedPort = detectPort(output);
        if (detectedPort) {
          port = detectedPort;
          portDetected = true;
          console.log(`\n✅ Detected Next.js running on port ${port}\n`);

          // Initialize scheduler
          scheduler = new CronScheduler({
            port,
            cronSecret: process.env.CRON_SECRET,
            jobs: vercelConfig.crons || [],
          });

          setupShutdownHandlers(scheduler);
        }
      }
    });

    // Forward stderr
    nextProcess.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data);
    });

    // Handle Next.js process exit
    nextProcess.on('close', (code) => {
      console.log(`\n📦 Next.js process exited with code ${code}`);
      if (scheduler) {
        scheduler.stop();
      }
      process.exit(code ?? 0);
    });

    // Handle errors
    nextProcess.on('error', (error) => {
      console.error('❌ Failed to start Next.js:', error.message);
      process.exit(1);
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down...');
      if (scheduler) {
        scheduler.stop();
      }
      nextProcess.kill('SIGINT');
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    });

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
