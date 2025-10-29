/**
 * Measure projectile update performance with 1,500 active projectiles
 */

import { performance } from 'perf_hooks';
import { makePool } from '../src/util/pool';
import { createProjectileFactory, stepProjectiles } from '../src/systems/projectiles';
import type { Projectile } from '../src/types';

const TARGET_PROJECTILES = 1500;
const FRAMES = 180; // 3 seconds at 60fps
const DT = 1 / 60; // 60fps timestep

console.log('Projectile Performance Test');
console.log('===========================\n');
console.log(`Target projectiles: ${TARGET_PROJECTILES}`);
console.log(`Frames: ${FRAMES}`);
console.log(`Timestep: ${DT.toFixed(6)}s\n`);

// Create pool and projectiles
const pool = makePool(createProjectileFactory(), TARGET_PROJECTILES + 100);
const projectiles: Projectile[] = [];

// Spawn projectiles
console.log('Spawning projectiles...');
for (let i = 0; i < TARGET_PROJECTILES; i++) {
  const proj = pool.take();
  if (proj) {
    proj.active = true;
    proj.pos = { x: 400, y: 300 };

    // Random directions
    const angle = (i / TARGET_PROJECTILES) * Math.PI * 2;
    proj.dir = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    proj.speed = 100 + (i % 200);
    proj.damage = 10;
    proj.ttl = 5.0; // Long TTL so they don't expire during test
    projectiles.push(proj);
  }
}

console.log(`Spawned: ${projectiles.length} projectiles`);
console.log(`Pool available: ${pool.available()}/${pool.size()}\n`);

// Warmup
console.log('Warming up (60 frames)...');
for (let i = 0; i < 60; i++) {
  stepProjectiles(DT, projectiles, pool);
}

// Measure
console.log('Measuring...\n');
const frameTimes: number[] = [];

for (let i = 0; i < FRAMES; i++) {
  const start = performance.now();
  stepProjectiles(DT, projectiles, pool);
  const end = performance.now();
  frameTimes.push(end - start);
}

// Calculate statistics
const sorted = [...frameTimes].sort((a, b) => a - b);
const sum = sorted.reduce((a, b) => a + b, 0);
const avg = sum / sorted.length;
const min = sorted[0];
const max = sorted[sorted.length - 1];
const p50 = sorted[Math.floor(sorted.length * 0.5)];
const p95 = sorted[Math.floor(sorted.length * 0.95)];
const p99 = sorted[Math.floor(sorted.length * 0.99)];

console.log('Results:');
console.log('--------');
console.log(`Projectiles: ${projectiles.length}`);
console.log(`Average:     ${avg.toFixed(3)}ms`);
console.log(`Min:         ${min.toFixed(3)}ms`);
console.log(`Max:         ${max.toFixed(3)}ms`);
console.log(`P50:         ${p50.toFixed(3)}ms`);
console.log(`P95:         ${p95.toFixed(3)}ms`);
console.log(`P99:         ${p99.toFixed(3)}ms`);
console.log();

// Check against target
const TARGET_FRAME_TIME = 16.666; // 60fps

if (p95 < TARGET_FRAME_TIME) {
  console.log(`✓ P95 (${p95.toFixed(3)}ms) is below 60fps budget (${TARGET_FRAME_TIME}ms)`);
  console.log('✓ Performance: EXCELLENT');
} else if (p95 < TARGET_FRAME_TIME * 1.5) {
  console.log(`⚠ P95 (${p95.toFixed(3)}ms) is slightly above 60fps budget (${TARGET_FRAME_TIME}ms)`);
  console.log('⚠ Performance: ACCEPTABLE');
} else {
  console.log(`✗ P95 (${p95.toFixed(3)}ms) exceeds 60fps budget (${TARGET_FRAME_TIME}ms)`);
  console.log('✗ Performance: NEEDS OPTIMIZATION');
}

console.log();
console.log(`Throughput: ${((TARGET_PROJECTILES * FRAMES) / (sum / 1000)).toFixed(0)} projectile-updates/sec`);
console.log(`Pool status: ${pool.available()}/${pool.size()} available`);
