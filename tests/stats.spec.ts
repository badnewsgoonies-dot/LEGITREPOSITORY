/**
 * Tests for S7: Stats & Scaling
 */

import { describe, it, expect } from 'vitest';
import { scaleEnemyStats, damageReduction, effectiveCooldown } from '../src/systems/stats';

describe('Stats Scaling', () => {
  it('should scale enemy stats by minute', () => {
    const base = scaleEnemyStats('bat', 0);
    const scaled = scaleEnemyStats('bat', 10);

    expect(scaled.hp).toBeGreaterThan(base.hp);
    expect(scaled.damage).toBeGreaterThan(base.damage);
  });

  it('should calculate damage reduction from armor', () => {
    expect(damageReduction(0)).toBe(0);
    expect(damageReduction(2)).toBeCloseTo(0.5, 2);
    expect(damageReduction(4)).toBeCloseTo(0.667, 2);
  });

  it('should calculate effective cooldown with haste', () => {
    expect(effectiveCooldown(1.0, 0)).toBe(1.0);
    expect(effectiveCooldown(1.0, 0.1)).toBeCloseTo(0.909, 2);
    expect(effectiveCooldown(1.0, 1.0)).toBeCloseTo(0.5, 2);
  });
});
