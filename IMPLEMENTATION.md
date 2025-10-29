# Nightfall Survivors - System 1 Implementation

## Summary

This implementation provides the foundational architecture for **Nightfall Survivors**, a survivor-like game built with TypeScript, React, and Vite. System 1 focuses on establishing a deterministic core loop with a fixed-timestep update cycle and reproducible random number generation.

## Features Implemented

### Core Systems

#### 1. Deterministic RNG (`src/core/rng.ts`)
- Uses `pure-rand`'s xoroshiro128+ algorithm
- Fully immutable RNG state - operations return new state
- Helper functions:
  - `mkRng(seed)` - Create RNG from seed
  - `nextFloat(rng)` - Generate float in [0, 1)
  - `nextInt(rng, min, max)` - Generate integer in range
  - `nextRange(rng, min, max)` - Generate float in range
  - `choose(rng, array)` - Choose random element
  - `chance(rng, probability)` - Boolean with probability
  - `shuffle(rng, array)` - Fisher-Yates shuffle
- **No Math.random() in core logic** - enforced by ESLint

#### 2. Fixed-Timestep Game Loop (`src/core/loop.ts`)
- 60Hz update rate (16.666ms per frame)
- Accumulator pattern for deterministic physics
- Frame delta clamping (max 50ms to prevent spiral of death)
- Interpolation alpha for smooth rendering
- Synchronous `stepSync()` function for unit testing
- Performance measurement utilities

#### 3. Replay System (`src/core/replay.ts`)
- Records:
  - Initial seed
  - All game events (inputs, spawns, damage, etc.)
  - Final state hash for verification
- API:
  - `beginRun(seed)` - Start recording
  - `log(event)` - Log game event
  - `endRun(finalState)` - Generate RunLog with hash
  - `exportRunLog()` / `importRunLog()` - JSON serialization
  - `verifyRunLog()` - Verify replay determinism
- State hashing with DJB2 algorithm

#### 4. World State Management (`src/state/world.ts`)
- `initWorld(seed)` - Initialize game state
- `updateWorld(state)` - Fixed-step update function
- Maintains: time, frame count, RNG state, pause state

#### 5. React Integration (`src/App.tsx`)
- Integrates game loop with React
- Live debug HUD showing:
  - Running status
  - Pause state
  - Current frame
  - Simulation time
  - RNG seed
- Canvas rendering with animated demo
- Export replay functionality

## File Structure

```
nightfall-survivors/
├── src/
│   ├── core/
│   │   ├── loop.ts          # Fixed-timestep game loop
│   │   ├── rng.ts           # Deterministic RNG
│   │   └── replay.ts        # Replay recording/verification
│   ├── state/
│   │   └── world.ts         # World state management
│   ├── types.ts             # Core type definitions
│   ├── App.tsx              # Main React component
│   └── main.tsx             # Entry point
├── tests/
│   ├── loop.spec.ts         # Loop tests (11 tests)
│   ├── rng.spec.ts          # RNG tests (10 tests)
│   └── replay.spec.ts       # Replay tests (13 tests)
├── scripts/
│   ├── generate-replay.ts   # Generate replay-sample.json
│   └── measure-perf.ts      # Performance measurement
├── index.html               # HTML entry
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── vitest.config.ts         # Vitest config
├── .eslintrc.cjs            # ESLint config (bans Math.random)
└── replay-sample.json       # Sample replay artifact
```

## Test Results

**All 34 tests passing:**
- ✓ `tests/rng.spec.ts` (10 tests) - Determinism, ranges, consistency
- ✓ `tests/loop.spec.ts` (11 tests) - Fixed-step behavior, accumulation
- ✓ `tests/replay.spec.ts` (13 tests) - Recording, verification, import/export

## Performance Metrics

**Idle Performance (3s @ 60fps):**
- Average: 0.007ms per frame
- Min: 0.006ms
- Max: 0.026ms
- **P95: 0.009ms** ✓ (Target: <16.666ms)
- **P99: 0.016ms** ✓

Result: **EXCELLENT** - Well below 60fps target budget.

## Artifacts

### replay-sample.json
Generated replay recording demonstrating:
- 3 seconds of gameplay (180 frames)
- Seed: 42
- 9 logged events (inputs + tick markers)
- Final hash: `392b90e7`
- Deterministic verification supported

## Code Statistics

### Lines of Code (excluding tests)
- `src/core/loop.ts`: ~150 LOC
- `src/core/rng.ts`: ~130 LOC
- `src/core/replay.ts`: ~140 LOC
- `src/state/world.ts`: ~40 LOC
- `src/types.ts`: ~70 LOC
- `src/App.tsx`: ~150 LOC
- `src/main.tsx`: ~15 LOC

**Total Core Implementation: ~695 LOC**

### Test Coverage
- `tests/loop.spec.ts`: ~120 LOC
- `tests/rng.spec.ts`: ~115 LOC
- `tests/replay.spec.ts`: ~195 LOC

**Total Tests: ~430 LOC**

### Configuration
- Config files (tsconfig, vite, vitest, eslint): ~150 LOC

**Grand Total: ~1,275 LOC**

## npm Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run test             # Run tests (watch mode)
npm run test:run         # Run tests once
npm run lint             # Lint code
npm run generate-replay  # Generate replay-sample.json
npm run measure-perf     # Measure performance
```

## Key Design Decisions

### 1. Immutable RNG State
- Prevents accidental state mutation bugs
- Makes testing easier
- Enables perfect determinism

### 2. Fixed Timestep
- Guarantees consistent simulation regardless of frame rate
- Prevents physics instabilities
- Enables perfect replay

### 3. ESLint Rules
- Bans `Math.random()` in `src/core/**` and `src/state/**`
- Bans `Date.now()` in core logic
- Prevents non-deterministic code from sneaking in

### 4. Explicit RNG Threading
- RNG state explicitly passed and returned
- No global RNG state
- Makes data flow obvious

### 5. Replay Architecture
- Minimal overhead - only logs significant events
- Hash-based verification
- JSON export for sharing/debugging

## Next Steps (Future Systems)

- System 2: Entity Component System
- System 3: Player input handling
- System 4: Enemy spawning & AI
- System 5: Collision detection
- System 6: Weapons & combat
- System 7: Upgrades & progression
- System 8: Rendering & effects

## Constraints Met

✓ **Language**: TypeScript
✓ **Stack**: Vite + React + TS
✓ **Libraries**: pure-rand (xoroshiro128+), vitest, react, react-dom
✓ **Determinism**: No Math.random/Date.now in core updates, RNG passed explicitly
✓ **Fixed Timestep**: 60Hz logic with rAF + accumulator, frame delta clamped ≤50ms
✓ **Replay**: Logs seed + inputs + decisions → JSON + final state hash (stable)
✓ **Tests**: All acceptance tests passing (34/34)
✓ **Artifacts**: replay-sample.json generated
✓ **Performance**: P95 = 0.009ms (target: <16.666ms)
✓ **Code Quality**: ESLint rules enforcing determinism

## Conclusion

System 1 provides a rock-solid foundation for Nightfall Survivors. The deterministic core loop, reproducible RNG, and replay system ensure that the game can scale to complex gameplay while maintaining perfect consistency and debuggability.

All acceptance criteria have been met and exceeded.
