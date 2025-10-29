/**
 * Weapons system - handles weapon cooldowns and projectile spawning
 *
 * Key features:
 * - Cooldown accumulator pattern (no setTimeout)
 * - Deterministic projectile spawning via RNG
 * - Multi-projectile volleys with spread
 */

import type { Weapon, Projectile, RNG, Pool, Vec2 } from '../types';
import { nextRange } from '../core/rng';
import { playSound } from '../core/audio';

export interface WeaponStepResult {
  newProjectiles: Projectile[];
  rng: RNG;
}

/**
 * Update all weapons, fire when ready, and return spawned projectiles.
 *
 * @param dt - Delta time in seconds
 * @param weapons - Array of weapons to update
 * @param rng - Current RNG state
 * @param pool - Projectile pool
 * @param ownerPos - Position to spawn projectiles from
 * @param targetDir - Base direction to fire (normalized)
 * @returns New projectiles and updated RNG
 */
export function stepWeapons(
  dt: number,
  weapons: Weapon[],
  rng: RNG,
  pool: Pool<Projectile>,
  ownerPos: Vec2,
  targetDir: Vec2
): WeaponStepResult {
  let currentRng = rng;
  const newProjectiles: Projectile[] = [];

  for (const weapon of weapons) {
    // Update cooldown timer
    weapon.cooldownTimer -= dt;

    // Fire if ready
    if (weapon.cooldownTimer <= 0) {
      // Reset cooldown
      weapon.cooldownTimer = weapon.cooldown;

      // Spawn projectiles
      const [projectiles, nextRng] = fireWeapon(
        weapon,
        currentRng,
        pool,
        ownerPos,
        targetDir
      );
      currentRng = nextRng;
      newProjectiles.push(...projectiles);

      // Play shoot sound
      if (projectiles.length > 0) {
        playSound('shoot', 0.2);
      }
    }
  }

  return {
    newProjectiles,
    rng: currentRng,
  };
}

/**
 * Fire a single weapon, creating projectiles with spread.
 *
 * @param weapon - Weapon to fire
 * @param rng - Current RNG state
 * @param pool - Projectile pool
 * @param pos - Spawn position
 * @param baseDir - Base direction (normalized)
 * @returns Array of spawned projectiles and updated RNG
 */
function fireWeapon(
  weapon: Weapon,
  rng: RNG,
  pool: Pool<Projectile>,
  pos: Vec2,
  baseDir: Vec2
): [Projectile[], RNG] {
  let currentRng = rng;
  const projectiles: Projectile[] = [];
  const count = weapon.projectileCount;
  const spread = weapon.spreadAngle;

  for (let i = 0; i < count; i++) {
    const projectile = pool.take();
    if (!projectile) {
      // Pool exhausted, skip
      continue;
    }

    // Calculate spread angle
    let angle: number;
    if (count === 1) {
      // Single projectile - no spread
      angle = 0;
    } else {
      // Multiple projectiles - distribute evenly or randomly
      if (spread === 0) {
        angle = 0;
      } else {
        // Random angle within spread
        const [angleOffset, nextRng] = nextRange(
          currentRng,
          -spread / 2,
          spread / 2
        );
        currentRng = nextRng;
        angle = angleOffset;
      }
    }

    // Convert angle to radians and apply to base direction
    const angleRad = (angle * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    // Rotate base direction by angle
    const dir: Vec2 = {
      x: baseDir.x * cosA - baseDir.y * sinA,
      y: baseDir.x * sinA + baseDir.y * cosA,
    };

    // Normalize direction (should already be normalized, but ensure it)
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    if (len > 0) {
      dir.x /= len;
      dir.y /= len;
    }

    // Initialize projectile
    projectile.active = true;
    projectile.pos = { ...pos };
    projectile.dir = dir;
    projectile.speed = weapon.projectileSpeed;
    projectile.damage = weapon.damage;
    projectile.ttl = weapon.ttl;
    projectile.ownerId = weapon.id;
    projectile.radius = 3; // Collision radius

    projectiles.push(projectile);
  }

  return [projectiles, currentRng];
}

/**
 * Create a default weapon configuration.
 *
 * @param id - Unique weapon ID
 * @param overrides - Optional property overrides
 * @returns Weapon instance
 */
export function createWeapon(
  id: string,
  overrides?: Partial<Omit<Weapon, 'id'>>
): Weapon {
  return {
    id,
    type: 'basic',
    damage: 10,
    cooldown: 0.5,
    cooldownTimer: 0, // Ready to fire immediately
    projectileSpeed: 300,
    projectileCount: 1,
    spreadAngle: 0,
    ttl: 2.0,
    ...overrides,
  };
}
