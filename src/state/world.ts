/**
 * World state initialization and update logic
 */

import { mkRng, nextFloat } from '../core/rng';
import { STEP_SEC } from '../core/loop';
import type { WorldState } from '../types';

/**
 * Initialize a new world state with the given seed.
 * @param seed - RNG seed for determinism
 * @returns Initial world state
 */
export function initWorld(seed: number): WorldState {
  return {
    seed,
    time: 0,
    dt: STEP_SEC,
    frameCount: 0,
    rng: mkRng(seed),
    isPaused: false,
  };
}

/**
 * Core update function - advances world by one fixed timestep.
 * This is where all game logic will eventually go.
 *
 * @param state - Current world state
 * @returns Updated world state
 */
export function updateWorld(state: WorldState): WorldState {
  // Advance RNG as a simple proof of determinism
  const [_value, newRng] = nextFloat(state.rng);

  return {
    ...state,
    time: state.time + state.dt,
    frameCount: state.frameCount + 1,
    rng: newRng,
  };
}

/**
 * Get a readable summary of world state for debugging.
 * @param state - World state
 * @returns Debug string
 */
export function debugWorld(state: WorldState): string {
  return `Frame ${state.frameCount} | Time ${state.time.toFixed(2)}s | Paused: ${state.isPaused}`;
}
