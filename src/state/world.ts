/**
 * World state initialization and update logic
 */

import { mkRng } from '../core/rng';
import { STEP_SEC } from '../core/loop';
import { makePool } from '../util/pool';
import { createProjectileFactory, stepProjectiles } from '../systems/projectiles';
import { stepWeapons, createWeapon } from '../systems/weapons';
import type { WorldState } from '../types';

/**
 * Initialize a new world state with the given seed.
 * @param seed - RNG seed for determinism
 * @param includeDefaultWeapon - Whether to add a default weapon (default: true)
 * @returns Initial world state
 */
export function initWorld(seed: number, includeDefaultWeapon = true): WorldState {
  const projectilesPool = makePool(createProjectileFactory(), 512);

  return {
    seed,
    time: 0,
    dt: STEP_SEC,
    frameCount: 0,
    rng: mkRng(seed),
    isPaused: false,
    weapons: includeDefaultWeapon
      ? [
          createWeapon('default', {
            type: 'starter',
            damage: 10,
            cooldown: 0.5,
            projectileSpeed: 300,
            projectileCount: 1,
            spreadAngle: 0,
            ttl: 2.0,
          }),
        ]
      : [],
    projectiles: [],
    projectilesPool,
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
  let currentRng = state.rng;

  // Default firing position and direction for demo
  // In a real game, this would come from player position/input
  const ownerPos = { x: 400, y: 300 }; // Center of 800x600 canvas
  const targetDir = { x: 1, y: 0 }; // Fire to the right

  // Update weapons and spawn projectiles
  const { newProjectiles, rng: weaponsRng } = stepWeapons(
    state.dt,
    state.weapons,
    currentRng,
    state.projectilesPool,
    ownerPos,
    targetDir
  );
  currentRng = weaponsRng;

  // Add new projectiles to active list
  state.projectiles.push(...newProjectiles);

  // Update existing projectiles
  stepProjectiles(state.dt, state.projectiles, state.projectilesPool);

  return {
    ...state,
    time: state.time + state.dt,
    frameCount: state.frameCount + 1,
    rng: currentRng,
    projectiles: state.projectiles, // Reference same array (modified in-place)
  };
}

/**
 * Get a readable summary of world state for debugging.
 * @param state - World state
 * @returns Debug string
 */
export function debugWorld(state: WorldState): string {
  const activeProj = state.projectiles.length;
  const poolAvail = state.projectilesPool.available();
  return `Frame ${state.frameCount} | Time ${state.time.toFixed(2)}s | Projectiles: ${activeProj} | Pool: ${poolAvail}/512`;
}
