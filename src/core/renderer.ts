/**
 * Canvas renderer - draws game state
 */

import type { GameState } from '../types/game';
import { ARENA_WIDTH, ARENA_HEIGHT } from '../systems/player';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    // Set canvas size
    canvas.width = ARENA_WIDTH;
    canvas.height = ARENA_HEIGHT;
  }

  /**
   * Render game state to canvas
   */
  render(state: GameState): void {
    const { ctx } = this;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw arena border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw pickups
    for (const pickup of state.pickups) {
      if (pickup.pickupType === 'xp') {
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw projectiles
    for (const proj of state.projectiles) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw enemies
    for (const enemy of state.enemies) {
      const isElite = enemy.enemyType.startsWith('elite_');
      ctx.fillStyle = isElite ? '#dc2626' : '#ef4444';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      // HP bar for elites
      if (isElite) {
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 8, 40, 4);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 8, 40 * hpPercent, 4);
      }
    }

    // Draw player
    const { player } = state;
    ctx.fillStyle = player.iframes > 0 ? 'rgba(34, 197, 94, 0.5)' : '#22c55e';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw facing direction
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x + player.facing.x * player.radius * 1.5,
      player.y + player.facing.y * player.radius * 1.5
    );
    ctx.stroke();

    // Draw pickup range (debug)
    if (false) {
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.stats.pickup, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
