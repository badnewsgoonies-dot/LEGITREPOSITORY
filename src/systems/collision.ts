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
import { spawnDamageNumber } from '../systems/damage-numbers';

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
      // Skip if already pierced this enemy
      if (proj.pierced && proj.pierced.has(enemy.id)) continue;

      // Check collision
      const projCircle: Circle = { x: proj.pos.x, y: proj.pos.y, radius: proj.radius };
      const enemyCircle: Circle = { x: enemy.pos.x, y: enemy.pos.y, radius: enemy.radius };

      if (checkCircle(projCircle, enemyCircle)) {
        // Calculate damage (with crit chance)
        const critUpgrade = world.upgrades.find((u) => u.type === 'crit_chance');
        const critChance = critUpgrade ? (critUpgrade.value * critUpgrade.currentLevel) : 0;
        const isCrit = Math.random() < critChance;
        const finalDamage = isCrit ? proj.damage * 2 : proj.damage;

        contacts.push({
          type: 'projectile-enemy',
          entityA: `projectile_${world.projectiles.indexOf(proj)}`,
          entityB: enemy.id,
          damage: finalDamage,
          knockback: calculateKnockback(proj.pos, enemy.pos, KNOCKBACK_MAGNITUDE),
          isCrit,
        });

        // Handle pierce mechanics
        const pierceUpgrade = world.upgrades.find((u) => u.type === 'pierce');
        const pierceCount = pierceUpgrade ? (pierceUpgrade.value * pierceUpgrade.currentLevel) : 0;

        if (pierceCount > 0) {
          // Track pierced enemies
          if (!proj.pierced) proj.pierced = new Set();
          proj.pierced.add(enemy.id);

          // Deactivate if pierced all available targets
          if (proj.pierced.size > pierceCount) {
            proj.active = false;
            break;
          }
        } else {
          // No pierce - deactivate immediately
          proj.active = false;
          break;
        }
      }
    }
  }

  // Enemy Projectile vs Player collisions
  for (let i = 0; i < world.enemyProjectiles.length; i++) {
    const proj = world.enemyProjectiles[i];
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
        entityA: `enemy_projectile_${i}`,
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

        // Spawn damage number
        spawnDamageNumber(world.damageNumbersPool, enemy.pos, contact.damage, contact.isCrit || false);

        // Track damage dealt
        world.stats.damageDealt += contact.damage;

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

            // Apply lifesteal
            const lifestealUpgrade = world.upgrades.find((u) => u.type === 'lifesteal');
            if (lifestealUpgrade) {
              const healAmount = lifestealUpgrade.value * lifestealUpgrade.currentLevel;
              world.player.hp = Math.min(world.player.maxHp, world.player.hp + healAmount);
              // Spawn heal particles
              spawnParticleBurst(world.particlesPool, 'pickup', world.player.pos, 3);
            }

            // Apply AoE explosion on death
            const aoeUpgrade = world.upgrades.find((u) => u.type === 'area_damage');
            if (aoeUpgrade) {
              const aoeDamagePercent = aoeUpgrade.value * aoeUpgrade.currentLevel;
              const aoeDamage = Math.floor(contact.damage * aoeDamagePercent);
              const aoeRadius = 100; // Fixed AoE radius

              // Damage nearby enemies
              for (const nearbyEnemy of world.enemies) {
                if (nearbyEnemy.id === enemy.id) continue; // Skip the killed enemy

                const dx = nearbyEnemy.pos.x - enemy.pos.x;
                const dy = nearbyEnemy.pos.y - enemy.pos.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < aoeRadius * aoeRadius) {
                  nearbyEnemy.hp -= aoeDamage;
                  // Spawn hit particles
                  spawnParticleBurst(world.particlesPool, 'hit', nearbyEnemy.pos, 4);
                }
              }

              // Spawn explosion particles
              spawnParticleBurst(world.particlesPool, 'death', enemy.pos, 20);
            }

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
      // Apply damage to player (respecting i-frames and armor)
      if (world.player.iframes <= 0 && contact.damage) {
        // Calculate armor reduction
        const armorUpgrade = world.upgrades.find((u) => u.type === 'armor');
        const armorReduction = armorUpgrade ? (armorUpgrade.value * armorUpgrade.currentLevel) : 0;
        const totalArmor = world.player.armor + armorReduction;

        // Apply damage with armor reduction (0-1 range)
        const damageMultiplier = Math.max(0, 1 - totalArmor);
        const finalDamage = Math.ceil(contact.damage * damageMultiplier);

        world.player.hp -= finalDamage;
        world.player.iframes = world.player.iframeDuration; // Activate i-frames

        world.stats.damageTaken += finalDamage;

        damageEvents.push({
          frame: world.frameCount,
          targetId: 'player',
          damage: finalDamage,
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
