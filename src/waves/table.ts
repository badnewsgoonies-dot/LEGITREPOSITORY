/**
 * Wave configuration table for enemy spawning
 *
 * Defines enemy types, spawn rates, and difficulty progression per minute.
 * All configurations are deterministic based on minute and RNG seed.
 */

import type { WaveConfig } from '../types';

/**
 * Wave configurations per minute.
 * Each minute has different enemy mixes and spawn rates.
 */
export const WAVE_TABLE: WaveConfig[] = [
  // Minute 0-1: Tutorial, easy zombies
  {
    minute: 0,
    spawnRate: 2, // 2 enemies per second
    eliteChance: 0.0,
    enemies: [
      {
        kind: 'zombie',
        weight: 100,
        hp: 10,
        speed: 40,
        touchDamage: 5,
      },
    ],
  },

  // Minute 1-2: Introduce fast enemies
  {
    minute: 1,
    spawnRate: 3,
    eliteChance: 0.05,
    enemies: [
      {
        kind: 'zombie',
        weight: 70,
        hp: 12,
        speed: 45,
        touchDamage: 5,
      },
      {
        kind: 'fast',
        weight: 30,
        hp: 6,
        speed: 80,
        touchDamage: 3,
      },
    ],
  },

  // Minute 2-3: More variety
  {
    minute: 2,
    spawnRate: 4,
    eliteChance: 0.08,
    enemies: [
      {
        kind: 'zombie',
        weight: 50,
        hp: 15,
        speed: 50,
        touchDamage: 6,
      },
      {
        kind: 'fast',
        weight: 35,
        hp: 8,
        speed: 90,
        touchDamage: 4,
      },
      {
        kind: 'swarm',
        weight: 15,
        hp: 4,
        speed: 60,
        touchDamage: 2,
      },
    ],
  },

  // Minute 3-4: Introduce tanks
  {
    minute: 3,
    spawnRate: 5,
    eliteChance: 0.1,
    enemies: [
      {
        kind: 'zombie',
        weight: 40,
        hp: 18,
        speed: 55,
        touchDamage: 7,
      },
      {
        kind: 'fast',
        weight: 30,
        hp: 10,
        speed: 100,
        touchDamage: 5,
      },
      {
        kind: 'tank',
        weight: 20,
        hp: 50,
        speed: 25,
        touchDamage: 15,
      },
      {
        kind: 'swarm',
        weight: 10,
        hp: 5,
        speed: 70,
        touchDamage: 2,
      },
    ],
  },

  // Minute 4-5: Ramping up
  {
    minute: 4,
    spawnRate: 6,
    eliteChance: 0.12,
    enemies: [
      {
        kind: 'zombie',
        weight: 35,
        hp: 22,
        speed: 60,
        touchDamage: 8,
      },
      {
        kind: 'fast',
        weight: 30,
        hp: 12,
        speed: 110,
        touchDamage: 6,
      },
      {
        kind: 'tank',
        weight: 25,
        hp: 60,
        speed: 30,
        touchDamage: 18,
      },
      {
        kind: 'swarm',
        weight: 10,
        hp: 6,
        speed: 80,
        touchDamage: 3,
      },
    ],
  },

  // Minute 5+: Maximum difficulty (repeated)
  {
    minute: 5,
    spawnRate: 8,
    eliteChance: 0.15,
    enemies: [
      {
        kind: 'zombie',
        weight: 30,
        hp: 25,
        speed: 65,
        touchDamage: 10,
      },
      {
        kind: 'fast',
        weight: 30,
        hp: 15,
        speed: 120,
        touchDamage: 7,
      },
      {
        kind: 'tank',
        weight: 30,
        hp: 70,
        speed: 35,
        touchDamage: 20,
      },
      {
        kind: 'swarm',
        weight: 10,
        hp: 8,
        speed: 90,
        touchDamage: 4,
      },
    ],
  },
];

/**
 * Get wave configuration for a given minute.
 * If minute exceeds table, returns the last entry.
 *
 * @param minute - Current game minute (floor)
 * @returns Wave configuration
 */
export function getWaveConfig(minute: number): WaveConfig {
  const clampedMinute = Math.floor(minute);

  // Find matching config or use last one
  for (let i = WAVE_TABLE.length - 1; i >= 0; i--) {
    if (clampedMinute >= WAVE_TABLE[i].minute) {
      return WAVE_TABLE[i];
    }
  }

  // Fallback to first entry (shouldn't happen)
  return WAVE_TABLE[0];
}

/**
 * Elite multipliers applied to base stats.
 */
export const ELITE_MULTIPLIERS = {
  hp: 3.0,
  speed: 1.2,
  touchDamage: 2.0,
};
