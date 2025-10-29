/**
 * Collision System Demo
 *
 * Demonstrates deterministic collision detection and damage with a specific seed.
 * Run this multiple times with the same seed to verify consistency.
 */

import { initWorld, updateWorld, debugWorld } from '../src/state/world';

const SEED = 123456;
const SIMULATION_SECONDS = 10;
const FPS = 60;

console.log('='.repeat(60));
console.log('Collision System Demo - Deterministic Replay');
console.log('='.repeat(60));
console.log(`Seed: ${SEED}`);
console.log(`Duration: ${SIMULATION_SECONDS} seconds`);
console.log('');

// Initialize world
let world = initWorld(SEED, true);
const totalFrames = SIMULATION_SECONDS * FPS;

// Track collision events
const collisionLog: Array<{
  frame: number;
  type: string;
  details: string;
}> = [];

// Run simulation
console.log('Running simulation...\n');

for (let frame = 0; frame < totalFrames; frame++) {
  const prevPlayerHp = world.player.hp;
  const prevEnemyCount = world.enemies.length;

  // Update world
  world = updateWorld(world);

  // Log player damage
  if (world.player.hp < prevPlayerHp) {
    const damage = prevPlayerHp - world.player.hp;
    collisionLog.push({
      frame: world.frameCount,
      type: 'PLAYER_DAMAGE',
      details: `Player took ${damage} damage (HP: ${world.player.hp}/${world.player.maxHp})`,
    });
  }

  // Log enemy deaths
  if (world.enemies.length < prevEnemyCount) {
    const killed = prevEnemyCount - world.enemies.length;
    collisionLog.push({
      frame: world.frameCount,
      type: 'ENEMY_DEATH',
      details: `${killed} enemy(s) killed`,
    });
  }

  // Log every second
  if (frame % FPS === 0) {
    console.log(debugWorld(world));
  }
}

// Print collision summary
console.log('\n' + '='.repeat(60));
console.log('Collision Event Log (First 20 events)');
console.log('='.repeat(60));

const displayEvents = collisionLog.slice(0, 20);
for (const event of displayEvents) {
  console.log(`[Frame ${event.frame.toString().padStart(5)}] ${event.type.padEnd(15)} | ${event.details}`);
}

if (collisionLog.length > 20) {
  console.log(`... and ${collisionLog.length - 20} more events`);
}

console.log('\n' + '='.repeat(60));
console.log('Final Statistics');
console.log('='.repeat(60));

// Calculate statistics
const playerDamageEvents = collisionLog.filter((e) => e.type === 'PLAYER_DAMAGE');
const totalPlayerDamage = 100 - world.player.hp;
const enemyDeathEvents = collisionLog.filter((e) => e.type === 'ENEMY_DEATH');
const totalEnemyDeaths = enemyDeathEvents.reduce((sum, e) => {
  const match = e.details.match(/(\d+) enemy/);
  return sum + (match ? parseInt(match[1]) : 0);
}, 0);

console.log(`Final Player HP: ${world.player.hp}/${world.player.maxHp}`);
console.log(`Total Damage Taken: ${totalPlayerDamage}`);
console.log(`Damage Events: ${playerDamageEvents.length}`);
console.log(`Enemy Deaths: ${totalEnemyDeaths}`);
console.log(`Active Enemies: ${world.enemies.length}`);
console.log(`Active Projectiles: ${world.projectiles.length}`);
console.log(`Total Damage Events Logged: ${world.damageEvents.length}`);

console.log('\n' + '='.repeat(60));
console.log('Determinism Check');
console.log('='.repeat(60));
console.log('Run this script multiple times with the same seed.');
console.log('All values should be IDENTICAL every time.');
console.log('='.repeat(60));

// Determinism signature
const signature = {
  seed: SEED,
  finalFrame: world.frameCount,
  finalPlayerHp: world.player.hp,
  totalDamageEvents: world.damageEvents.length,
  enemyDeaths: totalEnemyDeaths,
  finalEnemyCount: world.enemies.length,
};

console.log('\nDeterminism Signature:');
console.log(JSON.stringify(signature, null, 2));
console.log('\n');
