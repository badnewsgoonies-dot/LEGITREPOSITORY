/**
 * Power-up System - temporary item pickups
 *
 * Features:
 * - Spawn items randomly or from enemy kills
 * - Pickup on collision with player
 * - Temporary buffs and instant effects
 */

import type { RNG, Vec2, WorldState } from '../types';
import { nextRange, chance } from '../core/rng';
import { playSound } from '../core/audio';
import { spawnParticleBurst } from '../systems/particles';
import { addTrauma } from '../core/screenshake';

export type PowerUpType = 'heal' | 'screen_clear' | 'flamethrower';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  pos: Vec2;
  radius: number;
  lifetime: number; // seconds before despawn
}

let powerUpIdCounter = 0;

// Constants
const POWERUP_RADIUS = 8;
const POWERUP_LIFETIME = 15; // 15 seconds before despawn
const POWERUP_SPAWN_CHANCE = 0.05; // 5% chance per elite kill
const SCREEN_CLEAR_DAMAGE = 999; // Instant kill damage
const HEAL_AMOUNT = 50; // HP restored
const FLAMETHROWER_DURATION = 10; // seconds

/**
 * Spawn a power-up at a position
 */
export function spawnPowerUp(
  rng: RNG,
  pos: Vec2,
  type?: PowerUpType
): [PowerUp, RNG] {
  let currentRng = rng;

  // If no type specified, randomly choose one
  let powerUpType: PowerUpType;
  if (type) {
    powerUpType = type;
  } else {
    const [roll, nextRng] = nextRange(currentRng, 0, 3);
    currentRng = nextRng;

    if (roll < 1) {
      powerUpType = 'heal';
    } else if (roll < 2) {
      powerUpType = 'screen_clear';
    } else {
      powerUpType = 'flamethrower';
    }
  }

  const powerUp: PowerUp = {
    id: `powerup_${powerUpIdCounter++}`,
    type: powerUpType,
    pos: { x: pos.x, y: pos.y },
    radius: POWERUP_RADIUS,
    lifetime: POWERUP_LIFETIME,
  };

  return [powerUp, currentRng];
}

/**
 * Check for power-up spawns from elite kills
 */
export function checkPowerUpSpawns(
  world: WorldState,
  killedEnemies: Array<{ pos: Vec2; isElite: boolean }>
): RNG {
  let currentRng = world.rng;

  for (const enemy of killedEnemies) {
    // Only elite enemies can drop power-ups
    if (!enemy.isElite) continue;

    // Chance to spawn power-up
    const [shouldSpawn, nextRng] = chance(currentRng, POWERUP_SPAWN_CHANCE);
    currentRng = nextRng;

    if (shouldSpawn) {
      const [powerUp, rng2] = spawnPowerUp(currentRng, enemy.pos);
      currentRng = rng2;
      world.powerUps.push(powerUp);
    }
  }

  return currentRng;
}

/**
 * Update power-ups (lifetime decay)
 */
export function stepPowerUps(powerUps: PowerUp[], dt: number): void {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.lifetime -= dt;

    if (powerUp.lifetime <= 0) {
      // Despawn
      powerUps.splice(i, 1);
    }
  }
}

/**
 * Check for power-up collection and apply effects
 */
export function collectPowerUps(world: WorldState): void {
  const playerPos = world.player.pos;
  const playerRadius = world.player.radius;

  for (let i = world.powerUps.length - 1; i >= 0; i--) {
    const powerUp = world.powerUps[i];

    // Check collision with player
    const dx = playerPos.x - powerUp.pos.x;
    const dy = playerPos.y - powerUp.pos.y;
    const distSq = dx * dx + dy * dy;
    const radiusSumSq = (playerRadius + powerUp.radius) * (playerRadius + powerUp.radius);

    if (distSq < radiusSumSq) {
      // Apply power-up effect
      applyPowerUpEffect(world, powerUp);

      // Remove power-up
      world.powerUps.splice(i, 1);
    }
  }
}

/**
 * Apply power-up effect to world
 */
function applyPowerUpEffect(world: WorldState, powerUp: PowerUp): void {
  switch (powerUp.type) {
    case 'heal':
      applyHeal(world);
      break;
    case 'screen_clear':
      applyScreenClear(world);
      break;
    case 'flamethrower':
      applyFlamethrower(world);
      break;
  }

  // Visual/audio feedback
  spawnParticleBurst(world.particlesPool, 'levelup', powerUp.pos, 15);
  playSound('levelup', 0.8);
}

/**
 * Heal effect - restore HP
 */
function applyHeal(world: WorldState): void {
  const oldHP = world.player.hp;
  world.player.hp = Math.min(world.player.maxHp, world.player.hp + HEAL_AMOUNT);

  const healed = world.player.hp - oldHP;
  console.log(`Healed ${healed} HP!`);

  // Spawn heal particles around player
  spawnParticleBurst(world.particlesPool, 'pickup', world.player.pos, 20);
}

/**
 * Screen clear effect - damage all enemies on screen
 */
function applyScreenClear(world: WorldState): void {
  const killedCount = world.enemies.length;

  // Damage all enemies
  for (const enemy of world.enemies) {
    enemy.hp -= SCREEN_CLEAR_DAMAGE;

    // Spawn death particles
    spawnParticleBurst(world.particlesPool, 'death', enemy.pos, 8);
  }

  console.log(`Screen clear! Killed ${killedCount} enemies!`);

  // Big screen shake
  addTrauma(world.screenShake, 0.8);
  playSound('boss', 1.0);
}

/**
 * Flamethrower effect - temporary weapon upgrade
 */
function applyFlamethrower(world: WorldState): void {
  // Add flamethrower buff
  world.flamethrowerTime = FLAMETHROWER_DURATION;

  console.log(`Flamethrower activated for ${FLAMETHROWER_DURATION} seconds!`);
}

/**
 * Update flamethrower timer
 */
export function updateFlamethrower(world: WorldState, dt: number): void {
  if (world.flamethrowerTime > 0) {
    world.flamethrowerTime -= dt;

    if (world.flamethrowerTime <= 0) {
      world.flamethrowerTime = 0;
      console.log('Flamethrower ended');
    }
  }
}

/**
 * Check if flamethrower is active
 */
export function hasFlamethrower(world: WorldState): boolean {
  return world.flamethrowerTime > 0;
}
