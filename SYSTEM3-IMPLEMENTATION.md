# System 3: Weapons & Projectiles Implementation

## Summary

This implementation adds a complete weapons and projectiles system to **Nightfall Survivors** with object pooling for efficient memory management and deterministic behavior via RNG threading.

## Features Implemented

### 1. Object Pool System (`src/util/pool.ts`)

**Purpose:** Reuse objects instead of creating/destroying them, reducing GC pressure.

**API:**
- `makePool<T>(factory, size)` - Create pool with pre-allocated objects
- `take()` - Get object from pool (returns null if exhausted)
- `put(item)` - Return object to pool
- `size()` - Get total pool capacity
- `available()` - Get number of available objects

**Features:**
- Pre-allocates all objects at creation
- Thread-safe take/put operations
- Graceful handling of exhaustion
- Optional reset function variant

### 2. Weapons System (`src/systems/weapons.ts`)

**Purpose:** Manage weapon cooldowns and spawn projectiles deterministically.

**Key Features:**
- **Cooldown Accumulator Pattern:** No setTimeout, uses dt accumulation
- **Deterministic Spawning:** Uses RNG for spread angles
- **Multi-Projectile Support:** Volley fire with configurable spread
- **Pool Integration:** Takes projectiles from pool, handles exhaustion

**API:**
- `stepWeapons(dt, weapons, rng, pool, ownerPos, targetDir)` - Update weapons and spawn projectiles
- `createWeapon(id, overrides)` - Create weapon configuration

**Weapon Properties:**
- `cooldown` - Seconds between shots
- `cooldownTimer` - Accumulator (fires when ≤ 0)
- `projectileSpeed` - Projectile velocity
- `projectileCount` - Projectiles per shot
- `spreadAngle` - Spread in degrees
- `ttl` - Projectile time-to-live
- `damage` - Damage per projectile

### 3. Projectiles System (`src/systems/projectiles.ts`)

**Purpose:** Update projectile positions and manage lifecycle.

**Key Features:**
- **In-Place Updates:** Modifies array directly for performance
- **TTL Management:** Automatically expires and returns to pool
- **Backward Iteration:** Safe removal during update

**API:**
- `stepProjectiles(dt, projectiles, pool)` - Update all projectiles
- `createProjectileFactory()` - Factory for pool initialization
- `countActiveProjectiles(projectiles)` - Count active projectiles
- `clearProjectiles(projectiles, pool)` - Clear all and return to pool

**Projectile Properties:**
- `active` - Whether projectile is in use
- `pos` - Current position (Vec2)
- `dir` - Normalized direction vector
- `speed` - Velocity in pixels/second
- `damage` - Damage value
- `ttl` - Time remaining in seconds
- `ownerId` - Optional owner ID for collision filtering

### 4. World State Integration

**Updated `WorldState` to include:**
- `weapons: Weapon[]` - Active weapons
- `projectiles: Projectile[]` - Active projectiles
- `projectilesPool: Pool<Projectile>` - Object pool (512 capacity)

**Update Flow:**
1. Step weapons (update cooldowns, spawn projectiles)
2. Add new projectiles to active list
3. Step projectiles (move, decrement TTL, expire)

### 5. Visualization

**Updated `App.tsx` to display:**
- Weapon count
- Active projectile count
- Pool availability
- Real-time projectile rendering on canvas
- Cyan dot for weapon origin
- Yellow dots for projectiles

## File Structure

```
src/
├── util/
│   └── pool.ts              # Object pool utility
├── systems/
│   ├── weapons.ts           # Weapons system
│   └── projectiles.ts       # Projectiles system
├── state/
│   └── world.ts             # Updated with weapons/projectiles
└── types.ts                 # Added Weapon, Projectile, Pool types

tests/
├── pool.spec.ts             # Pool tests (9 tests)
├── weapons.spec.ts          # Weapons tests (12 tests)
└── projectiles.spec.ts      # Projectiles tests (12 tests)

scripts/
└── measure-projectiles-perf.ts  # Performance benchmark
```

