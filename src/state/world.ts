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
import { initDamageNumbers, stepDamageNumbers } from '../systems/damage-numbers';

import {
  checkPowerUpSpawns,
  stepPowerUps,
  collectPowerUps,
  updateFlamethrower,
} from '../systems/powerups';
import type { WorldState } from '../types';
import type { CharacterDefinition } from '../data/characters';
import { WEAPON_DEFINITIONS, createWeaponFromDef } from '../systems/weapon-library';

/**
 * Initialize a new world state with the given seed.
 * @param seed - RNG seed for determinism
 * @param character - Character definition (optional, uses default if not provided)
 * @returns Initial world state
 */
export function initWorld(seed: number, character?: CharacterDefinition): WorldState {
  const projectilesPool = makePool(createProjectileFactory(), 512);
  const particlesPool = initParticles(256);
  const damageNumbersPool = initDamageNumbers(128);

  // Initialize weapon based on character
  const weapons = [];
  if (character) {
    const weaponDef = WEAPON_DEFINITIONS[character.startingWeapon];
    if (weaponDef) {
      weapons.push(createWeaponFromDef(weaponDef, 1));
    }
  } else {
    // Default weapon if no character provided
    weapons.push(
      createWeapon('default', {
        type: 'starter',
        damage: 10,
        cooldown: 0.5,
        projectileSpeed: 300,
        projectileCount: 1,
        spreadAngle: 0,
        ttl: 2.0,
      })
    );
  }

  // Initialize player stats based on character
  const baseStats = character?.baseStats || {
    maxHp: 100,
    moveSpeed: 1.0,
    might: 1.0,
    armor: 0,
    recovery: 0,
    cooldown: 1.0,
    area: 1.0,
    speed: 1.0,
    duration: 1.0,
    amount: 0,
    magnet: 0,
    luck: 0,
    growth: 1.0,
    greed: 0,
    curse: 0,
    revivals: 0,
  };

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
    weapons,
    projectiles: [],
    projectilesPool,
    enemyProjectiles: [],
    enemies: [],
    spawnAccumulator: 0,
    player: {
      pos: { x: 400, y: 300 }, // Center of 800x600 canvas
      hp: baseStats.maxHp,
      maxHp: baseStats.maxHp,
      iframes: 0,
      iframeDuration: 1.0, // 1 second of invincibility after hit
      radius: 12, // Player collision radius
      xp: 0,
      level: 1,
      xpToNext: calculateXPForLevel(1),

      // Character stats
      moveSpeed: baseStats.moveSpeed,
      might: baseStats.might,
      armor: baseStats.armor,
      recovery: baseStats.recovery,
      cooldown: baseStats.cooldown,
      area: baseStats.area,
      speed: baseStats.speed,
      duration: baseStats.duration,
      amount: baseStats.amount,
      magnet: baseStats.magnet,
      luck: baseStats.luck,
      growth: baseStats.growth,
      greed: baseStats.greed,
      curse: baseStats.curse,
      revivals: baseStats.revivals,
    },
    damageEvents: [],
    xpGems: [],
    upgrades: [],
    upgradePool: createUpgradePool(),
    draftChoice: null,

    particles: [],
    particlesPool,
    screenShake: initScreenShake(),

    powerUps: [],
    flamethrowerTime: 0,

    damageNumbers: [],
    damageNumbersPool,
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


  const playerPos = state.player.pos;
  const targetDir = getPlayerFacingDirection(state.player, state.enemies);

  // Update weapons and spawn projectiles
  const { newProjectiles, rng: weaponsRng } = stepWeapons(
    state.dt,
    state.weapons,
    currentRng,
    state.projectilesPool,
    playerPos,
    targetDir,
    state.flamethrowerTime > 0, // Has flamethrower buff
    state.player, // Character stats
    state.upgrades // Upgrades for projectile speed/size
  );
  currentRng = weaponsRng;

  // Add new projectiles to active list
  state.projectiles.push(...newProjectiles);

  // Update existing projectiles
  stepProjectiles(state.dt, state.projectiles, state.projectilesPool);

  // Spawn enemies based on wave progression
  const minute = getMinute(state.time);
  const luckUpgrade = state.upgrades.find((u) => u.type === 'luck');
  const luckUpgradeBonus = luckUpgrade ? (luckUpgrade.value * luckUpgrade.currentLevel) : 0;
  const {
    newEnemies,
    newAccumulator,
    rng: spawnRng,
  } = stepSpawns(state.dt, state.spawnAccumulator, currentRng, minute, playerPos, state.player.luck, luckUpgradeBonus);
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

    // Check for power-up spawns from elite kills
    currentRng = checkPowerUpSpawns(state, killedEnemies);
  }

  // Update power-ups (lifetime decay)
  stepPowerUps(state.powerUps, state.dt);

  // Collect power-ups
  collectPowerUps(state);

  // Update flamethrower buff
  updateFlamethrower(state, state.dt);

  // Update XP system (magnet, collection, level-up)
  const leveledUp = stepXP(state);


  // Update particles
  stepParticles(state.particles, state.dt, state.particlesPool);

  // Update damage numbers
  stepDamageNumbers(state.damageNumbers, state.dt, state.damageNumbersPool);

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

    powerUps: state.powerUps, // Reference same array (modified in-place)
    flamethrowerTime: state.flamethrowerTime, // Updated flamethrower time
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
