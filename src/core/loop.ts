/**
 * Fixed-timestep game loop with requestAnimationFrame
 *
 * Implements:
 * - Fixed 60Hz update rate (16.666ms per frame)
 * - Frame delta clamping (max 50ms to prevent spiral of death)
 * - Accumulator pattern for deterministic physics
 * - Interpolation alpha for smooth rendering
 *
 * Reference: "Fix Your Timestep!" by Glenn Fiedler
 * https://gafferongames.com/post/fix_your_timestep/
 */

import type { GameLoopConfig, GameLoopHandle, WorldState } from '../types';

const DEFAULT_TARGET_FPS = 60;
const DEFAULT_MAX_FRAME_DELTA = 50; // milliseconds

export const STEP_MS = 1000 / DEFAULT_TARGET_FPS; // ~16.666ms
export const STEP_SEC = STEP_MS / 1000; // ~0.01666s

/**
 * Start the fixed-timestep game loop.
 *
 * @param initialState - Starting world state
 * @param config - Loop configuration
 * @returns Handle to control the loop
 */
export function start(
  initialState: WorldState,
  config: GameLoopConfig
): GameLoopHandle {
  const {
    targetFPS = DEFAULT_TARGET_FPS,
    maxFrameDelta = DEFAULT_MAX_FRAME_DELTA,
    onUpdate,
    onRender,
  } = config;

  const stepMs = 1000 / targetFPS;
  const maxDelta = maxFrameDelta;

  let currentState = initialState;
  let accumulator = 0;
  let lastTime = performance.now();
  let rafId: number | null = null;
  let running = true;

  function tick(currentTime: number) {
    if (!running) return;

    // Calculate frame delta and clamp
    let delta = currentTime - lastTime;
    if (delta > maxDelta) {
      delta = maxDelta; // Prevent spiral of death
    }
    lastTime = currentTime;

    accumulator += delta;

    // Fixed-step updates
    while (accumulator >= stepMs) {
      if (!currentState.isPaused) {
        currentState = onUpdate(currentState);
      }
      accumulator -= stepMs;
    }

    // Render with interpolation alpha
    if (onRender) {
      const alpha = accumulator / stepMs;
      onRender(currentState, alpha);
    }

    rafId = requestAnimationFrame(tick);
  }

  // Start the loop
  rafId = requestAnimationFrame(tick);

  // Return control handle
  return {
    stop: () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    getState: () => currentState,
    pause: () => {
      currentState = { ...currentState, isPaused: true };
    },
    resume: () => {
      currentState = { ...currentState, isPaused: false };
      lastTime = performance.now(); // Reset time to prevent large delta
      accumulator = 0;
    },
  };
}

/**
 * Create a testable synchronous loop for unit tests.
 * Steps the game forward by a specific number of ticks.
 *
 * @param initialState - Starting world state
 * @param onUpdate - Update function
 * @param ticks - Number of fixed-step ticks to run
 * @returns Final state after ticks
 */
export function stepSync(
  initialState: WorldState,
  onUpdate: (state: WorldState) => WorldState,
  ticks: number
): WorldState {
  let state = initialState;
  for (let i = 0; i < ticks; i++) {
    if (!state.isPaused) {
      state = onUpdate(state);
    }
  }
  return state;
}

/**
 * Utility to calculate FPS from frame times.
 * @param frameTimes - Array of frame durations in ms
 * @returns { avg, min, max, p95, p99 }
 */
export function calculateFPSStats(frameTimes: number[]) {
  if (frameTimes.length === 0) {
    return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
  }

  const sorted = [...frameTimes].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  const p95 = sorted[p95Index];
  const p99 = sorted[p99Index];

  return { avg, min, max, p95, p99 };
}
