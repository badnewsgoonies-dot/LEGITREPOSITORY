/**
 * Player Movement System
 *
 * Features:
 * - WASD movement with normalized diagonals
 * - Arena boundary clamping
 * - Speed scaling from upgrades
 */

import type { Player, InputState, Upgrade } from '../types';
import { getScaledPlayerSpeed } from './stats';

// Constants
const BASE_PLAYER_SPEED = 150; // pixels per second
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const ARENA_PADDING = 20; // Keep player away from edges

/**
 * Update player position based on input
 */
export function stepPlayer(
  player: Player,
  input: InputState,
  upgrades: Upgrade[],
  dt: number
): void {
  // Calculate movement vector
  let vx = 0;
  let vy = 0;

  if (input.left) vx -= 1;
  if (input.right) vx += 1;
  if (input.up) vy -= 1;
  if (input.down) vy += 1;

  // Normalize diagonal movement (prevent √2 speed boost)
  if (vx !== 0 && vy !== 0) {
    const len = Math.sqrt(vx * vx + vy * vy);
    vx /= len;
    vy /= len;
  }

  // Apply speed scaling (character stats * upgrade multiplier)
  const speed = getScaledPlayerSpeed(BASE_PLAYER_SPEED, player, upgrades);

  // Update position
  player.pos.x += vx * speed * dt;
  player.pos.y += vy * speed * dt;

  // Clamp to arena bounds
  player.pos.x = Math.max(
    ARENA_PADDING + player.radius,
    Math.min(ARENA_WIDTH - ARENA_PADDING - player.radius, player.pos.x)
  );
  player.pos.y = Math.max(
    ARENA_PADDING + player.radius,
    Math.min(ARENA_HEIGHT - ARENA_PADDING - player.radius, player.pos.y)
  );
}

/**
 * Get player facing direction (toward nearest enemy or default right)
 */
export function getPlayerFacingDirection(
  player: Player,
  enemies: Array<{ pos: { x: number; y: number } }>
): { x: number; y: number } {
  if (enemies.length === 0) {
    return { x: 1, y: 0 }; // Default: face right
  }

  // Find nearest enemy
  let nearestDist = Infinity;
  let nearestEnemy = enemies[0];

  for (const enemy of enemies) {
    const dx = enemy.pos.x - player.pos.x;
    const dy = enemy.pos.y - player.pos.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < nearestDist) {
      nearestDist = distSq;
      nearestEnemy = enemy;
    }
  }

  // Calculate direction to nearest enemy
  const dx = nearestEnemy.pos.x - player.pos.x;
  const dy = nearestEnemy.pos.y - player.pos.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) {
    return { x: 1, y: 0 };
  }

  return {
    x: dx / len,
    y: dy / len,
  };
}
