/**
 * Collision detection and resolution system
 *
 * Features:
 * - AABB and circle collision checks
 * - Damage application with i-frame respect
 * - Knockback mechanics
 * - Minimal allocations in hot loops
 */

import type {
  WorldState,
  Contact,
  DamageEvent,
  Vec2,
  AABB,
  Rect,
  Circle,
  Player,
} from '../types';
import { playSound } from '../core/audio';
import { spawnParticleBurst } from '../systems/particles';
import { addTrauma } from '../core/screenshake';

// Constants
const KNOCKBACK_MAGNITUDE = 50; // pixels per collision

/**
 * Check collision between two AABBs.
 *
 * @param a - First AABB
 * @param b - Second AABB
 * @returns true if overlapping
 */
export function checkAABB(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check overlap between two Rects (shorthand w/h version).
 *
 * @param a - First Rect
 * @param b - Second Rect
 * @returns true if overlapping
 */
export const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Check collision between two circles.
 *
 * @param a - First circle
 * @param b - Second circle
 * @returns true if overlapping
 */
export function checkCircle(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;
  return distSq < radiusSum * radiusSum;
}

/**
 * Check collision between circle and AABB.
 *
 * @param circle - Circle
 * @param aabb - AABB
 * @returns true if overlapping
 */
export function checkCircleAABB(circle: Circle, aabb: AABB): boolean {
  // Find closest point on AABB to circle center
  const closestX = Math.max(aabb.x, Math.min(circle.x, aabb.x + aabb.width));
  const closestY = Math.max(aabb.y, Math.min(circle.y, aabb.y + aabb.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;

  return distSq < circle.radius * circle.radius;
}

/**
 * Calculate knockback vector from A to B.
 *
 * @param posA - Position of A
 * @param posB - Position of B
 * @param magnitude - Knockback strength
 * @returns Knockback vector
 */
export function calculateKnockback(posA: Vec2, posB: Vec2, magnitude: number): Vec2 {
  const dx = posB.x - posA.x;
  const dy = posB.y - posA.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    // Default direction if positions are identical
    return { x: magnitude, y: 0 };
  }

  // Normalize and scale
  return {
    x: (dx / dist) * magnitude,
    y: (dy / dist) * magnitude,
  };
}

/**
 * Detect all collisions and generate contacts.
 * Minimal allocations - reuses objects where possible.
 *
 * @param world - World state
 * @returns Array of contacts
 */
export function detectCollisions(world: WorldState): Contact[] {
  const contacts: Contact[] = [];

  // Player Projectile vs Enemy collisions
  for (const proj of world.projectiles) {
    if (!proj.active) continue;

    for (const enemy of world.enemies) {
      // Check collision
      const projCircle: Circle = { x: proj.pos.x, y: proj.pos.y, radius: proj.radius };
      const enemyCircle: Circle = { x: enemy.pos.x, y: enemy.pos.y, radius: enemy.radius };

      if (checkCircle(projCircle, enemyCircle)) {
        contacts.push({
          type: 'projectile-enemy',
          entityA: `projectile_${world.projectiles.indexOf(proj)}`,
          entityB: enemy.id,
          damage: proj.damage,
          knockback: calculateKnockback(proj.pos, enemy.pos, KNOCKBACK_MAGNITUDE),
        });

        // Mark projectile as inactive (will be removed)
        proj.active = false;
        break; // Projectile can only hit one enemy
      }
    }
  }

  // Enemy Projectile vs Player collisions
  for (const proj of world.enemyProjectiles) {
    if (!proj.active) continue;

    const projCircle: Circle = { x: proj.pos.x, y: proj.pos.y, radius: proj.radius };
    const playerCircle: Circle = {
      x: world.player.pos.x,
      y: world.player.pos.y,
      radius: world.player.radius,
    };

    if (checkCircle(projCircle, playerCircle)) {
      contacts.push({
        type: 'enemy-player',
        entityA: `enemy_projectile_${world.enemyProjectiles.indexOf(proj)}`,
        entityB: 'player',
        damage: proj.damage,
        knockback: calculateKnockback(proj.pos, world.player.pos, KNOCKBACK_MAGNITUDE),
      });

      // Mark projectile as inactive (will be removed)
      proj.active = false;
    }
  }

  // Enemy vs Player collisions (melee)
  for (const enemy of world.enemies) {
    const enemyCircle: Circle = { x: enemy.pos.x, y: enemy.pos.y, radius: enemy.radius };
    const playerCircle: Circle = {
      x: world.player.pos.x,
      y: world.player.pos.y,
      radius: world.player.radius,
    };

    if (checkCircle(enemyCircle, playerCircle)) {
      contacts.push({
        type: 'enemy-player',
        entityA: enemy.id,
        entityB: 'player',
        damage: enemy.touchDamage,
        knockback: calculateKnockback(enemy.pos, world.player.pos, KNOCKBACK_MAGNITUDE * 2),
      });
    }
  }

  return contacts;
}

/**
 * Resolve collisions by applying damage and knockback.
 *
 * @param world - World state (mutated)
 * @param contacts - Contacts to resolve
 * @returns Damage events for logging
 */
export function resolveCollisions(world: WorldState, contacts: Contact[]): DamageEvent[] {
  const damageEvents: DamageEvent[] = [];

  for (const contact of contacts) {
    if (contact.type === 'projectile-enemy') {
      // Apply damage to enemy
      const enemy = world.enemies.find((e) => e.id === contact.entityB);
      if (enemy && contact.damage) {
        let damageToApply = contact.damage;

        // Handle shield mechanics for shielded enemies
        if (enemy.kind === 'shielded' && enemy.shieldHp && enemy.shieldHp > 0) {
          // Damage shield first
          const shieldDamage = Math.min(enemy.shieldHp, damageToApply);
          enemy.shieldHp -= shieldDamage;
          damageToApply -= shieldDamage;

          // If shield is depleted, apply remaining damage to HP
          if (damageToApply > 0) {
            enemy.hp -= damageToApply;
          }
        } else {
          // Normal damage
          enemy.hp -= damageToApply;
        }

        damageEvents.push({
          frame: world.frameCount,
          targetId: enemy.id,
          damage: contact.damage,
          source: 'projectile',
        });

        // Apply knockback
        if (contact.knockback) {
          enemy.pos.x += contact.knockback.x * world.dt;
          enemy.pos.y += contact.knockback.y * world.dt;
        }

        // Remove dead enemies
        if (enemy.hp <= 0) {
          const index = world.enemies.indexOf(enemy);
          if (index !== -1) {
            // Spawn death particles
            spawnParticleBurst(world.particlesPool, 'death', enemy.pos, 12);

            world.enemies.splice(index, 1);
            // Play kill sound
            playSound(enemy.kind === 'boss' ? 'boss' : 'kill', 0.5);
          }
        } else {
          // Spawn hit particles
          spawnParticleBurst(world.particlesPool, 'hit', enemy.pos, 4);

          // Play hit sound
          playSound('hit', 0.3);
        }
      }
    } else if (contact.type === 'enemy-player') {
      // Apply damage to player (respecting i-frames)
      if (world.player.iframes <= 0 && contact.damage) {
        world.player.hp -= contact.damage;
        world.player.iframes = world.player.iframeDuration; // Activate i-frames

        damageEvents.push({
          frame: world.frameCount,
          targetId: 'player',
          damage: contact.damage,
          source: 'enemy',
        });

        // Play damage sound
        playSound('damage', 0.6);

        // Add screen shake
        addTrauma(world.screenShake, 0.3);

        // Apply knockback to player
        if (contact.knockback) {
          world.player.pos.x += contact.knockback.x * world.dt;
          world.player.pos.y += contact.knockback.y * world.dt;
        }
      }
    }
  }

  return damageEvents;
}

/**
 * Update player i-frames.
 *
 * @param player - Player entity (mutated)
 * @param dt - Delta time
 */
export function updateIframes(player: Player, dt: number): void {
  if (player.iframes > 0) {
    player.iframes -= dt;
    if (player.iframes < 0) {
      player.iframes = 0;
    }
  }
}

/**
 * Step collision system: detect and resolve all collisions.
 *
 * @param world - World state (mutated)
 * @returns Damage events
 */
export function stepCollision(world: WorldState): DamageEvent[] {
  // Update i-frames
  updateIframes(world.player, world.dt);

  // Detect collisions
  const contacts = detectCollisions(world);

  // Resolve collisions
  const damageEvents = resolveCollisions(world, contacts);

  return damageEvents;
}
