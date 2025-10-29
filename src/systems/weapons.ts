/**
 * S3: Weapons & Projectiles
 * Auto-fire weapons with cooldowns
 * Projectiles with TTL, piercing, behaviors
 */

import type { RNG } from '../core/rng';
import { nextFloat } from '../core/rng';
import type { Player, Projectile, Weapon, Enemy } from '../types/game';

let nextProjectileId = 1000;

/**
 * Object pool for projectiles
 */
export function makePool<T>(factory: () => T, size = 512) {
  const free: T[] = Array.from({ length: size }, factory);
  const used: T[] = [];

  return {
    take: (): T => {
      const item = free.pop();
      if (item) {
        used.push(item);
        return item;
      }
      const newItem = factory();
      used.push(newItem);
      return newItem;
    },
    put: (o: T): void => {
      const idx = used.indexOf(o);
      if (idx >= 0) {
        used.splice(idx, 1);
        free.push(o);
      }
    },
    stats: () => ({ free: free.length, used: used.length }),
  };
}

// Global projectile pool
const projectilePool = makePool<Projectile>(
  () => ({
    id: nextProjectileId++,
    type: 'projectile',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 1,
    maxHp: 1,
    radius: 8,
    damage: 0,
    ttl: 0,
    piercing: 0,
    hitIds: new Set(),
    weaponId: '',
  }),
  1024
);

/**
 * Step all weapons - update cooldowns and fire when ready
 */
export function stepWeapons(
  dt: number,
  rng: RNG,
  player: Player,
  _enemies: Enemy[]
): { projectiles: Projectile[]; rng: RNG } {
  const newProjectiles: Projectile[] = [];
  let currentRng = rng;

  for (const weapon of player.weapons) {
    // Update cooldown
    weapon.currentCd = Math.max(0, weapon.currentCd - dt);

    // Fire if ready
    if (weapon.currentCd <= 0) {
      const baseCd = weapon.cooldown;
      const cdReduction = player.stats.cooldown;
      const effectiveCd = baseCd / (1 + cdReduction);

      weapon.currentCd += effectiveCd;

      // Spawn projectiles based on weapon behavior
      if (weapon.behavior.type === 'projectile') {
        const result = fireProjectileWeapon(
          currentRng,
          player,
          weapon,
          weapon.behavior
        );
        newProjectiles.push(...result.projectiles);
        currentRng = result.rng;
      }
    }
  }

  return { projectiles: newProjectiles, rng: currentRng };
}

/**
 * Fire projectile weapon (volley with spread)
 */
function fireProjectileWeapon(
  rng: RNG,
  player: Player,
  weapon: Weapon,
  behavior: Extract<Weapon['behavior'], { type: 'projectile' }>
): { projectiles: Projectile[]; rng: RNG } {
  const projectiles: Projectile[] = [];
  let currentRng = rng;

  const count = behavior.count;
  const spread = behavior.spread; // radians

  for (let i = 0; i < count; i++) {
    // Calculate angle with spread
    const baseAngle = Math.atan2(player.facing.y, player.facing.x);
    let angle = baseAngle;

    if (count > 1) {
      // Distribute evenly within spread
      const step = spread / (count - 1);
      angle = baseAngle - spread / 2 + step * i;
    } else if (spread > 0) {
      // Single shot with random spread
      const [rand, r2] = nextFloat(currentRng);
      currentRng = r2;
      angle = baseAngle + (rand - 0.5) * spread;
    }

    // Create projectile from pool
    const proj = projectilePool.take();
    proj.id = nextProjectileId++;
    proj.x = player.x;
    proj.y = player.y;
    proj.vx = Math.cos(angle) * behavior.speed;
    proj.vy = Math.sin(angle) * behavior.speed;
    proj.damage = weapon.damage * player.stats.might;
    proj.ttl = behavior.ttl * player.stats.duration;
    proj.piercing = behavior.piercing;
    proj.hitIds.clear();
    proj.weaponId = weapon.id;
    proj.radius = 8 * Math.sqrt(player.stats.area);

    projectiles.push(proj);
  }

  return { projectiles, rng: currentRng };
}

/**
 * Step all projectiles - update position, decrease TTL, remove expired
 */
export function stepProjectiles(
  dt: number,
  projectiles: Projectile[]
): Projectile[] {
  const active: Projectile[] = [];

  for (const proj of projectiles) {
    // Update position
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

    // Update TTL
    proj.ttl -= dt;

    // Keep if still alive
    if (proj.ttl > 0) {
      active.push(proj);
    } else {
      // Return to pool
      projectilePool.put(proj);
    }
  }

  return active;
}

/**
 * Remove projectile (e.g., after hitting max piercing)
 */
export function removeProjectile(projectile: Projectile): void {
  projectile.ttl = 0;
  projectilePool.put(projectile);
}
