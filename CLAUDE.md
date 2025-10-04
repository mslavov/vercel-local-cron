# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript library that runs Vercel cron jobs locally during Next.js development. It spawns `next dev`, detects the port, parses `vercel.json`, and schedules HTTP GET requests to local cron endpoints using the Croner library.

## Build Commands

```bash
# Build TypeScript to dist/
npm run build

# Type check without emitting
npm run typecheck

# Run CLI in development (uses tsx)
npm run dev
```

## Architecture

### Process Flow

The CLI (`src/cli/index.ts`) orchestrates everything:

1. **Spawns Next.js**: Uses `child_process.spawn` to run `npx next dev`
2. **Port Detection**: Monitors stdout until Next.js outputs "ready on http://localhost:XXXX"
3. **Scheduler Initialization**: Once port detected, creates `CronScheduler` instance
4. **Cron Execution**: Scheduler uses Croner library to trigger HTTP GET requests on schedule
5. **Shutdown**: SIGINT/SIGTERM handlers stop all jobs and kill Next.js process

### Key Components

- **CLI Layer** (`src/cli/index.ts`): Process orchestration, stdout monitoring, lifecycle management
- **Config Layer** (`src/config/parser.ts`): Validates `vercel.json` structure
- **Scheduler Layer** (`src/scheduler/index.ts`): Wraps Croner library, manages job lifecycle
- **Executor Layer** (`src/http/executor.ts`): Makes authenticated HTTP GET requests
- **Port Detection** (`src/port/detector.ts`): Regex matching against Next.js output

### Critical Implementation Details

**Port Detection Timing**: The scheduler is initialized lazily after port detection, not eagerly. This means `scheduler` is nullable until Next.js starts. The detection happens by matching regex patterns against stdout data chunks.

**Error Handling Philosophy**: The HTTP executor never rejects - it always resolves and logs errors. This prevents one failing cron job from breaking the scheduler. Individual job scheduling errors also don't affect other jobs.

**Process Shutdown**: The CLI sets up shutdown handlers in two places:
1. `setupShutdownHandlers(scheduler)` in scheduler module (SIGINT/SIGTERM/exit)
2. Direct SIGINT handler in CLI that kills the Next.js child process with 1s grace period

**Module System**: Pure ESM. All imports use `.js` extensions even for `.ts` files (TypeScript ESM convention). The `import.meta.url` check determines if the module is the entry point.

## Module Boundaries

- **Public API** (`src/index.ts`): Only exports are public. Everything else is internal.
- **CLI Independence**: The CLI can run standalone via `bin/vercel-local-cron.js` which imports `dist/cli/index.js`
- **Type Definitions**: All types live in `src/types/index.ts` and are re-exported from main index

## Development Workflow

When making changes:

1. **Always build after TypeScript changes**: `npm run build`
2. **Test the CLI** by running it in a test Next.js project with a `vercel.json`
3. **Port detection** can be tested by checking stdout patterns match `src/port/detector.ts` regex
4. **No test suite**: Manual testing required with real Next.js project

## Configuration Files

**vercel.json**: Required in project root. Must have `crons` array with `path` and `schedule` fields.

**Environment**: Loads `.env.local` via dotenv. Looks for `CRON_SECRET` and optionally `PORT`.

**tsconfig.json**: Uses bundler module resolution, ES2020 target, incremental builds. Output goes to `dist/` with declarations and source maps.

## Common Modifications

**Adding new port detection patterns**: Modify `detectPort()` in `src/port/detector.ts` and add regex patterns.

**Supporting HTTP methods beyond GET**: Modify `executeRequest()` in `src/http/executor.ts` to accept method parameter.

**Custom authentication schemes**: Extend the headers object in `executeRequest()`.

**Additional environment files**: Modify `dotenv.config()` calls in `src/cli/index.ts` to support other file patterns.
