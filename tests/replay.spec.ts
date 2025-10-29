/**
 * Tests for replay and determinism verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  beginRun,
  log,
  endRun,
  hashState,
  exportRunLog,
  importRunLog,
  verifyRunLog,
  getCurrentSession,
} from '../src/core/replay';
import { stepSync } from '../src/core/loop';
import { initWorld, updateWorld } from '../src/state/world';
import type { GameEvent } from '../src/types';

describe('Replay System', () => {
  beforeEach(() => {
    // Clean up any existing session
    if (getCurrentSession()) {
      try {
        endRun(initWorld(0));
      } catch {
        // Ignore
      }
    }
  });

  describe('Session Management', () => {
    it('should begin and end a session', () => {
      beginRun(42);
      expect(getCurrentSession()).not.toBeNull();
      expect(getCurrentSession()?.seed).toBe(42);

      const finalState = initWorld(42);
      const runLog = endRun(finalState);

      expect(runLog.seed).toBe(42);
      expect(getCurrentSession()).toBeNull();
    });

    it('should log events during session', () => {
      beginRun(123);

      const event: GameEvent = {
        type: 'custom',
        frame: 10,
        name: 'test',
        data: { value: 42 },
      };
      log(event);

      const runLog = endRun(initWorld(123));
      expect(runLog.events).toHaveLength(1);
      expect(runLog.events[0]).toEqual(event);
    });

    it('should warn when logging without active session', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      log({ type: 'custom', frame: 0, name: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No active replay session')
      );
      consoleSpy.mockRestore();
    });

    it('should throw when ending without active session', () => {
      expect(() => endRun(initWorld(0))).toThrow('No active replay session');
    });
  });

  describe('State Hashing', () => {
    it('should produce consistent hashes for same state', () => {
      const state = initWorld(42);
      const hash1 = hashState(state);
      const hash2 = hashState(state);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8); // 8 hex chars
    });

    it('should produce different hashes for different states', () => {
      const state1 = initWorld(42);
      const state2 = initWorld(999);

      const hash1 = hashState(state1);
      const hash2 = hashState(state2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes after updates', () => {
      const state1 = initWorld(42);
      const state2 = updateWorld(state1);

      const hash1 = hashState(state1);
      const hash2 = hashState(state2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Determinism Verification', () => {
    it('should verify deterministic replay with same seed', () => {
      const seed = 12345;

      // Run 1: Record
      beginRun(seed);
      let state1 = initWorld(seed);
      for (let i = 0; i < 60; i++) {
        state1 = updateWorld(state1);
        if (i % 10 === 0) {
          log({ type: 'custom', frame: i, name: 'tick' });
        }
      }
      const runLog = endRun(state1);

      // Run 2: Replay
      let state2 = initWorld(seed);
      for (let i = 0; i < 60; i++) {
        state2 = updateWorld(state2);
      }

      // Verify
      const verified = verifyRunLog(runLog, state2);
      expect(verified).toBe(true);
      expect(hashState(state2)).toBe(runLog.finalHash);
    });

    it('should fail verification with different seed', () => {
      beginRun(111);
      const state1 = stepSync(initWorld(111), updateWorld, 30);
      const runLog = endRun(state1);

      const state2 = stepSync(initWorld(222), updateWorld, 30);

      const verified = verifyRunLog(runLog, state2);
      expect(verified).toBe(false);
    });

    it('should fail verification with different step count', () => {
      beginRun(333);
      const state1 = stepSync(initWorld(333), updateWorld, 30);
      const runLog = endRun(state1);

      const state2 = stepSync(initWorld(333), updateWorld, 31);

      const verified = verifyRunLog(runLog, state2);
      expect(verified).toBe(false);
    });
  });

  describe('Import/Export', () => {
    it('should export and import run log', () => {
      beginRun(777);
      log({ type: 'input', frame: 0, action: 'move', data: { x: 10, y: 20 } });
      log({ type: 'spawn', frame: 10, entityId: 'enemy_1', position: { x: 100, y: 100 } });

      const state = stepSync(initWorld(777), updateWorld, 120);
      const original = endRun(state);

      // Export to JSON
      const json = exportRunLog(original);
      expect(json).toContain('"seed": 777');

      // Import back
      const imported = importRunLog(json);

      expect(imported.seed).toBe(original.seed);
      expect(imported.events).toEqual(original.events);
      expect(imported.finalHash).toBe(original.finalHash);
      expect(imported.frameCount).toBe(original.frameCount);
    });

    it('should throw on invalid JSON format', () => {
      expect(() => importRunLog('{"invalid": true}')).toThrow('Invalid RunLog format');
      expect(() => importRunLog('not json')).toThrow();
    });
  });

  describe('Complete Replay Flow', () => {
    it('should demonstrate full deterministic replay', () => {
      const seed = 99999;

      // === Original Run ===
      beginRun(seed);
      let originalState = initWorld(seed);

      // Simulate some gameplay
      const syntheticInputs = [
        { frame: 10, action: 'move_right' },
        { frame: 20, action: 'shoot' },
        { frame: 30, action: 'move_left' },
      ];

      for (let frame = 0; frame < 60; frame++) {
        originalState = updateWorld(originalState);

        // Log synthetic inputs
        const input = syntheticInputs.find((i) => i.frame === frame);
        if (input) {
          log({
            type: 'input',
            frame,
            action: input.action,
          });
        }
      }

      const originalLog = endRun(originalState);

      // === Replay Run ===
      let replayState = initWorld(seed);

      // Apply same inputs at same frames
      for (let frame = 0; frame < 60; frame++) {
        replayState = updateWorld(replayState);
        // In a real game, we'd apply inputs from originalLog.events here
      }

      // === Verification ===
      expect(replayState.frameCount).toBe(originalState.frameCount);
      expect(replayState.time).toBeCloseTo(originalState.time, 10);

      const replayHash = hashState(replayState);
      expect(replayHash).toBe(originalLog.finalHash);
      expect(verifyRunLog(originalLog, replayState)).toBe(true);

      // Export should be valid JSON
      const json = exportRunLog(originalLog);
      const reimported = importRunLog(json);
      expect(reimported).toEqual(originalLog);
    });
  });
});
