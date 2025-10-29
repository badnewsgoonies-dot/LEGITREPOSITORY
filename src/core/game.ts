/**
 * Main game engine - orchestrates all systems
 * Pure logic, no rendering
 */

import type { RNG } from './rng';
import { mkRng } from './rng';
import type { GameState, InputState, UpgradeCard } from '../types/game';
import { createPlayer } from '../systems/player';
import { stepPlayer } from '../systems/player';
import { stepWeapons, stepProjectiles } from '../systems/weapons';
import { stepSpawns, stepEnemies, createSpawnState } from '../systems/spawn';
import { resolveCollisions } from '../systems/collision';
import { stepPickups, collectXP, createXPPickup } from '../systems/xp';
import { rollDraft, applyUpgrade, createStarterWeapon } from '../systems/draft';
import { logEvent, tickFrame } from './replay';

export interface GameEngine {
  state: GameState;
  rng: RNG;
  input: InputState;
  draftCards: UpgradeCard[] | null;
  spawnState: ReturnType<typeof createSpawnState>;
  kills: number;
}

/**
 * Create new game engine with seed
 */
export function createGame(seed: number): GameEngine {
  const player = createPlayer();
  player.weapons.push(createStarterWeapon());

  return {
    state: {
      player,
      enemies: [],
      projectiles: [],
      pickups: [],
      time: 0,
      frame: 0,
      paused: false,
      gameOver: false,
      won: false,
    },
    rng: mkRng(seed),
    input: {
      up: false,
      down: false,
      left: false,
      right: false,
      pause: false,
    },
    draftCards: null,
    spawnState: createSpawnState(),
    kills: 0,
  };
}

/**
 * Update game state by one timestep
 */
export function updateGame(engine: GameEngine, dt: number): void {
  const { state, input } = engine;

  // Skip update if paused, game over, or in draft
  if (state.paused || state.gameOver || engine.draftCards) {
    return;
  }

  // Update time
  state.time += dt;
  state.frame += 1;
  tickFrame();

  // Check win condition (20 minutes)
  if (state.time >= 1200) {
    state.gameOver = true;
    state.won = true;
    return;
  }

  // S2: Update player
  state.player = stepPlayer(input, dt, state.player);

  // S3: Update weapons and projectiles
  const weaponResult = stepWeapons(dt, engine.rng, state.player, state.enemies);
  engine.rng = weaponResult.rng;
  state.projectiles.push(...weaponResult.projectiles);

  state.projectiles = stepProjectiles(dt, state.projectiles);

  // S4: Spawn enemies
  const spawnResult = stepSpawns(
    dt,
    engine.rng,
    state.time,
    state.player,
    engine.spawnState
  );
  engine.rng = spawnResult.rng;
  state.enemies.push(...spawnResult.enemies);

  // Update enemy movement
  stepEnemies(dt, state.enemies, state.player);

  // S6: Update pickups (magnet)
  stepPickups(dt, state.pickups, state.player);

  // S5: Resolve collisions
  const collisionResult = resolveCollisions(
    state.player,
    state.enemies,
    state.projectiles,
    state.pickups
  );

  state.player = collisionResult.player;
  state.enemies = collisionResult.enemies;
  state.projectiles = collisionResult.projectiles;

  // Handle collision events
  for (const event of collisionResult.events) {
    if (event.type === 'enemy_hit') {
      // Check if enemy died
      const enemy = state.enemies.find((e) => e.id === event.entityId);
      if (!enemy) {
        // Enemy died, spawn XP
        // Find in original list before removal
        for (const e of state.enemies) {
          if (e.id === event.entityId && e.hp <= 0) {
            const [pickup, r2] = createXPPickup(e, engine.rng);
            engine.rng = r2;
            state.pickups.push(pickup);
            engine.kills += 1;
            break;
          }
        }
      }
    } else if (event.type === 'pickup_collected') {
      const pickup = collisionResult.pickups.find((p) => p.id === event.entityId);
      if (!pickup) {
        // Pickup was collected
        const collected = state.pickups.find((p) => p.id === event.entityId);
        if (collected && collected.pickupType === 'xp') {
          const xpResult = collectXP(state.player, collected);
          state.player = xpResult.player;

          if (xpResult.leveledUp) {
            // Trigger draft
            const [cards, r2] = rollDraft(engine.rng, []);
            engine.rng = r2;
            engine.draftCards = cards.length > 0 ? cards : null;

            // Pause game during draft
            if (engine.draftCards) {
              logEvent('levelup', { level: state.player.level });
            }
          }
        }
      }
    }
  }

  state.pickups = collisionResult.pickups;

  // Check game over
  if (state.player.hp <= 0) {
    state.gameOver = true;
    state.won = false;
  }
}

/**
 * Select draft card
 */
export function selectDraftCard(engine: GameEngine, card: UpgradeCard): void {
  if (!engine.draftCards) return;

  engine.state.player = applyUpgrade(engine.state.player, card);
  engine.draftCards = null;

  logEvent('choice', { card: card.id });
}

/**
 * Toggle pause
 */
export function togglePause(engine: GameEngine): void {
  engine.state.paused = !engine.state.paused;
}

/**
 * Reset game
 */
export function resetGame(engine: GameEngine, seed: number): void {
  const newEngine = createGame(seed);
  engine.state = newEngine.state;
  engine.rng = newEngine.rng;
  engine.input = newEngine.input;
  engine.draftCards = null;
  engine.spawnState = newEngine.spawnState;
  engine.kills = 0;
}
