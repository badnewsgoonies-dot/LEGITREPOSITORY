/**
 * Damage Numbers System - floating damage text
 *
 * Shows damage numbers that float upward when enemies are hit
 */

import type { Vec2, Pool } from '../types';
import { makePool } from '../util/pool';

export interface DamageNumber {
  active: boolean;
  pos: Vec2;
  damage: number;
  lifetime: number; // remaining lifetime
  maxLifetime: number;
  velocity: Vec2;
  isCrit: boolean;
}

let damageNumberPool: Pool<DamageNumber> | null = null;

/**
 * Initialize damage number pool
 */
export function initDamageNumbers(poolSize: number = 128): Pool<DamageNumber> {
  if (!damageNumberPool) {
    damageNumberPool = makePool<DamageNumber>(
      (): DamageNumber => ({
        active: false,
        pos: { x: 0, y: 0 },
        damage: 0,
        lifetime: 0,
        maxLifetime: 0,
        velocity: { x: 0, y: 0 },
        isCrit: false,
      }),
      poolSize
    );
  }
  return damageNumberPool!;
}

/**
 * Spawn a damage number
 */
export function spawnDamageNumber(
  pool: Pool<DamageNumber>,
  pos: Vec2,
  damage: number,
  isCrit: boolean = false
): void {
  const number = pool.take();
  if (!number) return;

  number.active = true;
  number.pos = { x: pos.x, y: pos.y };
  number.damage = damage;
  number.lifetime = 1.0; // 1 second
  number.maxLifetime = 1.0;
  number.velocity = {
    x: (Math.random() - 0.5) * 20, // Random horizontal drift
    y: -60, // Float upward
  };
  number.isCrit = isCrit;
}

/**
 * Update damage numbers
 */
export function stepDamageNumbers(
  damageNumbers: DamageNumber[],
  dt: number,
  pool: Pool<DamageNumber>
): void {
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const number = damageNumbers[i];

    if (!number.active) {
      damageNumbers.splice(i, 1);
      continue;
    }

    // Update lifetime
    number.lifetime -= dt;
    if (number.lifetime <= 0) {
      number.active = false;
      pool.put(number);
      damageNumbers.splice(i, 1);
      continue;
    }

    // Update position
    number.pos.x += number.velocity.x * dt;
    number.pos.y += number.velocity.y * dt;

    // Slow down horizontal movement
    number.velocity.x *= 0.95;
  }
}

/**
 * Render damage numbers
 */
export function renderDamageNumbers(
  ctx: CanvasRenderingContext2D,
  damageNumbers: DamageNumber[]
): void {
  for (const number of damageNumbers) {
    if (!number.active) continue;

    // Calculate alpha based on remaining lifetime
    const alpha = number.lifetime / number.maxLifetime;

    ctx.globalAlpha = alpha;

    // Color and size based on crit
    if (number.isCrit) {
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 20px monospace';
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(number.damage.toString(), number.pos.x, number.pos.y);

    // Draw text
    ctx.fillText(number.damage.toString(), number.pos.x, number.pos.y);
  }

  ctx.globalAlpha = 1.0;
}
