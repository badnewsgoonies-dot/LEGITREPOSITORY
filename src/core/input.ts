/**
 * Input System - deterministic input recording for replay
 *
 * Features:
 * - WASD movement
 * - Mouse aiming
 * - Deterministic recording for replay
 * - No direct DOM coupling in game logic
 */

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
  mouseX: number; // Mouse position in canvas coordinates
  mouseY: number;
}

let currentInput: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  pause: false,
  mouseX: 400, // Center of 800x600 canvas
  mouseY: 300,
};

let canvasElement: HTMLCanvasElement | null = null;

/**
 * Initialize input listeners (call once on app start)
 */
export function initInput(canvas?: HTMLCanvasElement): void {
  if (canvas) {
    // Remove listener from previous canvas if different
    if (canvasElement && canvasElement !== canvas) {
      canvasElement.removeEventListener('mousemove', handleMouseMove);
    }
    canvasElement = canvas;
    canvas.addEventListener('mousemove', handleMouseMove);
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

/**
 * Cleanup input listeners
 */
export function cleanupInput(): void {
  if (canvasElement) {
    canvasElement.removeEventListener('mousemove', handleMouseMove);
  }
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
}

function handleMouseMove(e: MouseEvent): void {
  if (!canvasElement) return;

  const rect = canvasElement.getBoundingClientRect();
  currentInput.mouseX = e.clientX - rect.left;
  currentInput.mouseY = e.clientY - rect.top;
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
