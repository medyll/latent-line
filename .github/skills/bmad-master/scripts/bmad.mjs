#!/usr/bin/env node
// Shim to delegate to the user's installed bmad-master skill script.
// This file is intentionally small: it spawns the real script from the user's
// skills directory so package.json's `bmad:update-dashboard` works.
import { spawn } from 'child_process';

const args = process.argv.slice(2);
const target = 'C:\\Users\\Mydde\\.claude\\skills\\bmad-master\\scripts\\bmad.mjs';

const child = spawn(process.execPath, [target, ...args], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Failed to spawn bmad script:', err);
  process.exit(1);
});
