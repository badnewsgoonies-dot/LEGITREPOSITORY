/**
 * Generate a sample replay JSON artifact
 */

import { writeFileSync } from 'fs';
import { beginRun, log, endRun, exportRunLog } from '../src/core/replay';
import { stepSync } from '../src/core/loop';
import { initWorld, updateWorld } from '../src/state/world';

const SEED = 42;
const DURATION_SECONDS = 3;
const FRAMES = 60 * DURATION_SECONDS;

console.log('Generating replay sample...');
console.log(`Seed: ${SEED}`);
console.log(`Duration: ${DURATION_SECONDS}s (${FRAMES} frames)`);

// Start recording
beginRun(SEED);

let state = initWorld(SEED);

// Simulate some gameplay events
const syntheticEvents = [
  { frame: 0, action: 'game_start' },
  { frame: 30, action: 'move_right' },
  { frame: 45, action: 'shoot' },
  { frame: 60, action: 'move_left' },
  { frame: 90, action: 'shoot' },
  { frame: 120, action: 'move_up' },
  { frame: 150, action: 'shoot' },
];

// Run simulation
for (let frame = 0; frame < FRAMES; frame++) {
  state = updateWorld(state);

  // Log synthetic events
  const event = syntheticEvents.find((e) => e.frame === frame);
  if (event) {
    log({
      type: 'input',
      frame,
      action: event.action,
    });
  }

  // Log periodic tick events
  if (frame % 60 === 0 && frame > 0) {
    log({
      type: 'custom',
      frame,
      name: 'second_tick',
      data: { second: frame / 60 },
    });
  }
}

// End recording
const runLog = endRun(state);
const json = exportRunLog(runLog);

// Write to file
const outputPath = 'replay-sample.json';
writeFileSync(outputPath, json, 'utf-8');

console.log(`\n✓ Generated ${outputPath}`);
console.log(`  Events: ${runLog.events.length}`);
console.log(`  Final Hash: ${runLog.finalHash}`);
console.log(`  Frame Count: ${runLog.frameCount}`);