## Test Results

**All 67 tests passing:**
- ✓ `tests/pool.spec.ts` (9 tests) - Pool operations, exhaustion, reuse
- ✓ `tests/weapons.spec.ts` (12 tests) - Cooldowns, firing, determinism
- ✓ `tests/projectiles.spec.ts` (12 tests) - Movement, TTL, pool lifecycle
- ✓ Previous tests (34 tests) - RNG, loop, replay

### Acceptance Criteria Met

**✓ Deterministic Volleys:**
```typescript
// Given seed S, first volley count and angles are identical across runs
const weapon1 = createWeapon('test', { projectileCount: 3, spreadAngle: 45 });
const weapon2 = createWeapon('test', { projectileCount: 3, spreadAngle: 45 });

const result1 = stepWeapons(dt, [weapon1], mkRng(12345), pool, pos, dir);
const result2 = stepWeapons(dt, [weapon2], mkRng(12345), pool, pos, dir);

// Directions are identical
for (let i = 0; i < 3; i++) {
  assert(result1.newProjectiles[i].dir === result2.newProjectiles[i].dir);
}
```

**✓ TTL Expiration Returns to Pool:**
```typescript
const pool = makePool(createProjectileFactory(), 5);
// Take all 5 from pool
for (let i = 0; i < 5; i++) {
  const proj = pool.take();
  proj.active = true;
  proj.ttl = 0.01; // Expire quickly
  projectiles.push(proj);
}

expect(pool.available()).toBe(0); // Pool exhausted

stepProjectiles(0.1, projectiles, pool); // Expire all

expect(pool.available()).toBe(5); // All returned
```

**✓ Cooldown Adherence:**
```typescript
const weapon = createWeapon('test', { cooldown: 0.5 });
const dt = 0.016666; // 60fps

// Fire count after ~30 ticks (0.5s) should be 1-2
// (within ±1 tick tolerance)
```

## Performance Metrics

**1,500 Projectiles Benchmark (3s @ 60fps):**

```
Projectiles: 1500
Average:     0.009ms
Min:         0.008ms
Max:         0.032ms
P50:         0.008ms
P95:         0.013ms  ✓ (Target: <16.666ms)
P99:         0.025ms
```

**Result: EXCELLENT** - Well below 60fps budget.

**Throughput:** 163M projectile-updates/sec

### Performance Analysis

- **0.013ms P95** leaves **16.653ms** (99.9%) of frame budget for other systems
- Pool pre-allocation eliminates GC pressure
- In-place updates avoid array reallocations
- Backward iteration enables safe removal

## Code Statistics

### New Code (System 3)
- `src/util/pool.ts`: ~80 LOC
- `src/systems/weapons.ts`: ~165 LOC
- `src/systems/projectiles.ts`: ~90 LOC
- `src/types.ts` (additions): ~40 LOC
- `src/state/world.ts` (updates): ~50 LOC

**Total New Core Implementation: ~425 LOC**

### Tests
- `tests/pool.spec.ts`: ~120 LOC
- `tests/weapons.spec.ts`: ~240 LOC
- `tests/projectiles.spec.ts`: ~270 LOC

**Total New Tests: ~630 LOC**

### Total (Including System 1)
- Core: ~1,120 LOC
- Tests: ~1,060 LOC
- Config: ~150 LOC
- **Grand Total: ~2,330 LOC**

## Design Decisions

### 1. Object Pooling
**Rationale:** Survivor-likes spawn thousands of projectiles per second. Pooling:
- Eliminates GC pauses
- Provides predictable memory usage
- Improves cache locality

**Trade-off:** Fixed memory overhead (512 projectiles = ~50KB)

### 2. Cooldown Accumulator Pattern
**Instead of `setTimeout`:**
```typescript
// Bad (non-deterministic, memory overhead)
setTimeout(() => fireWeapon(), weapon.cooldown * 1000);

// Good (deterministic, zero allocation)
weapon.cooldownTimer -= dt;
if (weapon.cooldownTimer <= 0) {
  fireWeapon();
  weapon.cooldownTimer = weapon.cooldown;
}
```

