/**
 * Character Definitions - Playable characters with unique stats
 *
 * Inspired by Vampire Survivors character roster
 */

export interface CharacterStats {
  maxHp: number;
  moveSpeed: number;
  might: number; // damage multiplier
  armor: number; // damage reduction
  recovery: number; // HP regen per second
  cooldown: number; // weapon cooldown multiplier
  area: number; // AOE size multiplier
  speed: number; // projectile speed multiplier
  duration: number; // weapon duration multiplier
  amount: number; // projectile count bonus
  magnet: number; // XP pickup range
  luck: number; // item drop chance multiplier
  growth: number; // XP gain multiplier
  greed: number; // gold multiplier (future)
  curse: number; // enemy spawn multiplier (negative = harder)
  revivals: number; // extra lives
}

export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  startingWeapon: string;
  portrait: string; // color for now, can be image later
  unlocked: boolean;
  baseStats: CharacterStats;
  passive?: string; // special passive ability description
}

const DEFAULT_STATS: CharacterStats = {
  maxHp: 100,
  moveSpeed: 1.0,
  might: 1.0,
  armor: 0,
  recovery: 0,
  cooldown: 1.0,
  area: 1.0,
  speed: 1.0,
  duration: 1.0,
  amount: 0,
  magnet: 1.0,
  luck: 1.0,
  growth: 1.0,
  greed: 1.0,
  curse: 1.0,
  revivals: 0,
};

export const CHARACTERS: Record<string, CharacterDefinition> = {
  antonio: {
    id: 'antonio',
    name: 'Antonio',
    description: 'The balanced survivor. Good for beginners.',
    startingWeapon: 'whip',
    portrait: '#8B4513',
    unlocked: true,
    baseStats: {
      ...DEFAULT_STATS,
      maxHp: 100,
    },
  },

  imelda: {
    id: 'imelda',
    name: 'Imelda',
    description: 'Gains more experience. Fast learner.',
    startingWeapon: 'magic_wand',
    portrait: '#9932CC',
    unlocked: true,
    baseStats: {
      ...DEFAULT_STATS,
      growth: 1.3, // +30% XP gain
      maxHp: 80,
    },
    passive: '+30% Experience Gain',
  },

  gennaro: {
    id: 'gennaro',
    name: 'Gennaro',
    description: 'More projectiles from the start.',
    startingWeapon: 'knife',
    portrait: '#2E8B57',
    unlocked: true,
    baseStats: {
      ...DEFAULT_STATS,
      amount: 1, // +1 projectile
      maxHp: 90,
    },
    passive: '+1 Projectile Count',
  },

  mortaccio: {
    id: 'mortaccio',
    name: 'Mortaccio',
    description: 'Faster movement speed.',
    startingWeapon: 'garlic',
    portrait: '#696969',
    unlocked: true,
    baseStats: {
      ...DEFAULT_STATS,
      moveSpeed: 1.3, // +30% movement
      maxHp: 80,
    },
    passive: '+30% Move Speed',
  },

  arca: {
    id: 'arca',
    name: 'Arca',
    description: 'Fires more projectiles but has less HP.',
    startingWeapon: 'lightning',
    portrait: '#4169E1',
    unlocked: false,
    baseStats: {
      ...DEFAULT_STATS,
      amount: 2, // +2 projectiles
      cooldown: 0.9, // 10% faster
      maxHp: 70,
    },
    passive: '+2 Projectiles, -10% Cooldown',
  },

  porta: {
    id: 'porta',
    name: 'Porta',
    description: 'Stronger but slower attacks.',
    startingWeapon: 'axe',
    portrait: '#DC143C',
    unlocked: false,
    baseStats: {
      ...DEFAULT_STATS,
      might: 1.5, // +50% damage
      cooldown: 1.3, // 30% slower
      maxHp: 120,
    },
    passive: '+50% Might, +30% Cooldown',
  },

  poe: {
    id: 'poe',
    name: 'Poe',
    description: 'Larger area of effect.',
    startingWeapon: 'garlic',
    portrait: '#FF69B4',
    unlocked: false,
    baseStats: {
      ...DEFAULT_STATS,
      area: 1.3, // +30% area
      duration: 1.3, // +30% duration
      maxHp: 90,
    },
    passive: '+30% Area and Duration',
  },

  krochi: {
    id: 'krochi',
    name: 'Krochi',
    description: 'Starts with one revival.',
    startingWeapon: 'bible',
    portrait: '#FFD700',
    unlocked: false,
    baseStats: {
      ...DEFAULT_STATS,
      revivals: 1,
      maxHp: 80,
    },
    passive: 'Starts with 1 Revival',
  },
};

/**
 * Get character by ID
 */
export function getCharacter(id: string): CharacterDefinition | undefined {
  return CHARACTERS[id];
}

/**
 * Get all unlocked characters
 */
export function getUnlockedCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTERS).filter((c) => c.unlocked);
}

/**
 * Get all characters (for debug/admin)
 */
export function getAllCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTERS);
}

/**
 * Unlock a character
 */
export function unlockCharacter(id: string): void {
  const character = CHARACTERS[id];
  if (character) {
    character.unlocked = true;
  }
}
