# 🦇 Nightfall Survivors

A deterministic top-down bullet-heaven survival game inspired by the survivor-like genre. Built with TypeScript, React, and Canvas API.

## 🎮 Game Overview

Survive escalating enemy waves for 20 minutes while leveling up and choosing powerful upgrades. Features deterministic gameplay with seeded RNG for perfect replay capability.

**Genre:** Survivor-like, Bullet Heaven
**Platform:** Web (Browser)
**Engine:** Custom (TypeScript + Canvas)

## ✨ Features

- **Deterministic Gameplay**: Seeded RNG ensures perfect reproducibility
- **Fixed Timestep Loop**: 60 FPS gameplay with stable physics
- **8 Core Systems**: Player, Weapons, Enemies, Collision, XP, Upgrades, Stats, UI
- **Level-Up System**: Draft from 3 random upgrades each level
- **Enemy Waves**: Time-based spawning with increasing difficulty
- **Replay System**: Record and replay entire game sessions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Playing the Game

- **Movement:** WASD or Arrow Keys
- **Pause:** ESC
- **Upgrade Selection:** Click card or press 1/2/3

**Objective:** Survive for 20 minutes!

## 🏗️ Architecture

### System Overview

1. **S1: Core Loop & RNG** - Fixed timestep (60 FPS), deterministic RNG
2. **S2: Player Controller** - Movement, i-frames, HP management
3. **S3: Weapons & Projectiles** - Auto-fire weapons with cooldowns
4. **S4: Enemy Spawner** - Time-based waves with scaling difficulty
5. **S5: Collision & Damage** - AABB/circle detection, knockback
6. **S6: XP & Draft** - Level-up system with upgrade choices
7. **S7: Stats & Scaling** - Stat growth curves and modifiers
8. **S8: UI/HUD** - React-based HUD and modals

### Tech Stack

- **TypeScript** - Type-safe game logic
- **React 18** - UI components and HUD
- **Canvas API** - 2D rendering
- **Vitest** - Unit testing
- **Vite** - Build tooling
- **pure-rand** - Deterministic RNG

## 🧪 Testing

All 8 systems have comprehensive unit tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

**Test Coverage:** 45 tests across 8 test suites

## 📊 Performance Budgets

- **Frame Rate:** 60 FPS (p95 ≤ 16.6ms)
- **Entities:** 300+ enemies, 1500+ projectiles
- **GC Spikes:** < 2ms (object pooling)

## 🎯 Determinism

The game uses seeded RNG (`pure-rand` library) to ensure perfect determinism:

- Every game with the same seed produces identical outcomes
- Replay logs capture seed + inputs for full reproducibility
- No `Math.random()` or `Date.now()` in core systems
- Stable tie-breakers for all operations

## 🎨 Upgrade System

Choose from 9+ upgrades on level-up:

- **Vitality** - +20 Max HP
- **Swift** - +15% Movement Speed
- **Might** - +20% Damage
- **Blast** - +15% Area
- **Haste** - +10% Attack Speed
- **Duration** - +20% Projectile Duration
- **Armor** - +1 Armor
- **Recovery** - +0.5 HP/sec
- **Magnet** - +30% Pickup Range

## 📁 Project Structure

```
nightfall-survivors/
├── src/
│   ├── core/          # Core systems (loop, RNG, replay)
│   ├── systems/       # Game systems (player, weapons, enemies, etc.)
│   ├── types/         # TypeScript type definitions
│   ├── ui/            # React UI components
│   ├── App.tsx        # Main application
│   └── main.tsx       # Entry point
├── tests/             # Unit tests for all systems
├── public/            # Static assets
└── dist/              # Production build output
```

## 🛠️ Development

### Code Style

- Pure functions for game logic
- No side effects in core systems
- Explicit RNG threading (no global state)
- Object pooling for performance-critical paths

### Adding New Systems

1. Create system file in `src/systems/`
2. Define pure update functions
3. Add tests in `tests/`
4. Integrate into main game loop in `src/core/game.ts`

### Anti-Patterns to Avoid

❌ `Math.random()` in core systems
❌ `Date.now()` for timing
❌ Mutable global state
❌ UI logic in game systems
❌ Physics engines (over-engineering)

## 📝 Design Decisions

- **Fixed timestep:** Ensures stable physics and determinism
- **Object pooling:** Prevents GC spikes with 1000+ entities
- **Pure functions:** Makes testing and debugging easier
- **Headless tests:** Game logic runs without DOM/Canvas
- **React overlay:** Separates UI from game logic

## 🤝 Contributing

This is an educational/reference project. Feel free to:

- Report bugs or issues
- Suggest improvements
- Fork and experiment
- Use as learning material

## 📜 License

This is an original, non-commercial project inspired by the survivor-like genre. All code is original. No copyrighted assets, names, or code from commercial games.

## 🙏 Acknowledgments

Inspired by the bullet-heaven survival genre popularized by games like Vampire Survivors. This is an original implementation with unique mechanics and code.

## 📚 Resources

- [Game Architecture](https://en.wikipedia.org/wiki/Entity_component_system)
- [Fixed Timestep](https://gafferongames.com/post/fix_your_timestep/)
- [Deterministic RNG](https://github.com/dubzzz/pure-rand)

---

**Version:** 1.0.0
**Status:** ✅ Playable MVP
**Last Updated:** 2025-10-29