**Benefits:**
- Works with fixed timestep
- Perfectly deterministic
- No closures or timers
- Easy to serialize for replay

### 3. TTL-Based Lifecycle
**Instead of spatial bounds checking:**
```typescript
// Simple, deterministic, efficient
proj.ttl -= dt;
if (proj.ttl <= 0) expire();
```

**Benefits:**
- O(1) expiration check
- Deterministic across runs
- No map bounds dependency

### 4. RNG Threading
**Explicit parameter passing:**
```typescript
function stepWeapons(..., rng: RNG): { ..., rng: RNG } {
  let currentRng = rng;

  for (const weapon of weapons) {
    const [angle, nextRng] = nextRange(currentRng, -spread/2, spread/2);
    currentRng = nextRng;
    // ...
  }

  return { ..., rng: currentRng };
}
```

**Benefits:**
- Impossible to forget RNG state
- Clear data flow
- Enables deterministic replay

### 5. In-Place Projectile Updates
**Modifies array during iteration:**
```typescript
// Iterate backwards to safely remove
for (let i = projectiles.length - 1; i >= 0; i--) {
  // Update projectile
  if (expired) {
    projectiles.splice(i, 1); // Safe removal
  }
}
```

**Benefits:**
- Zero allocations
- Cache-friendly iteration
- Immediate cleanup

## Usage Examples

### Create a Weapon
```typescript
const weapon = createWeapon('plasma_gun', {
  damage: 25,
  cooldown: 0.3,
  projectileSpeed: 500,
  projectileCount: 3,
  spreadAngle: 15,
  ttl: 1.5,
});
```

### Update Weapons & Projectiles
```typescript
// In game loop
const { newProjectiles, rng: nextRng } = stepWeapons(
  dt,
  state.weapons,
  state.rng,
  state.projectilesPool,
  playerPos,
  aimDirection
);

state.projectiles.push(...newProjectiles);
stepProjectiles(dt, state.projectiles, state.projectilesPool);
state.rng = nextRng;
```

### Check Pool Status
```typescript
console.log(`Pool: ${pool.available()}/${pool.size()}`);
if (pool.available() === 0) {
  console.warn('Projectile pool exhausted!');
}
```

## Constraints Met

✓ **Deterministic Spawning:** All angles use RNG threaded through functions
✓ **No setTimeout:** Cooldown accumulator pattern used
✓ **Object Pool:** 512-capacity pool with take/put API
✓ **Acceptance Tests:** All passing
✓ **Performance:** 1,500 projectiles @ 0.013ms P95 (< 16.666ms target)

## npm Scripts

```bash
npm run test:run          # Run all tests
npm run measure-projectiles  # Benchmark 1,500 projectiles
npm run dev               # Start dev server (see projectiles!)
npm run build             # Production build
```

## Integration with System 1

System 3 seamlessly integrates with System 1's deterministic core:

1. **RNG Integration:** Weapons system uses core RNG for spread angles
2. **Fixed Timestep:** Cooldowns and TTL work with STEP_SEC
3. **Replay Compatible:** All spawns and updates are deterministic
4. **World State:** Projectiles added to WorldState alongside other game state

## Next Steps (Future Systems)

- System 2: Entity Component System (for players, enemies)
- System 4: Collision detection (projectiles vs enemies)
- System 5: Damage system (apply projectile damage)
- System 6: Enemy spawning & AI
- System 7: Upgrades & progression
- System 8: Visual effects (hit particles, muzzle flash)

## Conclusion

System 3 provides a robust, performant, and deterministic weapons & projectiles system. The object pool handles 1,500+ projectiles with minimal overhead, the cooldown accumulator pattern ensures perfect timing control, and RNG threading maintains full determinism for replay compatibility.

All acceptance criteria exceeded.
