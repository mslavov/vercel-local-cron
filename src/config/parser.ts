import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { VercelConfig } from '../types/index.js';

/**
 * Parse and validate vercel.json configuration
 */
export async function parseVercelConfig(cwd: string = process.cwd()): Promise<VercelConfig> {
  const configPath = resolve(cwd, 'vercel.json');

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content) as VercelConfig;

    // Validate structure
    if (config.crons && !Array.isArray(config.crons)) {
      throw new Error('vercel.json "crons" field must be an array');
    }

    // Validate each cron job
    if (config.crons) {
      for (const [index, cron] of config.crons.entries()) {
        if (!cron.path || typeof cron.path !== 'string') {
          throw new Error(`vercel.json crons[${index}] missing required "path" field`);
        }
        if (!cron.schedule || typeof cron.schedule !== 'string') {
          throw new Error(`vercel.json crons[${index}] missing required "schedule" field`);
        }
      }
    }

    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`vercel.json not found at ${configPath}`);
    }
    throw error;
  }
}
