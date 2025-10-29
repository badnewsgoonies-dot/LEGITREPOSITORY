/**
 * Draft System - handles upgrade selection and application
 *
 * Features:
 * - Weighted draft selection (deterministic)
 * - Rarity-based upgrade pools
 * - Reroll and banish mechanics
 * - Upgrade application to player/weapons
 */

import type { Upgrade, DraftChoice, RNG, UpgradeType } from '../types';
import { nextRange } from '../core/rng';

/**
 * Base upgrade pool - all available upgrades
 */
export function createUpgradePool(): Upgrade[] {
  return [
    {
      id: 'dmg1',
      type: 'weapon_damage',
      name: 'Power Up',
      description: '+20% weapon damage',
      rarity: 'common',
      value: 0.2,
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'cd1',
      type: 'weapon_cooldown',
      name: 'Rapid Fire',
      description: '-10% weapon cooldown',
      rarity: 'common',
      value: 0.1,
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'count1',
      type: 'weapon_count',
      name: 'Multi Shot',
      description: '+1 projectile per shot',
      rarity: 'rare',
      value: 1,
      maxLevel: 3,
      currentLevel: 0,
    },
    {
      id: 'speed1',
      type: 'player_speed',
      name: 'Swift Feet',
      description: '+15% movement speed',
      rarity: 'common',
      value: 0.15,
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'hp1',
      type: 'player_hp',
      name: 'Vitality',
      description: '+20 max HP',
      rarity: 'common',
      value: 20,
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'regen1',
      type: 'player_regen',
      name: 'Regeneration',
      description: '+1 HP per second',
      rarity: 'rare',
      value: 1,
      maxLevel: 3,
      currentLevel: 0,
    },
    {
      id: 'magnet1',
      type: 'xp_magnet',
      name: 'Magnetism',
      description: '+50% XP collection range',
      rarity: 'common',
      value: 40,
      maxLevel: 3,
      currentLevel: 0,
    },

    {
      id: 'armor1',
      type: 'armor',
      name: 'Iron Skin',
      description: '-10% damage taken',
      rarity: 'rare',
      value: 0.1,
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'projspeed1',
      type: 'projectile_speed',
      name: 'Swift Shot',
      description: '+20% projectile speed',
      rarity: 'common',
      value: 0.2,
      maxLevel: 3,
      currentLevel: 0,
    },
    {
      id: 'projsize1',
      type: 'projectile_size',
      name: 'Giant Bullets',
      description: '+30% projectile size',
      rarity: 'rare',
      value: 0.3,
      maxLevel: 3,
      currentLevel: 0,
    },
    {
      id: 'crit1',
      type: 'crit_chance',
      name: 'Lucky Shot',
      description: '+5% crit chance (2x damage)',
      rarity: 'rare',
      value: 0.05,
      maxLevel: 4,
      currentLevel: 0,
    },
    {
      id: 'pierce1',
      type: 'pierce',
      name: 'Penetration',
      description: 'Projectiles pierce +1 enemy',
      rarity: 'epic',
      value: 1,
      maxLevel: 2,
      currentLevel: 0,
    },
    {
      id: 'lifesteal1',
      type: 'lifesteal',
      name: 'Vampirism',
      description: 'Heal 3 HP on kill',
      rarity: 'epic',
      value: 3,
      maxLevel: 3,
      currentLevel: 0,
    },
    {
      id: 'area1',
      type: 'area_damage',
      name: 'Explosive Death',
      description: 'Enemies explode dealing 50% damage in area',
      rarity: 'epic',
      value: 0.5,
      maxLevel: 2,
      currentLevel: 0,
    },
    {
      id: 'luck1',
      type: 'luck',
      name: 'Fortune',
      description: '+10% elite spawn chance',
      rarity: 'rare',
      value: 0.1,
      maxLevel: 3,
      currentLevel: 0,
    },

  ];
}

/**
 * Get weighted random item from array
 */
