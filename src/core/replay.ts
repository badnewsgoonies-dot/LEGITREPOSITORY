/**
 * Replay system for deterministic game recordings
 *
 * Records:
 * - Initial seed
 * - All game events (inputs, spawns, damage, etc.)
 * - Final state hash for verification
 *
 * Allows:
 * - Reproduce exact runs for debugging
 * - Verify determinism (same inputs → same output)
 * - Share runs / replays
 */

import type { GameEvent, RunLog, WorldState } from '../types';

/**
 * Active replay session state
 */
interface ReplaySession {
  seed: number;
  events: GameEvent[];
  startTime: number;
}

let currentSession: ReplaySession | null = null;

/**
 * Start a new replay recording session.
 * @param seed - Initial RNG seed
 */
export function beginRun(seed: number): void {
  currentSession = {
    seed,
    events: [],
    startTime: performance.now(),
  };
}

/**
 * Log a game event to the current session.
 * @param event - Event to record
 */
export function log(event: GameEvent): void {
  if (!currentSession) {
    console.warn('No active replay session. Call beginRun() first.');
    return;
  }
  currentSession.events.push(event);
}

/**
 * End the current session and generate final RunLog.
 * @param finalState - Final world state for hash generation
 * @returns Complete run log with hash
 */
export function endRun(finalState: WorldState): RunLog {
  if (!currentSession) {
    throw new Error('No active replay session to end.');
  }

  const hash = hashState(finalState);
  const runLog: RunLog = {
    seed: currentSession.seed,
    events: currentSession.events,
    finalHash: hash,
    frameCount: finalState.frameCount,
    timestamp: currentSession.startTime,
  };

  currentSession = null;
  return runLog;
}

/**
 * Generate a deterministic hash of the world state.
 * Uses a simple but stable string representation.
 *
 * NOTE: For production, consider using a proper hashing library
 * like crypto.subtle or a WASM hash function.
 *
 * @param state - World state to hash
 * @returns Hash string
 */
export function hashState(state: WorldState): string {
  // Create a stable string representation
  const repr = JSON.stringify({
    seed: state.seed,
    time: state.time.toFixed(6),
    frameCount: state.frameCount,
    // Don't include RNG generator state as it's internal
  });

  // Simple DJB2 hash
  let hash = 5381;
  for (let i = 0; i < repr.length; i++) {
    hash = (hash * 33) ^ repr.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Export run log to JSON string.
 * @param runLog - Run log to export
 * @returns JSON string
 */
export function exportRunLog(runLog: RunLog): string {
  return JSON.stringify(runLog, null, 2);
}

/**
 * Import run log from JSON string.
 * @param json - JSON string
 * @returns Parsed run log
 */
export function importRunLog(json: string): RunLog {
  const parsed = JSON.parse(json);

  // Basic validation
  if (
    typeof parsed.seed !== 'number' ||
    !Array.isArray(parsed.events) ||
    typeof parsed.finalHash !== 'string' ||
    typeof parsed.frameCount !== 'number'
  ) {
    throw new Error('Invalid RunLog format');
  }

  return parsed as RunLog;
}

/**
 * Verify that a run log matches expected hash.
 * Useful for detecting desync or non-determinism.
 *
 * @param runLog - Run log to verify
 * @param replayState - State from replaying the log
 * @returns true if hashes match
 */
export function verifyRunLog(runLog: RunLog, replayState: WorldState): boolean {
  const replayHash = hashState(replayState);
  return runLog.finalHash === replayHash;
}

/**
 * Get current session info (for debugging).
 * @returns Current session or null
 */
export function getCurrentSession(): ReplaySession | null {
  return currentSession;
}
