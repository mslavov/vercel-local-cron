/**
 * Represents a single cron job definition from vercel.json
 */
export interface CronJob {
  /**
   * API route path to call (e.g., "/api/cron/cleanup")
   */
  path: string;

  /**
   * Cron expression (e.g., "0 0 * * *" for daily at midnight)
   */
  schedule: string;
}

/**
 * Vercel configuration file structure (partial)
 */
export interface VercelConfig {
  /**
   * Array of cron job definitions
   */
  crons?: CronJob[];
}

/**
 * Environment configuration
 */
export interface EnvConfig {
  /**
   * Secret token used to authenticate cron requests
   */
  cronSecret?: string;
}

/**
 * Configuration for the local cron executor
 */
export interface LocalCronConfig {
  /**
   * Parsed vercel.json configuration
   */
  vercelConfig: VercelConfig;

  /**
   * Environment configuration
   */
  envConfig: EnvConfig;

  /**
   * Port the Next.js dev server is running on
   */
  port: number;
}
