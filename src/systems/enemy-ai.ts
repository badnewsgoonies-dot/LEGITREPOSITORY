/**
 * Enemy AI System - handles enemy behaviors
 *
 * Features:
 * - Ranged enemy shooting mechanics
 * - Enemy movement toward player
 * - Deterministic AI using world RNG
 */

import type { Enemy, Projectile, RNG, Vec2, WorldState } from '../types';
import { nextRange } from '../core/rng';

/**
 * Update enemy AI behaviors
 *
 * @param state - World state (mutated)
 * @returns Updated RNG state
 */
export function stepEnemyAI(state: WorldState): RNG {
  let currentRng = state.rng;

  // Update all enemies
  for (const enemy of state.enemies) {
    // Update ranged enemy shooting
    if (enemy.kind === 'ranged' && enemy.shootTimer !== undefined && enemy.shootCooldown) {
      enemy.shootTimer += state.dt;

      // Check if ready to shoot
      if (enemy.shootTimer >= enemy.shootCooldown) {
        const distToPlayer = getDistance(enemy.pos, state.player.pos);

        // Only shoot if within range
        if (enemy.shootRange && distToPlayer <= enemy.shootRange) {
          const [projectile, nextRng] = createEnemyProjectile(
            currentRng,
            enemy,
            state.player.pos
          );
          currentRng = nextRng;

          // Add projectile to world
          state.enemyProjectiles.push(projectile);

          // Reset timer with small variance
          const [variance, rng2] = nextRange(currentRng, -0.2, 0.2);
          currentRng = rng2;
          enemy.shootTimer = variance;
        } else {
          // Reset timer even if out of range
          enemy.shootTimer = 0;
        }
      }
    }

    // Move enemy toward player (basic AI)
    moveEnemyTowardPlayer(enemy, state.player.pos, state.dt);
  }

  return currentRng;
}

/**
 * Move enemy toward player
 */
function moveEnemyTowardPlayer(enemy: Enemy, playerPos: Vec2, dt: number): void {
  const dx = playerPos.x - enemy.pos.x;
  const dy = playerPos.y - enemy.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 0) {
    // Normalize direction
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Move toward player
    enemy.pos.x += dirX * enemy.speed * dt;
    enemy.pos.y += dirY * enemy.speed * dt;
  }
}

/**
 * Get distance between two points
 */
function getDistance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Create a projectile from an enemy toward the player
 */
function createEnemyProjectile(
  rng: RNG,
  enemy: Enemy,
  targetPos: Vec2
): [Projectile, RNG] {
  // Calculate direction to target
  const dx = targetPos.x - enemy.pos.x;
  const dy = targetPos.y - enemy.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let dirX = 1;
  let dirY = 0;

  if (dist > 0) {
    dirX = dx / dist;
    dirY = dy / dist;
  }

  // Add slight spread for variation
  const [spreadAngle, nextRng] = nextRange(rng, -0.1, 0.1); // ±0.1 radians
  const cos = Math.cos(spreadAngle);
  const sin = Math.sin(spreadAngle);

  // Rotate direction by spread angle
  const rotatedDirX = dirX * cos - dirY * sin;
  const rotatedDirY = dirX * sin + dirY * cos;

  const projectile: Projectile = {
    active: true,
    pos: { x: enemy.pos.x, y: enemy.pos.y },
    dir: { x: rotatedDirX, y: rotatedDirY },
    speed: 200, // Enemy projectile speed
    damage: enemy.projectileDamage || 5,
    ttl: 3.0, // 3 second lifetime
    ownerId: enemy.id,
    radius: 4, // Smaller than player projectiles
  };

  return [projectile, nextRng];
}

/**
 * Update enemy projectiles (movement and TTL)
 */
export function stepEnemyProjectiles(dt: number, projectiles: Projectile[]): void {
  // Update each projectile
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];

    if (!proj.active) {
      // Remove inactive projectiles
      projectiles.splice(i, 1);
      continue;
    }

    // Update position
    proj.pos.x += proj.dir.x * proj.speed * dt;
    proj.pos.y += proj.dir.y * proj.speed * dt;

    // Update TTL
    proj.ttl -= dt;

    if (proj.ttl <= 0) {
      // Remove expired projectiles
      projectiles.splice(i, 1);
    }
  }
}
