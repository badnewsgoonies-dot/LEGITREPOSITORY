/**
 * Common game types and interfaces
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  type: 'player' | 'enemy' | 'projectile' | 'pickup';
}

export interface Player extends Entity {
  type: 'player';
  speed: number;
  iframes: number;
  level: number;
  xp: number;
  xpToNext: number;
  facing: Vec2;
  weapons: Weapon[];
  stats: PlayerStats;
}

export interface PlayerStats {
  maxHp: number;
  speed: number;
  pickup: number; // Pickup radius
  might: number; // Damage multiplier
  area: number; // Area multiplier
  cooldown: number; // Cooldown reduction (negative = faster)
  duration: number; // Projectile duration multiplier
  armor: number; // Damage reduction
  recovery: number; // HP regen per second
}

export interface Enemy extends Entity {
  type: 'enemy';
  speed: number;
  damage: number;
  xpValue: number;
  enemyType: string;
  knockbackResist: number;
}

export interface Projectile extends Entity {
  type: 'projectile';
  damage: number;
  ttl: number;
  piercing: number; // How many enemies it can hit
  hitIds: Set<number>; // Entities already hit
  weaponId: string;
}

export interface Pickup extends Entity {
  type: 'pickup';
  pickupType: 'xp' | 'heal' | 'magnet';
  value: number;
  magnetSpeed: number;
}

export interface Weapon {
  id: string;
  name: string;
  level: number;
  cooldown: number;
  currentCd: number;
  damage: number;
  behavior: WeaponBehavior;
}

export type WeaponBehavior =
  | { type: 'projectile'; speed: number; ttl: number; count: number; spread: number; piercing: number }
  | { type: 'orbit'; radius: number; count: number; speed: number; damage: number }
  | { type: 'aoe'; radius: number; duration: number; damage: number };

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  time: number; // Game time in seconds
  frame: number;
  paused: boolean;
  gameOver: boolean;
  won: boolean;
}

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  apply: (player: Player) => void;
}
