/**
 * S1: Core Loop & Deterministic RNG
 * Replay logging system for determinism verification
 * Logs seed, inputs, and choices to reproduce runs
 */

export interface ReplayEvent {
  frame: number;
  type: 'input' | 'choice' | 'spawn' | 'hit' | 'levelup';
  data: unknown;
}

export interface ReplayLog {
  seed: number;
  events: ReplayEvent[];
  finalHash: string;
  version: string;
}

let currentLog: ReplayLog | null = null;
let frameCounter = 0;

/**
 * Start recording a replay
 */
export function startRecording(seed: number): void {
  currentLog = {
    seed,
    events: [],
    finalHash: '',
    version: '1.0.0',
  };
  frameCounter = 0;
}

/**
 * Log an event
 */
export function logEvent(type: ReplayEvent['type'], data: unknown): void {
  if (!currentLog) return;

  currentLog.events.push({
    frame: frameCounter,
    type,
    data,
  });
}

/**
 * Increment frame counter
 */
export function tickFrame(): void {
  frameCounter++;
}

/**
 * Finalize recording with state hash
 */
export function finishRecording(stateHash: string): ReplayLog {
  if (!currentLog) {
    throw new Error('No recording in progress');
  }

  currentLog.finalHash = stateHash;
  const log = currentLog;
  currentLog = null;
  frameCounter = 0;

  return log;
}

/**
 * Simple hash function for state verification
 */
export function hashState(state: unknown): string {
  const str = JSON.stringify(state);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Export replay to JSON
 */
export function exportReplay(log: ReplayLog): string {
  return JSON.stringify(log, null, 2);
}

/**
 * Import replay from JSON
 */
export function importReplay(json: string): ReplayLog {
  return JSON.parse(json);
}
