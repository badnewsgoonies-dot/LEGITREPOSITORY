/**
 * Input System - deterministic input recording for replay
 *
 * Features:
 * - WASD movement
 * - Deterministic recording for replay
 * - No direct DOM coupling in game logic
 */

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
}

let currentInput: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  pause: false,
};

/**
 * Initialize input listeners (call once on app start)
 */
export function initInput(): void {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

/**
 * Cleanup input listeners
 */
export function cleanupInput(): void {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e: KeyboardEvent): void {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      currentInput.up = true;
      break;
    case 's':
    case 'arrowdown':
      currentInput.down = true;
      break;
    case 'a':
    case 'arrowleft':
      currentInput.left = true;
      break;
    case 'd':
    case 'arrowright':
      currentInput.right = true;
      break;
    case 'escape':
    case 'p':
      currentInput.pause = true;
      break;
  }
}

function handleKeyUp(e: KeyboardEvent): void {
  switch (e.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      currentInput.up = false;
      break;
    case 's':
    case 'arrowdown':
      currentInput.down = false;
      break;
    case 'a':
    case 'arrowleft':
      currentInput.left = false;
      break;
    case 'd':
    case 'arrowright':
      currentInput.right = false;
      break;
    case 'escape':
    case 'p':
      currentInput.pause = false;
      break;
  }
}

/**
 * Get current input state (called from game loop)
 */
export function getInput(): InputState {
  return { ...currentInput };
}

/**
 * Set input state (for replay)
 */
export function setInput(state: InputState): void {
  currentInput = { ...state };
}
