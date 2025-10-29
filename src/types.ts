/**
 * Core type definitions for Nightfall Survivors
 */

import type { RandomGenerator } from 'pure-rand';

// ============================================================================
// Math & Geometry Types
// ============================================================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Weapons & Projectiles Types
// ============================================================================

export interface Weapon {
  id: string;
  type: string;
  damage: number;
  cooldown: number; // seconds between shots
  cooldownTimer: number; // accumulator, fires when ≤ 0
  projectileSpeed: number;
  projectileCount: number; // projectiles per shot
  spreadAngle: number; // degrees
  ttl: number; // projectile time-to-live in seconds
}

export interface Projectile {
  active: boolean;
  pos: Vec2;
  dir: Vec2; // normalized direction vector
  speed: number;
  damage: number;
  ttl: number; // time remaining in seconds
  ownerId?: string; // for collision filtering
}

export interface Pool<T> {
  take: () => T | null;
  put: (item: T) => void;
  size: () => number;
  available: () => number;
}

// ============================================================================
// Enemy Types
// ============================================================================

export type EnemyKind = 'zombie' | 'fast' | 'tank' | 'swarm';

export interface Enemy {
  id: string;
  kind: EnemyKind;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  touchDamage: number;
  isElite: boolean;
}

export interface WaveConfig {
  minute: number;
  spawnRate: number; // enemies per second
  enemies: {
    kind: EnemyKind;
    weight: number; // relative probability
    hp: number;
    speed: number;
    touchDamage: number;
  }[];
  eliteChance: number; // 0.0 to 1.0
}

// ============================================================================
// RNG Types
// ============================================================================

/**
 * Deterministic RNG state wrapper.
 * Pure-rand's RandomGenerator is immutable - operations return new state.
 */
export interface RNG {
  generator: RandomGenerator;
}

// ============================================================================
// Replay & Event Types
// ============================================================================

export type GameEvent =
  | { type: 'input'; frame: number; action: string; data?: unknown }
  | { type: 'spawn'; frame: number; entityId: string; position: Vec2 }
  | { type: 'damage'; frame: number; entityId: string; amount: number }
  | { type: 'custom'; frame: number; name: string; data?: unknown };

export interface RunLog {
  seed: number;
  events: GameEvent[];
  finalHash: string;
  frameCount: number;
  timestamp: number;
}

// ============================================================================
// World State
// ============================================================================

export interface WorldState {
  seed: number;
  time: number; // accumulated time in seconds
  dt: number; // fixed timestep in seconds
  frameCount: number;
  rng: RNG;
  isPaused: boolean;
  weapons: Weapon[];
  projectiles: Projectile[];
  projectilesPool: Pool<Projectile>;
  enemies: Enemy[];
  spawnAccumulator: number; // accumulates spawn time
  playerPos: Vec2; // for spawn positioning
}

// ============================================================================
// Game Loop Types
// ============================================================================

export interface GameLoopConfig {
  targetFPS?: number; // default 60
  maxFrameDelta?: number; // max delta clamp in ms, default 50
  onUpdate: (state: WorldState) => WorldState;
  onRender?: (state: WorldState, alpha: number) => void;
}

export interface GameLoopHandle {
  stop: () => void;
  getState: () => WorldState;
  pause: () => void;
  resume: () => void;
}
