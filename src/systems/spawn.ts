/**
 * Enemy spawn system with deterministic wave progression
 *
 * Features:
 * - Deterministic spawning based on seed and minute
 * - Weighted enemy type selection
 * - Elite enemy chance
 * - Spawns at ring around player (safe radius)
 * - Per-frame spawn cap to prevent spikes
 */

import type { Enemy, RNG, Vec2 } from '../types';
import { nextRange, chance } from '../core/rng';
import { getWaveConfig, ELITE_MULTIPLIERS } from '../waves/table';

export interface SpawnResult {
  newEnemies: Enemy[];
  rng: RNG;
}

// Constants
const SPAWN_RADIUS_MIN = 400; // Minimum distance from player
const SPAWN_RADIUS_MAX = 500; // Maximum distance from player
const MAX_SPAWNS_PER_FRAME = 12; // Cap to prevent spikes

let enemyIdCounter = 0;

/**
 * Update spawn system and create new enemies.
 *
 * @param dt - Delta time in seconds
 * @param spawnAccumulator - Current spawn time accumulator
 * @param rng - Current RNG state
 * @param minute - Current game minute (for wave progression)
 * @param playerPos - Player position (for spawn positioning)
 * @returns New enemies and updated RNG
 */
export function stepSpawns(
  dt: number,
  spawnAccumulator: number,
  rng: RNG,
  minute: number,
  playerPos: Vec2
): { newEnemies: Enemy[]; newAccumulator: number; rng: RNG } {
  let currentRng = rng;
  const newEnemies: Enemy[] = [];

  // Get wave config for current minute
  const waveConfig = getWaveConfig(minute);

  // Accumulate spawn time
  let accumulator = spawnAccumulator + dt;

  // Calculate spawn interval (time between spawns)
  const spawnInterval = 1.0 / waveConfig.spawnRate;

  // Spawn enemies while accumulator allows
  let spawnsThisFrame = 0;
  while (accumulator >= spawnInterval && spawnsThisFrame < MAX_SPAWNS_PER_FRAME) {
    accumulator -= spawnInterval;

    // Select enemy type based on weights
    const [enemyType, rng1] = selectEnemyType(currentRng, waveConfig);
    currentRng = rng1;

    // Check if elite
    const [isElite, rng2] = chance(currentRng, waveConfig.eliteChance);
    currentRng = rng2;

    // Spawn enemy
    const [enemy, rng3] = spawnEnemy(currentRng, enemyType, isElite, playerPos);
    currentRng = rng3;

    newEnemies.push(enemy);
    spawnsThisFrame++;
  }

  return {
    newEnemies,
    newAccumulator: accumulator,
    rng: currentRng,
  };
}

/**
 * Select enemy type based on weighted probabilities.
 *
 * @param rng - Current RNG state
 * @param waveConfig - Wave configuration
 * @returns [enemyConfig, newRng]
 */
function selectEnemyType(
  rng: RNG,
  waveConfig: ReturnType<typeof getWaveConfig>
): [
  (typeof waveConfig.enemies)[number],
  RNG
] {
  // Calculate total weight
  const totalWeight = waveConfig.enemies.reduce((sum, e) => sum + e.weight, 0);

  // Random value in [0, totalWeight)
  const [roll, newRng] = nextRange(rng, 0, totalWeight);

  // Select enemy based on weight
  let accumulated = 0;
  for (const enemy of waveConfig.enemies) {
    accumulated += enemy.weight;
    if (roll < accumulated) {
      return [enemy, newRng];
    }
  }

  // Fallback (shouldn't happen)
  return [waveConfig.enemies[0], newRng];
}

/**
 * Spawn a single enemy at a random position around the player.
 *
 * @param rng - Current RNG state
 * @param enemyConfig - Enemy configuration from wave table
 * @param isElite - Whether this is an elite enemy
 * @param playerPos - Player position
 * @returns [enemy, newRng]
 */
function spawnEnemy(
  rng: RNG,
  enemyConfig: {
    kind: Enemy['kind'];
    hp: number;
    speed: number;
    touchDamage: number;
  },
  isElite: boolean,
  playerPos: Vec2
): [Enemy, RNG] {
  let currentRng = rng;

  // Random angle around player
  const [angle, rng1] = nextRange(currentRng, 0, Math.PI * 2);
  currentRng = rng1;

  // Random radius between min and max
  const [radius, rng2] = nextRange(currentRng, SPAWN_RADIUS_MIN, SPAWN_RADIUS_MAX);
  currentRng = rng2;

  // Calculate spawn position
  const pos: Vec2 = {
    x: playerPos.x + Math.cos(angle) * radius,
    y: playerPos.y + Math.sin(angle) * radius,
  };

  // Apply elite multipliers
  const hp = isElite
    ? Math.floor(enemyConfig.hp * ELITE_MULTIPLIERS.hp)
    : enemyConfig.hp;
  const speed = isElite
    ? enemyConfig.speed * ELITE_MULTIPLIERS.speed
    : enemyConfig.speed;
  const touchDamage = isElite
    ? Math.floor(enemyConfig.touchDamage * ELITE_MULTIPLIERS.touchDamage)
    : enemyConfig.touchDamage;

  // Determine collision radius based on enemy kind
  let collisionRadius: number;
  switch (enemyConfig.kind) {
    case 'zombie':
      collisionRadius = 8;
      break;
    case 'fast':
      collisionRadius = 6;
      break;
    case 'tank':
      collisionRadius = 10;
      break;
    case 'swarm':
      collisionRadius = 4;
      break;
    default:
      collisionRadius = 8; // Default fallback
  }

  const enemy: Enemy = {
    id: `enemy_${enemyIdCounter++}`,
    kind: enemyConfig.kind,
    pos,
    hp,
    maxHp: hp,
    speed,
    touchDamage,
    isElite,
    radius: collisionRadius,
  };

  return [enemy, currentRng];
}

/**
 * Get current minute from elapsed time.
 *
 * @param time - Elapsed time in seconds
 * @returns Current minute (floor)
 */
export function getMinute(time: number): number {
  return Math.floor(time / 60);
}

/**
 * Reset enemy ID counter (for testing).
 */
export function resetEnemyIdCounter(): void {
  enemyIdCounter = 0;
}

/**
 * Check if position is within safe spawn radius.
 *
 * @param pos - Position to check
 * @param playerPos - Player position
 * @returns true if position is outside safe radius
 */
export function isValidSpawnPosition(pos: Vec2, playerPos: Vec2): boolean {
  const dx = pos.x - playerPos.x;
  const dy = pos.y - playerPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance >= SPAWN_RADIUS_MIN;
}
