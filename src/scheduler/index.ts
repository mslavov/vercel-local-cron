import { Cron } from 'croner';
import type { CronJob } from '../types/index.js';
import { executeRequest } from '../http/executor.js';

export interface CronSchedulerOptions {
  port: number;
  cronSecret?: string;
  jobs: CronJob[];
}

/**
 * Manages scheduling and execution of cron jobs
 */
export class CronScheduler {
  private jobs: Cron[] = [];
  private port: number;
  private cronSecret?: string;

  constructor(options: CronSchedulerOptions) {
    this.port = options.port;
    this.cronSecret = options.cronSecret;
    this.initializeJobs(options.jobs);
  }

  /**
   * Initialize cron jobs from configuration
   */
  private initializeJobs(jobConfigs: CronJob[]): void {
    if (!jobConfigs || jobConfigs.length === 0) {
      console.log('⚠️  No cron jobs found in vercel.json');
      return;
    }

    console.log(`\n🕐 Scheduling ${jobConfigs.length} cron job${jobConfigs.length > 1 ? 's' : ''}:\n`);

    for (const jobConfig of jobConfigs) {
      try {
        const job = new Cron(jobConfig.schedule, async () => {
          await executeRequest({
            port: this.port,
            path: jobConfig.path,
            cronSecret: this.cronSecret,
          });
        });

        this.jobs.push(job);

        const nextRun = job.nextRun();
        const nextRunStr = nextRun ? nextRun.toISOString() : 'never';
        console.log(`  • ${jobConfig.path}`);
        console.log(`    Schedule: ${jobConfig.schedule}`);
        console.log(`    Next run: ${nextRunStr}\n`);
      } catch (error) {
        console.error(`❌ Failed to schedule job ${jobConfig.path}:`, error);
      }
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log('\n🛑 Stopping all cron jobs...');
    for (const job of this.jobs) {
      job.stop();
    }
    this.jobs = [];
  }

  /**
   * Get the number of scheduled jobs
   */
  get count(): number {
    return this.jobs.length;
  }
}

/**
 * Set up graceful shutdown handlers
 */
export function setupShutdownHandlers(scheduler: CronScheduler): void {
  const shutdown = () => {
    scheduler.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', () => {
    scheduler.stop();
  });
}
