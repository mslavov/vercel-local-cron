/**
 * Detect the port from Next.js dev server output
 * Looks for patterns like:
 * - "ready on http://localhost:3000"
 * - "ready on http://0.0.0.0:3000"
 * - "Local: http://localhost:3001"
 */
export function detectPort(output: string): number | null {
  // Pattern 1: "ready on http://localhost:PORT" or "ready on http://0.0.0.0:PORT"
  const readyPattern = /ready on https?:\/\/(?:localhost|0\.0\.0\.0):(\d+)/i;
  const readyMatch = output.match(readyPattern);
  if (readyMatch) {
    return parseInt(readyMatch[1], 10);
  }

  // Pattern 2: "Local: http://localhost:PORT"
  const localPattern = /Local:\s+https?:\/\/localhost:(\d+)/i;
  const localMatch = output.match(localPattern);
  if (localMatch) {
    return parseInt(localMatch[1], 10);
  }

  // Pattern 3: Check for PORT environment variable mention
  const envPattern = /port:?\s+(\d+)/i;
  const envMatch = output.match(envPattern);
  if (envMatch) {
    return parseInt(envMatch[1], 10);
  }

  return null;
}

/**
 * Get port from environment variable or use default
 */
export function getPortFromEnv(defaultPort: number = 3000): number {
  const envPort = process.env.PORT;
  if (envPort) {
    const port = parseInt(envPort, 10);
    if (!isNaN(port)) {
      return port;
    }
  }
  return defaultPort;
}
