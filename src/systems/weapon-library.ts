/**
 * Weapon Library - Definitions for all weapon types
 *
 * Based on Vampire Survivors weapon mechanics
 */

import type { Weapon, WeaponBehavior } from '../types';

export interface WeaponDefinition {
  id: string;
  name: string;
  behavior: WeaponBehavior;
  baseDamage: number;
  baseCooldown: number;
  baseSpeed: number;
  baseCount: number;
  spreadAngle: number;
  ttl: number;
  maxLevel: number;
  description: string;
  // Special properties
  auraRadius?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  meleeArc?: number;
  meleeRange?: number;
  chainCount?: number;
  chainRange?: number;
}

export const WEAPON_DEFINITIONS: Record<string, WeaponDefinition> = {
  magic_wand: {
    id: 'magic_wand',
    name: 'Magic Wand',
    behavior: 'projectile',
    baseDamage: 10,
    baseCooldown: 0.8,
    baseSpeed: 300,
    baseCount: 1,
    spreadAngle: 0,
    ttl: 2.0,
    maxLevel: 8,
    description: 'Fires magic projectiles toward nearest enemy',
  },

  knife: {
    id: 'knife',
    name: 'Knife',
    behavior: 'projectile',
    baseDamage: 8,
    baseCooldown: 0.5,
    baseSpeed: 400,
    baseCount: 1,
    spreadAngle: 0,
    ttl: 1.5,
    maxLevel: 8,
    description: 'Fast-firing projectile weapon',
  },

  axe: {
    id: 'axe',
    name: 'Axe',
    behavior: 'boomerang',
    baseDamage: 20,
    baseCooldown: 2.0,
    baseSpeed: 250,
    baseCount: 1,
    spreadAngle: 0,
    ttl: 4.0,
    maxLevel: 8,
    description: 'Thrown axe that returns to you, can hit multiple times',
  },

  garlic: {
    id: 'garlic',
    name: 'Garlic',
    behavior: 'aura',
    baseDamage: 3,
    baseCooldown: 0.3,
    baseSpeed: 0,
    baseCount: 0,
    spreadAngle: 0,
    ttl: 0,
    maxLevel: 8,
    description: 'Damages nearby enemies continuously',
    auraRadius: 80,
  },

  whip: {
    id: 'whip',
    name: 'Whip',
    behavior: 'melee',
    baseDamage: 15,
    baseCooldown: 1.2,
    baseSpeed: 0,
    baseCount: 1,
    spreadAngle: 0,
    ttl: 0.3,
    maxLevel: 8,
    description: 'Sweeping melee attack in front of you',
    meleeArc: 120,
    meleeRange: 100,
  },

  bible: {
    id: 'bible',
    name: 'Holy Bible',
    behavior: 'orbit',
    baseDamage: 12,
    baseCooldown: 0,
    baseSpeed: 0,
    baseCount: 1,
    spreadAngle: 0,
    ttl: 9999,
    maxLevel: 8,
    description: 'Orbiting projectiles protect you',
    orbitRadius: 70,
    orbitSpeed: 2.0,
  },

  lightning: {
    id: 'lightning',
    name: 'Lightning Ring',
    behavior: 'lightning',
    baseDamage: 25,
    baseCooldown: 3.0,
    baseSpeed: 0,
    baseCount: 1,
    spreadAngle: 0,
    ttl: 0.5,
    maxLevel: 8,
    description: 'Chain lightning strikes multiple enemies',
    chainCount: 3,
    chainRange: 150,
  },
};

/**
 * Create a weapon instance from a definition
 */
export function createWeaponFromDef(
  definition: WeaponDefinition,
  level: number = 1
): Weapon {
  // Scale stats based on level
  const levelMultiplier = 1 + (level - 1) * 0.2; // 20% increase per level
  const countBonus = Math.floor((level - 1) / 2); // +1 count every 2 levels

  return {
    id: `${definition.id}_${Date.now()}`,
    name: definition.name,
    type: definition.id,
    behavior: definition.behavior,
    level,
    maxLevel: definition.maxLevel,
    damage: Math.floor(definition.baseDamage * levelMultiplier),
    cooldown: definition.baseCooldown / (1 + (level - 1) * 0.1), // Slightly faster per level
    cooldownTimer: 0,
    projectileSpeed: definition.baseSpeed,
    projectileCount: definition.baseCount + countBonus,
    spreadAngle: definition.spreadAngle,
    ttl: definition.ttl,
    auraRadius: definition.auraRadius
      ? definition.auraRadius * (1 + (level - 1) * 0.15)
      : undefined,
    orbitRadius: definition.orbitRadius,
    orbitSpeed: definition.orbitSpeed,
    meleeArc: definition.meleeArc ? definition.meleeArc + (level - 1) * 5 : undefined,
    meleeRange: definition.meleeRange
      ? definition.meleeRange * (1 + (level - 1) * 0.1)
      : undefined,
    chainCount: definition.chainCount ? definition.chainCount + Math.floor((level - 1) / 2) : undefined,
    chainRange: definition.chainRange,
  };
}

/**
 * Upgrade a weapon to the next level
 */
export function upgradeWeapon(weapon: Weapon): Weapon {
  if (weapon.level >= weapon.maxLevel) {
    return weapon; // Already max level
  }

  const definition = WEAPON_DEFINITIONS[weapon.type];
  if (!definition) {
    return weapon;
  }

  return createWeaponFromDef(definition, weapon.level + 1);
}

/**
 * Get all weapon IDs
 */
export function getAllWeaponIds(): string[] {
  return Object.keys(WEAPON_DEFINITIONS);
}
