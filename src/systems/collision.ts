/**
 * S5: Collision, Damage & Knockback
 * AABB and circle collision detection
 * Apply damage, i-frames, knockback
 */

import type { Player, Enemy, Projectile, Pickup, Rect } from '../types/game';
import { damagePlayer } from './player';
import { removeProjectile } from './weapons';

export interface CollisionEvent {
  type: 'player_hit' | 'enemy_hit' | 'pickup_collected';
  entityId: number;
  damage?: number;
  knockback?: { x: number; y: number };
}

/**
 * AABB overlap test
 */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Circle overlap test
 */
export function circleOverlap(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distSq = dx * dx + dy * dy;
  const radiusSum = r1 + r2;
  return distSq <= radiusSum * radiusSum;
}

/**
 * Resolve all collisions and return events
 */
export function resolveCollisions(
  player: Player,
  enemies: Enemy[],
  projectiles: Projectile[],
  pickups: Pickup[]
): {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  events: CollisionEvent[];
} {
  const events: CollisionEvent[] = [];
  let updatedPlayer = player;

  // Player vs Enemies
  for (const enemy of enemies) {
    if (circleOverlap(player.x, player.y, player.radius, enemy.x, enemy.y, enemy.radius)) {
      const [newPlayer, damageDealt] = damagePlayer(player, enemy.damage);
      if (damageDealt > 0) {
        updatedPlayer = newPlayer;
        events.push({
          type: 'player_hit',
          entityId: enemy.id,
          damage: damageDealt,
        });
      }
    }
  }

  // Projectiles vs Enemies
  const activeProjectiles: Projectile[] = [];
  const deadEnemies = new Set<number>();

  for (const proj of projectiles) {
    let shouldKeep = true;

    for (const enemy of enemies) {
      // Skip if already hit by this projectile
      if (proj.hitIds.has(enemy.id)) continue;

      if (circleOverlap(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) {
        // Apply damage
        enemy.hp -= proj.damage;
        proj.hitIds.add(enemy.id);

        events.push({
          type: 'enemy_hit',
          entityId: enemy.id,
          damage: proj.damage,
        });

        // Apply knockback
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const knockbackStrength = 200 * (1 - enemy.knockbackResist);
          const kbx = (dx / dist) * knockbackStrength;
          const kby = (dy / dist) * knockbackStrength;

          enemy.vx += kbx;
          enemy.vy += kby;

          events.push({
            type: 'enemy_hit',
            entityId: enemy.id,
            knockback: { x: kbx, y: kby },
          });
        }

        // Mark dead enemies
        if (enemy.hp <= 0) {
          deadEnemies.add(enemy.id);
        }

        // Check piercing
        if (proj.hitIds.size >= proj.piercing) {
          removeProjectile(proj);
          shouldKeep = false;
          break;
        }
      }
    }

    if (shouldKeep && proj.ttl > 0) {
      activeProjectiles.push(proj);
    }
  }

  // Remove dead enemies
  const aliveEnemies = enemies.filter((e) => !deadEnemies.has(e.id));

  // Player vs Pickups
  const remainingPickups: Pickup[] = [];

  for (const pickup of pickups) {
    const pickupRadius = player.stats.pickup;

    if (circleOverlap(player.x, player.y, pickupRadius, pickup.x, pickup.y, pickup.radius)) {
      events.push({
        type: 'pickup_collected',
        entityId: pickup.id,
      });
      // Pickup handled by XP system
    } else {
      remainingPickups.push(pickup);
    }
  }

  return {
    player: updatedPlayer,
    enemies: aliveEnemies,
    projectiles: activeProjectiles,
    pickups: remainingPickups,
    events,
  };
}

/**
 * Check if point is inside circle
 */
export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}
