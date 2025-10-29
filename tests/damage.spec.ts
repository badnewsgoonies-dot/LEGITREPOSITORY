/**
 * Tests for damage system and player i-frames
 */

import { describe, it, expect } from 'vitest';
import { initWorld, updateWorld } from '../src/state/world';
import { updateIframes, resolveCollisions } from '../src/systems/collision';
import type { Enemy, Player } from '../src/types';

describe('Damage System', () => {
  describe('Player i-frames', () => {
    it('should initialize player with zero i-frames', () => {
      const world = initWorld(42);

      expect(world.player.iframes).toBe(0);
      expect(world.player.iframeDuration).toBe(1.0);
    });

    it('should decrement i-frames over time', () => {
      const world = initWorld(42);
      world.player.iframes = 1.0;

      updateIframes(world.player, 0.5);

      expect(world.player.iframes).toBe(0.5);
    });

    it('should clamp i-frames at zero', () => {
      const world = initWorld(42);
      world.player.iframes = 0.1;

      updateIframes(world.player, 0.2);

      expect(world.player.iframes).toBe(0);
    });

    it('should not go negative', () => {
      const world = initWorld(42);
      world.player.iframes = 0;

      updateIframes(world.player, 1.0);

      expect(world.player.iframes).toBe(0);
    });

    it('should activate i-frames after taking damage', () => {
      const world = initWorld(42);
      world.player.iframes = 0;

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 400, y: 300 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 5,
        },
      ];

      resolveCollisions(world, contacts);

      expect(world.player.iframes).toBe(1.0); // Should activate
      expect(world.player.hp).toBe(95); // 100 - 5
    });
  });

  describe('Damage application', () => {
    it('should damage player when i-frames are inactive', () => {
      const world = initWorld(42);
      world.player.iframes = 0;
      world.player.hp = 100;

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 10,
        },
      ];

      resolveCollisions(world, contacts);

      expect(world.player.hp).toBe(90);
    });

    it('should NOT damage player when i-frames are active', () => {
      const world = initWorld(42);
      world.player.iframes = 0.5; // Active i-frames
      world.player.hp = 100;

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 10,
        },
      ];

      resolveCollisions(world, contacts);

      expect(world.player.hp).toBe(100); // No damage taken
      expect(world.player.iframes).toBe(0.5); // i-frames unchanged
    });

    it('should take exactly 0 damage with active i-frames', () => {
      const world = initWorld(42);
      world.player.iframes = 1.0;
      const initialHp = world.player.hp;

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 50, // Large damage
        },
      ];

      resolveCollisions(world, contacts);

      const damageTaken = initialHp - world.player.hp;
      expect(damageTaken).toBe(0);
    });

    it('should allow damage after i-frames expire', () => {
      const world = initWorld(42);

      // Take first hit
      world.player.iframes = 0;
      let contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 10,
        },
      ];
      resolveCollisions(world, contacts);
      expect(world.player.hp).toBe(90);
      expect(world.player.iframes).toBe(1.0);

      // Try immediate second hit (should be blocked)
      contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_1',
          entityB: 'player',
          damage: 10,
        },
      ];
      resolveCollisions(world, contacts);
      expect(world.player.hp).toBe(90); // No change

      // Expire i-frames
      updateIframes(world.player, 1.5);
      expect(world.player.iframes).toBe(0);

      // Take third hit (should work)
      contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_2',
          entityB: 'player',
          damage: 10,
        },
      ];
      resolveCollisions(world, contacts);
      expect(world.player.hp).toBe(80);
    });

    it('should apply knockback to player', () => {
      const world = initWorld(42);
      world.player.pos = { x: 400, y: 300 };
      world.player.iframes = 0;

      const initialX = world.player.pos.x;

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 10,
          knockback: { x: 100, y: 0 },
        },
      ];

      resolveCollisions(world, contacts);

      // Knockback is applied with dt scaling
      expect(world.player.pos.x).toBeGreaterThan(initialX);
    });

    it('should not apply knockback during i-frames', () => {
      const world = initWorld(42);
      world.player.pos = { x: 400, y: 300 };
      world.player.iframes = 1.0; // Active i-frames

      const initialX = world.player.pos.x;

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 10,
          knockback: { x: 100, y: 0 },
        },
      ];

      resolveCollisions(world, contacts);

      // No knockback during i-frames
      expect(world.player.pos.x).toBe(initialX);
    });

    it('should damage enemies regardless of player i-frames', () => {
      const world = initWorld(42);
      world.player.iframes = 1.0; // Player has i-frames

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 100, y: 100 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = [
        {
          type: 'projectile-enemy' as const,
          entityA: 'projectile_0',
          entityB: 'enemy_0',
          damage: 10,
        },
      ];

      resolveCollisions(world, contacts);

      // Enemy damage is not affected by player i-frames
      expect(enemy.hp).toBe(10);
    });
  });

  describe('Damage events', () => {
    it('should generate damage event for player', () => {
      const world = initWorld(42);
      world.player.iframes = 0;

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 10,
        },
      ];

      const events = resolveCollisions(world, contacts);

      expect(events.length).toBe(1);
      expect(events[0].targetId).toBe('player');
      expect(events[0].damage).toBe(10);
      expect(events[0].source).toBe('enemy');
      expect(events[0].frame).toBe(0);
    });

    it('should not generate event for blocked damage', () => {
      const world = initWorld(42);
      world.player.iframes = 1.0; // Active i-frames

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 10,
        },
      ];

      const events = resolveCollisions(world, contacts);

      expect(events.length).toBe(0); // No event for blocked damage
    });

    it('should include frame number in damage events', () => {
      const world = initWorld(42);
      world.frameCount = 120; // Simulate some frames
      world.player.iframes = 0;

      const contacts = [
        {
          type: 'enemy-player' as const,
          entityA: 'enemy_0',
          entityB: 'player',
          damage: 5,
        },
      ];

      const events = resolveCollisions(world, contacts);

      expect(events[0].frame).toBe(120);
    });
  });

  describe('Integration with world update', () => {
    it('should update i-frames during world step', () => {
      const world = initWorld(42);
      world.player.iframes = 1.0;

      // Run several frames
      for (let i = 0; i < 60; i++) {
        // 1 second at 60fps
        updateWorld(world);
      }

      // I-frames should have expired
      expect(world.player.iframes).toBeLessThan(0.1);
    });

    it('should accumulate damage events', () => {
      const world = initWorld(42);
      world.player.iframes = 0;
      world.player.pos = { x: 400, y: 300 };

      // Add enemy at player position
      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 400, y: 300 },
        hp: 100,
        maxHp: 100,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      // First frame - should take damage
      updateWorld(world);
      expect(world.damageEvents.length).toBeGreaterThanOrEqual(1);
      expect(world.player.hp).toBeLessThan(100);

      // Second frame - should not take damage (i-frames active)
      const hpAfterFirst = world.player.hp;
      updateWorld(world);
      expect(world.player.hp).toBe(hpAfterFirst); // No additional damage
    });

    it('should handle multiple enemies damaging player', () => {
      const world = initWorld(42, false); // No default weapon to avoid extra damage events
      world.player.iframes = 0;
      world.player.pos = { x: 400, y: 300 };

      // Add multiple enemies at player position
      for (let i = 0; i < 3; i++) {
        const enemy: Enemy = {
          id: `enemy_${i}`,
          kind: 'zombie',
          pos: { x: 400, y: 300 },
          hp: 100,
          maxHp: 100,
          speed: 50,
          touchDamage: 5,
          isElite: false,
          radius: 8,
        };
        world.enemies.push(enemy);
      }

      updateWorld(world);

      // Should only take damage once (i-frames activate after first hit)
      expect(world.player.hp).toBe(95); // 100 - 5
      expect(world.damageEvents.length).toBe(1);
    });
  });
});
