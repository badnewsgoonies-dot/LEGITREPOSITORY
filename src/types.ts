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

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
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
  radius: number; // collision radius
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
  radius: number; // collision radius
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
// Player Types
// ============================================================================

export interface Player {
  pos: Vec2;
  hp: number;
  maxHp: number;
  iframes: number; // invincibility frames remaining (seconds)
  iframeDuration: number; // total iframe duration after hit
  radius: number; // collision radius
  xp: number; // current XP
  level: number; // current level
  xpToNext: number; // XP needed for next level
}

// ============================================================================
// Collision Types
// ============================================================================

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export type ContactType =
  | 'projectile-enemy'
  | 'enemy-player'
  | 'projectile-projectile';

export interface Contact {
  type: ContactType;
  entityA: string; // ID of first entity
  entityB: string; // ID of second entity
  damage?: number; // damage to apply
  knockback?: Vec2; // knockback vector
}

export interface DamageEvent {
  frame: number;
  targetId: string;
  damage: number;
  source: 'projectile' | 'enemy' | 'hazard';
}

// ============================================================================
// XP & Upgrade Types
// ============================================================================

export interface XPGem {
  id: string;
  pos: Vec2;
  value: number; // XP value
  radius: number; // collision radius
  magnetRange: number; // range at which gem starts moving toward player
}

export type UpgradeType =
  | 'weapon_damage'
  | 'weapon_cooldown'
  | 'weapon_count'
  | 'player_speed'
  | 'player_hp'
  | 'player_regen'
  | 'xp_magnet'
  | 'new_weapon'
  | 'armor'
  | 'projectile_speed'
  | 'projectile_size'
  | 'crit_chance'
  | 'pierce'
  | 'lifesteal'
  | 'area_damage'
  | 'luck';

export interface Upgrade {
  id: string;
  type: UpgradeType;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic';
  value: number; // amount to add/multiply
  maxLevel: number; // max times this can be picked
  currentLevel: number; // times already picked
}

export interface DraftChoice {
  upgrades: Upgrade[]; // 3 upgrades to choose from
  rerollsAvailable: number;
  banishesAvailable: number;
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
// Game State
// ============================================================================

export type GameState = 'playing' | 'paused' | 'game_over' | 'victory';

export interface GameStats {
  enemiesKilled: number;
  damageDealt: number;
  damageTaken: number;
  xpCollected: number;
  timeSurvived: number;
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
  gameState: GameState; // playing, paused, game_over, victory
  stats: GameStats; // game statistics
  weapons: Weapon[];
  projectiles: Projectile[];
  projectilesPool: Pool<Projectile>;
  enemies: Enemy[];
  spawnAccumulator: number; // accumulates spawn time
  player: Player;
  damageEvents: DamageEvent[]; // for replay/logging
  xpGems: XPGem[]; // XP pickups in world
  upgrades: Upgrade[]; // currently applied upgrades
  upgradePool: Upgrade[]; // available upgrades for drafting
  draftChoice: DraftChoice | null; // current draft (null if not leveling up)
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