function pickWeighted<T>(
  rng: RNG,
  items: Array<{ item: T; weight: number }>
): [T, RNG] {
  const totalWeight = items.reduce((sum, entry) => sum + entry.weight, 0);
  const [roll, nextRng] = nextRange(rng, 0, totalWeight);

  let cumulative = 0;
  for (const entry of items) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return [entry.item, nextRng];
    }
  }

  // Fallback to last item
  return [items[items.length - 1].item, nextRng];
}

/**
 * Get weight for upgrade based on rarity
 */
function getRarityWeight(rarity: Upgrade['rarity']): number {
  switch (rarity) {
    case 'common':
      return 100;
    case 'rare':
      return 30;
    case 'epic':
      return 10;
  }
}

/**
 * Roll a draft of 3 upgrades (deterministic)
 */
export function rollDraft(
  rng: RNG,
  pool: Upgrade[],
  count: number = 3
): [Upgrade[], RNG] {
  let currentRng = rng;
  const selected: Upgrade[] = [];

  // Filter out maxed upgrades
  const available = pool.filter((u) => u.currentLevel < u.maxLevel);

  if (available.length === 0) {
    // No upgrades available, return empty
    return [[], currentRng];
  }

  // Build weighted table
  const weighted = available.map((upgrade) => ({
    item: upgrade,
    weight: getRarityWeight(upgrade.rarity),
  }));

  // Pick unique upgrades
  const picked = new Set<string>();
  for (let i = 0; i < count && picked.size < available.length; i++) {
    const [upgrade, nextRng] = pickWeighted(currentRng, weighted);
    currentRng = nextRng;

    // Ensure unique
    if (!picked.has(upgrade.id)) {
      picked.add(upgrade.id);
      selected.push(upgrade);
    } else {
      // Try again if duplicate
      i--;
    }
  }

  return [selected, currentRng];
}

/**
 * Create a draft choice for player
 */
export function createDraft(rng: RNG, pool: Upgrade[]): [DraftChoice, RNG] {
  const [upgrades, nextRng] = rollDraft(rng, pool, 3);

  return [
    {
      upgrades,
      rerollsAvailable: 0, // Could be upgraded
      banishesAvailable: 0, // Could be upgraded
    },
    nextRng,
  ];
}

/**
 * Apply an upgrade to the world state
 */
export function applyUpgrade(upgrade: Upgrade, world: any): void {
  // Find existing upgrade or add new one
  const existing = world.upgrades.find((u: Upgrade) => u.id === upgrade.id);

  if (existing) {
    existing.currentLevel++;
  } else {
    const newUpgrade = { ...upgrade, currentLevel: 1 };
    world.upgrades.push(newUpgrade);
  }

  // Update pool to reflect new level
  const poolUpgrade = world.upgradePool.find((u: Upgrade) => u.id === upgrade.id);
  if (poolUpgrade) {
    poolUpgrade.currentLevel++;
  }

  // Apply immediate effects
  switch (upgrade.type) {
    case 'player_hp':
      world.player.maxHp += upgrade.value;
      world.player.hp += upgrade.value; // Also heal
      break;

    case 'weapon_damage':
      // Applied dynamically when weapons fire
      break;

    case 'weapon_cooldown':
      // Applied dynamically when weapons fire
      break;

    case 'weapon_count':
      // Applied dynamically when weapons fire
      break;

    case 'player_speed':
      // Applied dynamically in player movement
      break;

    case 'player_regen':
      // Applied during update loop
      break;

    case 'xp_magnet':
      // Applied during XP collection
      break;
  }
}

/**
 * Get total value of an upgrade type
 */
export function getTotalUpgradeValue(
  upgrades: Upgrade[],
  type: UpgradeType
): number {
  return upgrades
    .filter((u) => u.type === type)
    .reduce((sum, u) => sum + u.value * u.currentLevel, 0);
}

/**
 * Get multiplier from percentage upgrades (e.g., 0.2 + 0.2 = 1.4x)
 */
export function getUpgradeMultiplier(
  upgrades: Upgrade[],
  type: UpgradeType
): number {
  const totalPercent = getTotalUpgradeValue(upgrades, type);
  return 1 + totalPercent;
}
