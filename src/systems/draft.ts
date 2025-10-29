/**
 * S6: XP Gems, Level-Up Draft & Pickups
 * Draft system - 3-card upgrade choices on level up
 */

import type { RNG } from '../core/rng';
import { pick } from '../core/rng';
import type { Player, UpgradeCard, Weapon } from '../types/game';

/**
 * Upgrade pool - available upgrades
 */
export const UPGRADE_POOL: UpgradeCard[] = [
  {
    id: 'max_hp',
    name: 'Vitality',
    description: '+20 Max HP',
    rarity: 'common',
    apply: (player) => {
      player.stats.maxHp += 20;
      player.maxHp += 20;
      player.hp += 20;
    },
  },
  {
    id: 'speed',
    name: 'Swift',
    description: '+15% Movement Speed',
    rarity: 'common',
    apply: (player) => {
      player.stats.speed *= 1.15;
    },
  },
  {
    id: 'might',
    name: 'Might',
    description: '+20% Damage',
    rarity: 'common',
    apply: (player) => {
      player.stats.might += 0.2;
    },
  },
  {
    id: 'area',
    name: 'Blast',
    description: '+15% Area',
    rarity: 'common',
    apply: (player) => {
      player.stats.area += 0.15;
    },
  },
  {
    id: 'cooldown',
    name: 'Haste',
    description: '+10% Attack Speed',
    rarity: 'common',
    apply: (player) => {
      player.stats.cooldown += 0.1;
    },
  },
  {
    id: 'duration',
    name: 'Duration',
    description: '+20% Projectile Duration',
    rarity: 'uncommon',
    apply: (player) => {
      player.stats.duration += 0.2;
    },
  },
  {
    id: 'armor',
    name: 'Armor',
    description: '+1 Armor',
    rarity: 'uncommon',
    apply: (player) => {
      player.stats.armor += 1;
    },
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description: '+0.5 HP/sec',
    rarity: 'uncommon',
    apply: (player) => {
      player.stats.recovery += 0.5;
    },
  },
  {
    id: 'pickup',
    name: 'Magnet',
    description: '+30% Pickup Range',
    rarity: 'common',
    apply: (player) => {
      player.stats.pickup *= 1.3;
    },
  },
];

/**
 * Starting weapon definition
 */
export function createStarterWeapon(): Weapon {
  return {
    id: 'magic_bolt',
    name: 'Magic Bolt',
    level: 1,
    cooldown: 1.5,
    currentCd: 0,
    damage: 10,
    behavior: {
      type: 'projectile',
      speed: 400,
      ttl: 3,
      count: 1,
      spread: 0,
      piercing: 1,
    },
  };
}

/**
 * Roll draft - pick 3 random upgrades
 * Returns [cards, updatedRng]
 */
export function rollDraft(
  rng: RNG,
  pool: UpgradeCard[]
): readonly [UpgradeCard[], RNG] {
  if (pool.length === 0) {
    return [[], rng] as const;
  }

  const count = Math.min(3, pool.length);
  const cards: UpgradeCard[] = [];
  const available = [...pool];
  let currentRng = rng;

  for (let i = 0; i < count; i++) {
    const [card, r2] = pick(currentRng, available);
    currentRng = r2;

    cards.push(card);

    // Remove from available to prevent duplicates
    const idx = available.indexOf(card);
    if (idx >= 0) {
      available.splice(idx, 1);
    }
  }

  return [cards, currentRng] as const;
}

/**
 * Apply upgrade to player
 */
export function applyUpgrade(player: Player, card: UpgradeCard): Player {
  // Clone player to avoid mutation
  const updated = { ...player };
  card.apply(updated);
  return updated;
}

/**
 * Banish card from pool (permanent removal)
 */
export function banishCard(pool: UpgradeCard[], cardId: string): UpgradeCard[] {
  return pool.filter((c) => c.id !== cardId);
}
