/**
 * Measure frame performance over 3 seconds
 */

import { performance } from 'perf_hooks';
import { stepSync, calculateFPSStats } from '../src/core/loop';
import { initWorld, updateWorld } from '../src/state/world';

const SEED = 42;
const DURATION_SECONDS = 3;
const FRAMES = 60 * DURATION_SECONDS;
const WARMUP_FRAMES = 60; // 1 second warmup

console.log('Performance Measurement');
console.log('======================\n');

// Warmup
console.log('Warming up (1 second)...');
let state = initWorld(SEED);
for (let i = 0; i < WARMUP_FRAMES; i++) {
  state = updateWorld(state);
}

// Measure
console.log(`Measuring (${DURATION_SECONDS} seconds @ 60fps = ${FRAMES} frames)...\n`);
const frameTimes: number[] = [];

for (let i = 0; i < FRAMES; i++) {
  const start = performance.now();
  state = updateWorld(state);
  const end = performance.now();
  frameTimes.push(end - start);
}

// Calculate statistics
const stats = calculateFPSStats(frameTimes);

console.log('Results:');
console.log('--------');
console.log(`Average:     ${stats.avg.toFixed(3)}ms`);
console.log(`Min:         ${stats.min.toFixed(3)}ms`);
console.log(`Max:         ${stats.max.toFixed(3)}ms`);
console.log(`P95:         ${stats.p95.toFixed(3)}ms`);
console.log(`P99:         ${stats.p99.toFixed(3)}ms`);
console.log();

// Check against target
const TARGET_FRAME_TIME = 16.666; // 60fps
const TARGET_P95 = TARGET_FRAME_TIME;

if (stats.p95 < TARGET_P95) {
  console.log(`✓ P95 (${stats.p95.toFixed(3)}ms) is below target (${TARGET_P95}ms)`);
  console.log('✓ Performance: EXCELLENT');
} else if (stats.p95 < TARGET_P95 * 1.5) {
  console.log(`⚠ P95 (${stats.p95.toFixed(3)}ms) is slightly above target (${TARGET_P95}ms)`);
  console.log('⚠ Performance: ACCEPTABLE');
} else {
  console.log(`✗ P95 (${stats.p95.toFixed(3)}ms) is well above target (${TARGET_P95}ms)`);
  console.log('✗ Performance: NEEDS OPTIMIZATION');
}

console.log();
console.log(`Total frames simulated: ${state.frameCount}`);
console.log(`Total simulation time: ${state.time.toFixed(2)}s`);
