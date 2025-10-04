#!/usr/bin/env node

import('../dist/cli/index.js')
  .then((module) => module.runCli())
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
