/**
 * Particle System - simple pooled particle effects
 *
 * Features:
 * - Object pooling for performance
 * - Simple physics (velocity, gravity)
 * - Color and size variation
 * - Minimal allocations
 */

import type { Vec2, Pool } from '../types';
import { makePool } from '../util/pool';

export interface Particle {
  active: boolean;
  pos: Vec2;
  vel: Vec2; // velocity
  life: number; // remaining lifetime in seconds
  maxLife: number; // initial lifetime
  size: number; // particle radius
  color: string; // CSS color
  gravity: number; // gravity strength
}

export type ParticleType = 'death' | 'hit' | 'pickup' | 'levelup';

// Particle pool
let particlePool: Pool<Particle> | null = null;

/**
 * Initialize particle system with pooling
 */
export function initParticles(poolSize: number = 256): Pool<Particle> {
  if (!particlePool) {
    particlePool = makePool<Particle>(
      (): Particle => ({
        active: false,
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        life: 0,
        maxLife: 0,
        size: 0,
        color: '#fff',
        gravity: 0,
      }),
      poolSize
    );
  }
  return particlePool!; // We know it's not null after initialization
}

/**
 * Get the particle pool (must call initParticles first)
 */
export function getParticlePool(): Pool<Particle> | null {
  return particlePool;
}

/**
 * Spawn a burst of particles at a position
 */
export function spawnParticleBurst(
  pool: Pool<Particle>,
  type: ParticleType,
  pos: Vec2,
  count: number = 8
): void {
  const config = getParticleConfig(type);

  for (let i = 0; i < count; i++) {
    const particle = pool.take();
    if (!particle) break; // Pool exhausted

    // Random angle
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = config.speed * (0.5 + Math.random() * 0.5);

    particle.active = true;
    particle.pos = { x: pos.x, y: pos.y };
    particle.vel = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    particle.life = config.lifetime;
    particle.maxLife = config.lifetime;
    particle.size = config.size * (0.7 + Math.random() * 0.6);
    particle.color = config.color;
    particle.gravity = config.gravity;
  }
}

/**
 * Get particle configuration for a type
 */
function getParticleConfig(type: ParticleType) {
  switch (type) {
    case 'death':
      return {
        speed: 100,
        lifetime: 0.6,
        size: 4,
        color: '#ff4444',
        gravity: 200,
      };
    case 'hit':
      return {
        speed: 60,
        lifetime: 0.3,
        size: 2,
        color: '#ffaa00',
        gravity: 100,
      };
    case 'pickup':
      return {
        speed: 80,
        lifetime: 0.5,
        size: 3,
        color: '#00ff00',
        gravity: -50, // Float upward
      };
    case 'levelup':
      return {
        speed: 120,
        lifetime: 1.0,
        size: 5,
        color: '#ffff00',
        gravity: -30, // Float upward
      };
  }
}

/**
 * Update particle physics and lifetime
 */
export function stepParticles(particles: Particle[], dt: number, pool: Pool<Particle>): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    if (!p.active) {
      // Remove inactive particles
      particles.splice(i, 1);
      continue;
    }

    // Update lifetime
    p.life -= dt;
    if (p.life <= 0) {
      // Particle expired, return to pool
      p.active = false;
      pool.put(p);
      particles.splice(i, 1);
      continue;
    }

    // Update position
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;

    // Apply gravity
    p.vel.y += p.gravity * dt;

    // Apply damping
    p.vel.x *= 0.98;
    p.vel.y *= 0.98;
  }
}

/**
 * Render particles to canvas
 */
export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    if (!p.active) continue;

    // Calculate alpha based on remaining life
    const alpha = Math.min(1, p.life / p.maxLife);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0; // Reset alpha
}
