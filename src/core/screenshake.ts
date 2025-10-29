/**
 * Screen Shake System - trauma-based camera shake
 *
 * Features:
 * - Trauma-based system (more trauma = more shake)
 * - Automatic decay over time
 * - Smooth camera offset calculation
 */

export interface ScreenShake {
  trauma: number; // 0.0 to 1.0
  offsetX: number; // current camera offset X
  offsetY: number; // current camera offset Y
}

// Constants
const TRAUMA_DECAY_RATE = 1.5; // trauma per second
const MAX_SHAKE_OFFSET = 20; // maximum pixel offset

/**
 * Initialize screen shake state
 */
export function initScreenShake(): ScreenShake {
  return {
    trauma: 0,
    offsetX: 0,
    offsetY: 0,
  };
}

/**
 * Add trauma to screen shake (clamped to 1.0)
 */
export function addTrauma(shake: ScreenShake, amount: number): void {
  shake.trauma = Math.min(1.0, shake.trauma + amount);
}

/**
 * Update screen shake (decay trauma and calculate new offset)
 */
export function updateScreenShake(shake: ScreenShake, dt: number): void {
  // Decay trauma
  shake.trauma = Math.max(0, shake.trauma - TRAUMA_DECAY_RATE * dt);

  // Calculate shake based on trauma squared (more dramatic)
  const shakeIntensity = shake.trauma * shake.trauma;

  // Random offset based on intensity
  if (shakeIntensity > 0) {
    shake.offsetX = (Math.random() * 2 - 1) * MAX_SHAKE_OFFSET * shakeIntensity;
    shake.offsetY = (Math.random() * 2 - 1) * MAX_SHAKE_OFFSET * shakeIntensity;
  } else {
    shake.offsetX = 0;
    shake.offsetY = 0;
  }
}

/**
 * Apply screen shake to canvas context (call before rendering)
 */
export function applyScreenShake(ctx: CanvasRenderingContext2D, shake: ScreenShake): void {
  ctx.save();
  ctx.translate(shake.offsetX, shake.offsetY);
}

/**
 * Restore canvas context after rendering with shake
 */
export function restoreScreenShake(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}
