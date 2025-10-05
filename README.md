# Vercel Local Cron

> Run Vercel cron jobs locally during Next.js development

A lightweight TypeScript library that automatically executes Vercel cron jobs on your local machine during `npm run dev`. No more manual testing or deploying to preview environments just to test your cron jobs!

## Features

- ✅ **Automatic Scheduling** - Reads `vercel.json` and schedules cron jobs locally
- 🔒 **Authentication** - Includes `CRON_SECRET` from `.env.local` in requests
- 🚀 **Zero Configuration** - Works out of the box with Next.js projects
- 🎯 **Port Detection** - Automatically detects the Next.js dev server port
- 🧹 **Clean Shutdown** - Gracefully stops all jobs when you stop the dev server
- 📝 **TypeScript Support** - Fully typed with comprehensive type definitions

## Installation

```bash
npm install vercel-local-cron --save-dev
# or
yarn add -D vercel-local-cron
# or
pnpm add -D vercel-local-cron
```

## Quick Start

### 1. Install in Your Project

Run the install command to automatically configure your project:

```bash
npx vercel-local-cron install
```

This will:
- Install `vercel-local-cron` as a dev dependency
- Update your `package.json` dev script to use `vercel-local-cron run`

### 2. Define Cron Jobs in `vercel.json`

Create a `vercel.json` file in your project root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-emails",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### 3. Add `CRON_SECRET` to `.env.local`

```bash
CRON_SECRET=your-secret-token-here
```

### 4. Start Development

```bash
npm run dev
```

That's it! Your cron jobs will now execute on schedule during development.

## How It Works

1. **Starts Next.js** - Spawns `next dev` and monitors the output
2. **Detects Port** - Automatically detects which port Next.js is running on
3. **Schedules Jobs** - Reads `vercel.json` and schedules cron jobs using [Croner](https://github.com/hexagon/croner)
4. **Executes Requests** - Makes authenticated HTTP GET requests to your endpoints on schedule
5. **Clean Shutdown** - Stops all jobs when you press Ctrl+C

## Configuration

### Environment Variables

The library looks for environment files in this order:
1. `.env.local` (highest priority)
2. `.env.development`
3. `.env`

**Supported variables:**
- `CRON_SECRET` - Secret token included in Authorization header
- `PORT` - Custom port (if Next.js doesn't auto-detect)

### vercel.json Structure

```json
{
  "crons": [
    {
      "path": "/api/cron/my-job",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Cron Expression Format:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Common Examples:**
- `0 0 * * *` - Daily at midnight
- `*/15 * * * *` - Every 15 minutes
- `0 */2 * * *` - Every 2 hours
- `0 9 * * 1` - Every Monday at 9 AM

## CLI Commands

### `install`

Automatically install and configure vercel-local-cron in your project:

```bash
npx vercel-local-cron install
```

This command:
- Detects your package manager (npm, yarn, pnpm, or bun)
- Installs vercel-local-cron as a dev dependency
- Updates your `package.json` dev script to `vercel-local-cron run`

### `run`

Run the cron scheduler with Next.js dev server:

```bash
vercel-local-cron run
```

This is what gets executed when you run `npm run dev` after installation.

### `help`

Show help message with available commands:

```bash
vercel-local-cron help
```

## API Usage

You can also use the library programmatically:

```typescript
import { CronScheduler, parseVercelConfig, runDev, installCommand } from 'vercel-local-cron';

// Run the dev server programmatically
await runDev();

// Or use individual components
const vercelConfig = await parseVercelConfig();

const scheduler = new CronScheduler({
  port: 3000,
  cronSecret: process.env.CRON_SECRET,
  jobs: vercelConfig.crons || [],
});

// Stop all jobs later
scheduler.stop();
```

## Example API Route

Here's how to secure your cron endpoints in Next.js:

```typescript
// app/api/cron/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify the request is from a cron job
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your cron job logic here
  console.log('Running cleanup job...');

  return NextResponse.json({ success: true });
}
```

## Troubleshooting

### Port Not Detected

If the port isn't automatically detected, you can:

1. **Set PORT environment variable:**
   ```bash
   PORT=3000 npx vercel-local-cron
   ```

2. **Check Next.js output** - The library looks for "ready on" messages

### No Cron Jobs Running

- Verify `vercel.json` exists in your project root
- Check that `crons` array is properly formatted
- Look for error messages in the console output

### Authorization Errors

- Ensure `CRON_SECRET` is set in `.env.local`
- Verify your API route is checking the Authorization header correctly
- The header format is `Bearer <your-secret>`

### Jobs Not Executing

- Check the console for scheduling confirmation
- Verify the cron expression is valid
- Ensure the API endpoint exists and is accessible

## Requirements

- **Node.js** ≥ 18.0.0
- **Next.js** 13, 14, or 15

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Type check
npm run typecheck
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Made with ❤️ for Next.js developers**
