/**
 * Projectiles system - handles projectile movement and lifecycle
 *
 * Key features:
 * - Move projectiles based on direction and speed
 * - Support for multiple behaviors: projectile, boomerang, orbit
 * - Decrement TTL (time-to-live)
 * - Return expired projectiles to pool
 * - In-place updates for performance
 */

import type { Projectile, Pool, Vec2 } from '../types';

/**
 * Update all active projectiles.
 * Moves them, decrements TTL, and returns expired ones to pool.
 * Handles different weapon behaviors.
 *
 * @param dt - Delta time in seconds
 * @param projectiles - Array of active projectiles (modified in-place)
 * @param pool - Pool to return expired projectiles to
 * @param playerPos - Player position (for orbit behavior)
 */
export function stepProjectiles(
  dt: number,
  projectiles: Projectile[],
  pool: Pool<Projectile>,
  playerPos?: Vec2
): void {
  // Iterate backwards so we can remove items safely
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];

    if (!proj.active) {
      // Inactive projectile, remove and skip
      projectiles.splice(i, 1);
      continue;
    }

    // Update based on behavior
    if (proj.behavior === 'boomerang') {
      updateBoomerang(proj, dt);
    } else if (proj.behavior === 'orbit' && playerPos) {
      updateOrbit(proj, dt, playerPos);
    } else {
      // Default projectile behavior
      proj.pos.x += proj.dir.x * proj.speed * dt;
      proj.pos.y += proj.dir.y * proj.speed * dt;
    }

    // Decrement TTL
    proj.ttl -= dt;

    // Check if expired
    if (proj.ttl <= 0) {
      proj.active = false;
      pool.put(proj);
      projectiles.splice(i, 1);
    }
  }
}

/**
 * Update boomerang projectile behavior
 * Flies out, then returns to origin point
 */
function updateBoomerang(proj: Projectile, dt: number): void {
  if (!proj.returnTarget) return;

  const maxTTL = (proj.ttl + dt) / 0.5; // Estimate max TTL

  // Check if we should start returning
  if (!proj.isReturning && proj.ttl < maxTTL / 2) {
    proj.isReturning = true;
  }

  if (proj.isReturning) {
    // Move toward return target
    const dx = proj.returnTarget.x - proj.pos.x;
    const dy = proj.returnTarget.y - proj.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      proj.dir.x = dx / dist;
      proj.dir.y = dy / dist;
    }
  }

  // Move projectile
  proj.pos.x += proj.dir.x * proj.speed * dt;
  proj.pos.y += proj.dir.y * proj.speed * dt;
}

/**
 * Update orbit projectile behavior
 * Orbits around player position
 */
function updateOrbit(proj: Projectile, dt: number, playerPos: Vec2): void {
  if (proj.orbitAngle === undefined) proj.orbitAngle = 0;
  if (!proj.orbitCenter) proj.orbitCenter = { ...playerPos };

  // Update orbit center to follow player
  proj.orbitCenter.x = playerPos.x;
  proj.orbitCenter.y = playerPos.y;

  // Update orbit angle
  const orbitSpeed = proj.speed / 100; // Radians per second
  proj.orbitAngle += orbitSpeed * dt;

  // Calculate orbit position
  const radius = 70; // Orbit radius
  proj.pos.x = proj.orbitCenter.x + Math.cos(proj.orbitAngle) * radius;
  proj.pos.y = proj.orbitCenter.y + Math.sin(proj.orbitAngle) * radius;
}

/**
 * Create a projectile factory for pool initialization.
 * @returns Factory function that creates inactive projectiles
 */
export function createProjectileFactory(): () => Projectile {
  return () => ({
    active: false,
    pos: { x: 0, y: 0 },
    dir: { x: 1, y: 0 },
    speed: 0,
    damage: 0,
    ttl: 0,
    radius: 3, // Default collision radius
  });
}

/**
 * Count active projectiles.
 * @param projectiles - Array of projectiles
 * @returns Number of active projectiles
 */
export function countActiveProjectiles(projectiles: Projectile[]): number {
  return projectiles.filter((p) => p.active).length;
}

/**
 * Clear all projectiles and return them to pool.
 * @param projectiles - Array of projectiles (modified in-place)
 * @param pool - Pool to return projectiles to
 */
export function clearProjectiles(
  projectiles: Projectile[],
  pool: Pool<Projectile>
): void {
  for (const proj of projectiles) {
    if (proj.active) {
      proj.active = false;
      pool.put(proj);
    }
  }
  projectiles.length = 0; // Clear array
}
