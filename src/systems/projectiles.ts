/**
 * Projectiles system - handles projectile movement and lifecycle
 *
 * Key features:
 * - Move projectiles based on direction and speed
 * - Decrement TTL (time-to-live)
 * - Return expired projectiles to pool
 * - In-place updates for performance
 */

import type { Projectile, Pool } from '../types';

/**
 * Update all active projectiles.
 * Moves them, decrements TTL, and returns expired ones to pool.
 *
 * @param dt - Delta time in seconds
 * @param projectiles - Array of active projectiles (modified in-place)
 * @param pool - Pool to return expired projectiles to
 */
export function stepProjectiles(
  dt: number,
  projectiles: Projectile[],
  pool: Pool<Projectile>
): void {
  // Iterate backwards so we can remove items safely
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];

    if (!proj.active) {
      // Inactive projectile, remove and skip
      projectiles.splice(i, 1);
      continue;
    }

    // Update position based on velocity
    proj.pos.x += proj.dir.x * proj.speed * dt;
    proj.pos.y += proj.dir.y * proj.speed * dt;

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
