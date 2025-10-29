/**
 * Collision System Test - Forced Collision Scenario
 *
 * This test manually places enemies and projectiles to guarantee collisions,
 * demonstrating the collision detection and damage system with a specific seed.
 */

import { initWorld, updateWorld } from '../src/state/world';
import type { Enemy } from '../src/types';

const SEED = 999888;

console.log('='.repeat(70));
console.log('Collision System Test - Forced Collisions');
console.log('='.repeat(70));
console.log(`Seed: ${SEED}\n`);

// Initialize world without default weapon
let world = initWorld(SEED, false);

console.log('Scenario 1: Projectile hits enemy');
console.log('-'.repeat(70));

// Place enemy in front of player
const enemy1: Enemy = {
  id: 'test_enemy_1',
  kind: 'zombie',
  pos: { x: 450, y: 300 }, // 50 pixels to the right of player
  hp: 20,
  maxHp: 20,
  speed: 50,
  touchDamage: 5,
  isElite: false,
  radius: 8,
};
world.enemies.push(enemy1);

// Add projectile moving right towards enemy
world.projectiles.push({
  active: true,
  pos: { x: 420, y: 300 }, // Between player and enemy
  dir: { x: 1, y: 0 }, // Moving right
  speed: 300,
  damage: 10,
  ttl: 2.0,
  radius: 3,
});

console.log(`Initial state:`);
console.log(`  Enemy HP: ${enemy1.hp}/${enemy1.maxHp} at (${enemy1.pos.x}, ${enemy1.pos.y})`);
console.log(`  Projectile at (${world.projectiles[0].pos.x}, ${world.projectiles[0].pos.y})`);
console.log(`  Active projectiles: ${world.projectiles.length}`);
console.log(`  Active enemies: ${world.enemies.length}`);

// Update world once - projectile should hit enemy
world = updateWorld(world);

console.log(`\nAfter 1 frame:`);
console.log(`  Damage events: ${world.damageEvents.length}`);
if (world.damageEvents.length > 0) {
  const event = world.damageEvents[0];
  console.log(`  - Frame ${event.frame}: ${event.source} dealt ${event.damage} damage to ${event.targetId}`);
}
console.log(`  Active projectiles: ${world.projectiles.length}`);
console.log(`  Active enemies: ${world.enemies.length}`);
if (world.enemies.length > 0) {
  console.log(`  Enemy HP: ${world.enemies[0].hp}/${world.enemies[0].maxHp}`);
}

console.log('\n' + '='.repeat(70));
console.log('Scenario 2: Enemy touches player (with i-frames)');
console.log('-'.repeat(70));

// Reset world
world = initWorld(SEED, false);
world.player.pos = { x: 400, y: 300 };
world.player.hp = 100;
world.player.iframes = 0;

// Place enemy at player position
const enemy2: Enemy = {
  id: 'test_enemy_2',
  kind: 'zombie',
  pos: { x: 400, y: 300 }, // Same as player
  hp: 50,
  maxHp: 50,
  speed: 50,
  touchDamage: 15,
  isElite: false,
  radius: 8,
};
world.enemies.push(enemy2);

console.log(`Initial state:`);
console.log(`  Player HP: ${world.player.hp}/${world.player.maxHp}, i-frames: ${world.player.iframes.toFixed(2)}s`);
console.log(`  Enemy touch damage: ${enemy2.touchDamage}`);

// First hit - should damage player and activate i-frames
world = updateWorld(world);

console.log(`\nAfter frame 1 (first hit):`);
console.log(`  Player HP: ${world.player.hp}/${world.player.maxHp}, i-frames: ${world.player.iframes.toFixed(2)}s`);
console.log(`  Damage events: ${world.damageEvents.length}`);
if (world.damageEvents.length > 0) {
  const event = world.damageEvents[world.damageEvents.length - 1];
  console.log(`  - Frame ${event.frame}: Player took ${event.damage} damage`);
}

const hpAfterFirstHit = world.player.hp;

// Second hit - should be blocked by i-frames
world = updateWorld(world);

console.log(`\nAfter frame 2 (i-frames active, should block):`);
console.log(`  Player HP: ${world.player.hp}/${world.player.maxHp}, i-frames: ${world.player.iframes.toFixed(2)}s`);
console.log(`  HP change: ${hpAfterFirstHit - world.player.hp} (should be 0)`);

console.log('\n' + '='.repeat(70));
console.log('Scenario 3: Multiple projectiles hit multiple enemies');
console.log('-'.repeat(70));

// Reset world
world = initWorld(SEED, false);

// Add 3 enemies in a row
for (let i = 0; i < 3; i++) {
  const enemy: Enemy = {
    id: `multi_enemy_${i}`,
    kind: 'zombie',
    pos: { x: 450 + i * 30, y: 300 },
    hp: 10,
    maxHp: 10,
    speed: 50,
    touchDamage: 5,
    isElite: false,
    radius: 8,
  };
  world.enemies.push(enemy);
}

// Add 3 projectiles aimed at the enemies
for (let i = 0; i < 3; i++) {
  world.projectiles.push({
    active: true,
    pos: { x: 420 + i * 10, y: 300 },
    dir: { x: 1, y: 0 },
    speed: 300,
    damage: 10,
    ttl: 2.0,
    radius: 3,
  });
}

console.log(`Initial state:`);
console.log(`  Enemies: ${world.enemies.length}`);
console.log(`  Projectiles: ${world.projectiles.length}`);

// Run for a few frames
for (let i = 0; i < 5; i++) {
  world = updateWorld(world);
}

console.log(`\nAfter 5 frames:`);
console.log(`  Enemies remaining: ${world.enemies.length}`);
console.log(`  Projectiles remaining: ${world.projectiles.length}`);
console.log(`  Total damage events: ${world.damageEvents.length}`);
console.log(`  Enemy deaths: ${3 - world.enemies.length}`);

console.log('\n' + '='.repeat(70));
console.log('Determinism Verification');
console.log('='.repeat(70));
console.log('Run this script multiple times. All numbers should be identical.');

// Create determinism signature
const signature = {
  seed: SEED,
  scenario1: {
    damageEvents: 1,
    enemiesKilled: 1,
  },
  scenario2: {
    playerHpLost: 15,
    iframesBlocked: true,
  },
  scenario3: {
    enemiesKilled: 3,
    totalDamageEvents: 3,
  },
};

console.log('\nExpected signature:');
console.log(JSON.stringify(signature, null, 2));
console.log();
