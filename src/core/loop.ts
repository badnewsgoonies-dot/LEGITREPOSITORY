/**
 * S1: Core Loop & Deterministic RNG
 * Fixed-timestep game loop using requestAnimationFrame
 * Clamps long frames to prevent spiral of death
 */

const STEP_MS = 1000 / 60; // 60 FPS
const MAX_FRAME_MS = 50; // Clamp long frames

let lastTime = 0;
let accumulator = 0;
let isRunning = false;

// Callback for game update
let updateCallback: ((dt: number) => void) | null = null;

/**
 * Set the update callback that will be called each fixed timestep
 */
export function setUpdateCallback(cb: (dt: number) => void): void {
  updateCallback = cb;
}

/**
 * Main game loop - called by requestAnimationFrame
 */
export function frame(now: number): void {
  if (!isRunning) return;

  const deltaTime = Math.min(MAX_FRAME_MS, now - lastTime);
  lastTime = now;
  accumulator += deltaTime;

  // Fixed timestep updates
  while (accumulator >= STEP_MS) {
    if (updateCallback) {
      updateCallback(STEP_MS / 1000); // Convert to seconds
    }
    accumulator -= STEP_MS;
  }

  // Continue loop
  requestAnimationFrame(frame);
}

/**
 * Start the game loop
 */
export function start(): void {
  if (isRunning) return;

  isRunning = true;
  lastTime = performance.now();
  accumulator = 0;
  requestAnimationFrame(frame);
}

/**
 * Stop the game loop
 */
export function stop(): void {
  isRunning = false;
}

/**
 * Check if loop is running
 */
export function running(): boolean {
  return isRunning;
}

/**
 * Reset loop state (for testing)
 */
export function reset(): void {
  stop();
  lastTime = 0;
  accumulator = 0;
  updateCallback = null;
}
