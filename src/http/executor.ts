import http from 'http';

export interface RequestOptions {
  port: number;
  path: string;
  cronSecret?: string;
}

/**
 * Execute an HTTP GET request to a local cron endpoint
 */
export async function executeRequest(options: RequestOptions): Promise<void> {
  const { port, path, cronSecret } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();

    const headers: http.OutgoingHttpHeaders = {};
    if (cronSecret) {
      headers['Authorization'] = `Bearer ${cronSecret}`;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method: 'GET',
        headers,
        timeout: 30000, // 30 second timeout
      },
      (res) => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode ?? 0;

        // Consume response to free up memory
        res.resume();

        if (statusCode >= 200 && statusCode < 300) {
          console.log(`✅ [${new Date().toISOString()}] ${path} - ${statusCode} (${duration}ms)`);
          resolve();
        } else {
          console.error(`❌ [${new Date().toISOString()}] ${path} - ${statusCode} (${duration}ms)`);
          resolve(); // Don't reject, just log the error
        }
      }
    );

    req.on('error', (error) => {
      console.error(`❌ [${new Date().toISOString()}] ${path} - Request failed:`, error.message);
      resolve(); // Don't reject, just log the error
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`❌ [${new Date().toISOString()}] ${path} - Request timeout (30s)`);
      resolve(); // Don't reject, just log the error
    });

    req.end();
  });
}
