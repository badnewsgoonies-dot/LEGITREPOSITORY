/**
 * World state initialization and update logic
 */

import { mkRng } from '../core/rng';
import { STEP_SEC } from '../core/loop';
import { makePool } from '../util/pool';
import { createProjectileFactory, stepProjectiles } from '../systems/projectiles';
import { stepWeapons, createWeapon } from '../systems/weapons';
import { stepSpawns, getMinute } from '../systems/spawn';
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
    enemies: [],
    spawnAccumulator: 0,
    playerPos: { x: 400, y: 300 }, // Center of 800x600 canvas
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

  // Player position and direction for demo
  const playerPos = state.playerPos;
  const targetDir = { x: 1, y: 0 }; // Fire to the right

  // Update weapons and spawn projectiles
  const { newProjectiles, rng: weaponsRng } = stepWeapons(
    state.dt,
    state.weapons,
    currentRng,
    state.projectilesPool,
    playerPos,
    targetDir
  );
  currentRng = weaponsRng;

  // Add new projectiles to active list
  state.projectiles.push(...newProjectiles);

  // Update existing projectiles
  stepProjectiles(state.dt, state.projectiles, state.projectilesPool);

  // Spawn enemies based on wave progression
  const minute = getMinute(state.time);
  const {
    newEnemies,
    newAccumulator,
    rng: spawnRng,
  } = stepSpawns(state.dt, state.spawnAccumulator, currentRng, minute, playerPos);
  currentRng = spawnRng;

  // Add new enemies to active list
  state.enemies.push(...newEnemies);

  return {
    ...state,
    time: state.time + state.dt,
    frameCount: state.frameCount + 1,
    rng: currentRng,
    projectiles: state.projectiles, // Reference same array (modified in-place)
    enemies: state.enemies, // Reference same array (modified in-place)
    spawnAccumulator: newAccumulator,
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
  const minute = getMinute(state.time);
  return `Frame ${state.frameCount} | Time ${state.time.toFixed(2)}s | Min: ${minute} | Enemies: ${state.enemies.length} | Projectiles: ${activeProj} | Pool: ${poolAvail}/512`;
}
