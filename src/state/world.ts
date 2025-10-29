/**
 * World state initialization and update logic
 */

import { mkRng } from '../core/rng';
import { STEP_SEC } from '../core/loop';
import { makePool } from '../util/pool';
import { createProjectileFactory, stepProjectiles } from '../systems/projectiles';
import { stepWeapons, createWeapon } from '../systems/weapons';
import { stepSpawns, getMinute } from '../systems/spawn';
import { stepCollision } from '../systems/collision';
import { stepXP, spawnXPFromKills, calculateXPForLevel } from '../systems/xp';
import { createUpgradePool, createDraft } from '../systems/draft';
import { applyPlayerRegen, updateWeaponStats } from '../systems/stats';
import { stepPlayer, getPlayerFacingDirection } from '../systems/player';
import { getInput } from '../core/input';
import { stepEnemyAI, stepEnemyProjectiles } from '../systems/enemy-ai';
import { initParticles, stepParticles } from '../systems/particles';
import { initScreenShake, updateScreenShake, addTrauma } from '../core/screenshake';
import type { WorldState } from '../types';

/**
 * Initialize a new world state with the given seed.
 * @param seed - RNG seed for determinism
 * @param includeDefaultWeapon - Whether to add a default weapon (default: true)
 * @returns Initial world state
 */
export function initWorld(seed: number, includeDefaultWeapon = true): WorldState {
  const projectilesPool = makePool(createProjectileFactory(), 512);
  const particlesPool = initParticles(256);

  return {
    seed,
    time: 0,
    dt: STEP_SEC,
    frameCount: 0,
    rng: mkRng(seed),
    isPaused: false,
    gameState: 'playing',
    stats: {
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      xpCollected: 0,
      timeSurvived: 0,
    },
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
    enemyProjectiles: [],
    enemies: [],
    spawnAccumulator: 0,
    player: {
      pos: { x: 400, y: 300 }, // Center of 800x600 canvas
      hp: 100,
      maxHp: 100,
      iframes: 0,
      iframeDuration: 1.0, // 1 second of invincibility after hit
      radius: 12, // Player collision radius
      xp: 0,
      level: 1,
      xpToNext: calculateXPForLevel(1),
    },
    damageEvents: [],
    xpGems: [],
    upgrades: [],
    upgradePool: createUpgradePool(),
    draftChoice: null,
    particles: [],
    particlesPool,
    screenShake: initScreenShake(),
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

  // Apply player regeneration
  applyPlayerRegen(state);

  // Update weapon stats based on upgrades
  updateWeaponStats(state);

  // Update player movement (WASD controls)
  const input = getInput();
  stepPlayer(state.player, input, state.upgrades, state.dt);

  // Get player facing direction (toward nearest enemy)
  const playerPos = state.player.pos;
  const targetDir = getPlayerFacingDirection(state.player, state.enemies);

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

  // Add trauma for boss spawns
  const bossSpawned = newEnemies.some((e) => e.kind === 'boss');
  if (bossSpawned) {
    addTrauma(state.screenShake, 0.5);
  }

  // Update enemy AI (movement, shooting for ranged enemies)
  currentRng = stepEnemyAI(state);

  // Update enemy projectiles
  stepEnemyProjectiles(state.dt, state.enemyProjectiles);

  // Track enemies before collision to detect kills
  const enemiesBeforeCollision = state.enemies.map((e) => ({
    id: e.id,
    pos: { ...e.pos },
    isElite: e.isElite,
  }));

  // Handle collisions (damage & knockback)
  const newDamageEvents = stepCollision(state);
  state.damageEvents.push(...newDamageEvents);

  // Find killed enemies (those that were alive before but not in the list now)
  const killedEnemies = enemiesBeforeCollision.filter(
    (before) => !state.enemies.some((after) => after.id === before.id)
  );

  // Spawn XP gems for killed enemies
  if (killedEnemies.length > 0) {
    spawnXPFromKills(state, killedEnemies);
    state.stats.enemiesKilled += killedEnemies.length;
  }

  // Update XP system (magnet, collection, level-up)
  const leveledUp = stepXP(state);

  // Update particles
  stepParticles(state.particles, state.dt, state.particlesPool);

  // Update screen shake
  updateScreenShake(state.screenShake, state.dt);

  // Create draft if player leveled up and no draft is active
  if (leveledUp && state.draftChoice === null && state.gameState === 'playing') {
    const [draft, draftRng] = createDraft(currentRng, state.upgradePool);
    currentRng = draftRng;
    state.draftChoice = draft;
    state.isPaused = true; // Pause game during draft
  }

  // Update stats
  state.stats.timeSurvived = state.time;

  // Check victory condition (20 minutes = 1200 seconds)
  if (state.time >= 1200 && state.gameState === 'playing') {
    state.gameState = 'victory';
    state.isPaused = true;
  }

  // Check death condition
  if (state.player.hp <= 0 && state.gameState === 'playing') {
    state.gameState = 'game_over';
    state.isPaused = true;
  }

  return {
    ...state,
    time: state.time + state.dt,
    frameCount: state.frameCount + 1,
    rng: currentRng,
    projectiles: state.projectiles, // Reference same array (modified in-place)
    enemyProjectiles: state.enemyProjectiles, // Reference same array (modified in-place)
    enemies: state.enemies, // Reference same array (modified in-place)
    player: state.player, // Reference same object (modified in-place)
    spawnAccumulator: newAccumulator,
    damageEvents: state.damageEvents, // Reference same array (modified in-place)
    xpGems: state.xpGems, // Reference same array (modified in-place)
    upgrades: state.upgrades, // Reference same array (modified in-place)
    upgradePool: state.upgradePool, // Reference same array (modified in-place)
    draftChoice: state.draftChoice, // May be null or active draft
    particles: state.particles, // Reference same array (modified in-place)
    particlesPool: state.particlesPool, // Reference same pool
    screenShake: state.screenShake, // Reference same object (modified in-place)
  };
}

/**
 * Get a readable summary of world state for debugging.
 * @param state - World state
 * @returns Debug string
 */
export function debugWorld(state: WorldState): string {
  const activeProj = state.projectiles.length;
  const minute = getMinute(state.time);
  return `Frame ${state.frameCount} | Time ${state.time.toFixed(2)}s | Min: ${minute} | HP: ${state.player.hp}/${state.player.maxHp} | Enemies: ${state.enemies.length} | Projectiles: ${activeProj}`;
}
