/**
 * S4: Enemy Spawner & Waves
 * Time-based weighted spawns with escalating density
 * Elites appear at specific thresholds
 */

import type { RNG } from '../core/rng';
import { nextFloat, pickWeighted } from '../core/rng';
import type { Enemy, Player } from '../types/game';
import { ARENA_WIDTH, ARENA_HEIGHT } from './player';

let nextEnemyId = 10000;

export interface EnemyDef {
  type: string;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  radius: number;
  knockbackResist: number;
}

export interface WaveConfig {
  minute: number;
  enemiesPerSecond: number;
  weights: Array<{ type: string; w: number }>;
}

// Enemy type definitions
export const ENEMY_DEFS: Record<string, EnemyDef> = {
  bat: {
    type: 'bat',
    hp: 10,
    speed: 120,
    damage: 5,
    xpValue: 1,
    radius: 12,
    knockbackResist: 0,
  },
  zombie: {
    type: 'zombie',
    hp: 25,
    speed: 60,
    damage: 10,
    xpValue: 2,
    radius: 16,
    knockbackResist: 0.3,
  },
  ghost: {
    type: 'ghost',
    hp: 15,
    speed: 100,
    damage: 8,
    xpValue: 2,
    radius: 14,
    knockbackResist: 0.5,
  },
  elite_bat: {
    type: 'elite_bat',
    hp: 50,
    speed: 150,
    damage: 15,
    xpValue: 10,
    radius: 20,
    knockbackResist: 0.5,
  },
  elite_zombie: {
    type: 'elite_zombie',
    hp: 100,
    speed: 80,
    damage: 25,
    xpValue: 15,
    radius: 24,
    knockbackResist: 0.7,
  },
};

// Wave configuration (escalating difficulty)
export const WAVE_TABLE: WaveConfig[] = [
  {
    minute: 0,
    enemiesPerSecond: 2,
    weights: [{ type: 'bat', w: 1 }],
  },
  {
    minute: 2,
    enemiesPerSecond: 3,
    weights: [
      { type: 'bat', w: 0.7 },
      { type: 'zombie', w: 0.3 },
    ],
  },
  {
    minute: 5,
    enemiesPerSecond: 5,
    weights: [
      { type: 'bat', w: 0.5 },
      { type: 'zombie', w: 0.3 },
      { type: 'ghost', w: 0.2 },
    ],
  },
  {
    minute: 8,
    enemiesPerSecond: 7,
    weights: [
      { type: 'bat', w: 0.4 },
      { type: 'zombie', w: 0.3 },
      { type: 'ghost', w: 0.2 },
      { type: 'elite_bat', w: 0.1 },
    ],
  },
  {
    minute: 12,
    enemiesPerSecond: 10,
    weights: [
      { type: 'bat', w: 0.3 },
      { type: 'zombie', w: 0.3 },
      { type: 'ghost', w: 0.2 },
      { type: 'elite_bat', w: 0.1 },
      { type: 'elite_zombie', w: 0.1 },
    ],
  },
  {
    minute: 18,
    enemiesPerSecond: 15,
    weights: [
      { type: 'bat', w: 0.2 },
      { type: 'zombie', w: 0.3 },
      { type: 'ghost', w: 0.2 },
      { type: 'elite_bat', w: 0.15 },
      { type: 'elite_zombie', w: 0.15 },
    ],
  },
];

/**
 * Get wave config for current minute
 */
function getWaveConfig(minute: number): WaveConfig {
  let config = WAVE_TABLE[0];

  for (const wave of WAVE_TABLE) {
    if (minute >= wave.minute) {
      config = wave;
    } else {
      break;
    }
  }

  return config;
}

/**
 * Spawn state (accumulator for fractional spawns)
 */
export interface SpawnState {
  accumulator: number;
}

export function createSpawnState(): SpawnState {
  return { accumulator: 0 };
}

/**
 * Step spawner - spawn enemies based on time and wave config
 */
export function stepSpawns(
  dt: number,
  rng: RNG,
  gameTime: number,
  player: Player,
  state: SpawnState
): { enemies: Enemy[]; rng: RNG } {
  const minute = Math.floor(gameTime / 60);
  const config = getWaveConfig(minute);

  // Add to accumulator
  state.accumulator += config.enemiesPerSecond * dt;

  const enemies: Enemy[] = [];
  let currentRng = rng;

  // Spawn whole enemies
  const maxPerFrame = 20; // Cap spawns per frame
  let spawned = 0;

  while (state.accumulator >= 1 && spawned < maxPerFrame) {
    state.accumulator -= 1;
    spawned += 1;

    // Pick enemy type
    const weightTable = config.weights.map((w) => ({ item: w.type, w: w.w }));
    const [type, r2] = pickWeighted(currentRng, weightTable);
    currentRng = r2;

    // Spawn position (outside arena, close to player)
    const [spawnResult, r3] = spawnPosition(currentRng, player);
    currentRng = r3;

    const def = ENEMY_DEFS[type];
    const enemy = createEnemy(def, spawnResult.x, spawnResult.y, minute);
    enemies.push(enemy);
  }

  return { enemies, rng: currentRng };
}

/**
 * Create enemy from definition
 */
function createEnemy(
  def: EnemyDef,
  x: number,
  y: number,
  minute: number
): Enemy {
  // Scale stats based on minute
  const hpScale = 1 + minute * 0.1;
  const damageScale = 1 + minute * 0.08;

  return {
    id: nextEnemyId++,
    type: 'enemy',
    x,
    y,
    vx: 0,
    vy: 0,
    hp: def.hp * hpScale,
    maxHp: def.hp * hpScale,
    radius: def.radius,
    speed: def.speed,
    damage: def.damage * damageScale,
    xpValue: def.xpValue,
    enemyType: def.type,
    knockbackResist: def.knockbackResist,
  };
}

/**
 * Pick spawn position outside arena, near player
 */
function spawnPosition(
  rng: RNG,
  player: Player
): readonly [{ x: number; y: number }, RNG] {
  const [side, r1] = nextFloat(rng);
  const [offset, r2] = nextFloat(r1);

  const margin = 100;
  let x = 0;
  let y = 0;

  if (side < 0.25) {
    // Top
    x = player.x + (offset - 0.5) * 800;
    y = -margin;
  } else if (side < 0.5) {
    // Right
    x = ARENA_WIDTH + margin;
    y = player.y + (offset - 0.5) * 800;
  } else if (side < 0.75) {
    // Bottom
    x = player.x + (offset - 0.5) * 800;
    y = ARENA_HEIGHT + margin;
  } else {
    // Left
    x = -margin;
    y = player.y + (offset - 0.5) * 800;
  }

  // Clamp to reasonable range
  x = Math.max(-margin, Math.min(ARENA_WIDTH + margin, x));
  y = Math.max(-margin, Math.min(ARENA_HEIGHT + margin, y));

  return [{ x, y }, r2] as const;
}

/**
 * Update enemy movement - chase player
 */
export function stepEnemies(dt: number, enemies: Enemy[], player: Player): void {
  for (const enemy of enemies) {
    // Calculate direction to player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      // Normalize and apply speed
      enemy.vx = (dx / dist) * enemy.speed;
      enemy.vy = (dy / dist) * enemy.speed;

      // Update position
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
    }
  }
}
