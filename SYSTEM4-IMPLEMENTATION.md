# System 4: Enemy Spawner & Waves Implementation

## Summary

This implementation adds a complete enemy spawning system with deterministic wave progression, weighted enemy type selection, and elite variants. The system ensures perfect reproducibility for replay compatibility while maintaining smooth gameplay through per-frame spawn caps.

## Features Implemented

### 1. Enemy Types (`src/types.ts`)

**Enemy Interface:**
```typescript
interface Enemy {
  id: string;
  kind: EnemyKind; // 'zombie' | 'fast' | 'tank' | 'swarm'
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  touchDamage: number;
  isElite: boolean;
}
```

**Enemy Types:**
- **Zombie:** Balanced base enemy (medium hp, medium speed)
- **Fast:** Quick but fragile (low hp, high speed)
- **Tank:** Slow but tanky (high hp, low speed)
- **Swarm:** Weak but numerous (very low hp, medium speed)

**Elite Multipliers:**
- HP: 3.0x
- Speed: 1.2x
- Damage: 2.0x
- Visual: Purple color with yellow ring

### 2. Wave Configuration (`src/waves/table.ts`)

**6 Wave Tiers (Minute 0-5+):**

| Minute | Spawn Rate | Elite % | Enemy Mix |
|--------|------------|---------|-----------|
| 0 | 2/sec | 0% | 100% Zombie |
| 1 | 3/sec | 5% | 70% Zombie, 30% Fast |
| 2 | 4/sec | 8% | 50% Zombie, 35% Fast, 15% Swarm |
| 3 | 5/sec | 10% | 40% Zombie, 30% Fast, 20% Tank, 10% Swarm |
| 4 | 6/sec | 12% | 35% Zombie, 30% Fast, 25% Tank, 10% Swarm |
| 5+ | 8/sec | 15% | 30% Zombie, 30% Fast, 30% Tank, 10% Swarm |

**Progression:**
- Spawn rate increases from 2/sec → 8/sec
- Elite chance increases from 0% → 15%
- Enemy variety expands each minute
- Stats scale up (HP, speed, damage)

### 3. Spawn System (`src/systems/spawn.ts`)

**Key Features:**

**Spawn Accumulator Pattern:**
```typescript
accumulator += dt;
while (accumulator >= spawnInterval) {
  spawnEnemy();
  accumulator -= spawnInterval;
}
```
- No setTimeout or timers
- Deterministic timing
- Works perfectly with fixed timestep

**Weighted Selection:**
- Uses RNG to select enemy type based on weights
- Cumulative distribution for efficient selection
- Example: 70% Zombie, 30% Fast → roll 0-100, <70 = Zombie

**Safe Spawning:**
- Enemies spawn at ring around player
- Minimum radius: 400px (outside camera/danger zone)
- Maximum radius: 500px (prevents off-screen spawns)
- Random angle for variety

**Per-Frame Cap:**
- Maximum 12 enemies per frame
- Prevents lag spikes
- Excess accumulator carries over to next frame

**API:**
```typescript
stepSpawns(dt, spawnAccumulator, rng, minute, playerPos)
  → { newEnemies, newAccumulator, rng }
```

### 4. World State Integration

**Added to WorldState:**
- `enemies: Enemy[]` - Active enemy list
- `spawnAccumulator: number` - Time accumulator for spawning
- `playerPos: Vec2` - Player position (for spawn positioning)

**Update Flow:**
1. Calculate current minute from elapsed time
2. Get wave config for minute
3. Step spawn system (accumulate, spawn, return new state)
4. Add new enemies to world

### 5. Visualization

**Enemy Rendering:**
- **Zombie:** Red circles (6px)
- **Fast:** Orange circles (6px)
- **Tank:** Dark red circles (8px, larger)
- **Swarm:** Light red circles (4px, smaller)
- **Elite:** Purple with yellow ring indicator

**HUD Updates:**
- Added enemy count
- Added current minute display
- Updated canvas debug text

## File Structure

```
src/
├── waves/
│   └── table.ts              # Wave configurations
├── systems/
│   └── spawn.ts              # Spawn system
├── state/
│   └── world.ts              # Updated with enemies
└── types.ts                  # Enemy & WaveConfig types

tests/
└── spawn.spec.ts             # Spawn tests (15 tests)
```

## Test Results

**All 82 tests passing (+15 new):**
- ✓ `tests/spawn.spec.ts` (15 tests) - Spawning, determinism, wave progression
- ✓ Previous tests (67 tests) - All systems still passing

### Acceptance Criteria Met

**✓ Deterministic Spawning:**
```typescript
// Same seed → identical counts and types at any minute
const enemies1 = simulateMinute(seed, 1, playerPos);
const enemies2 = simulateMinute(seed, 1, playerPos);

expect(enemies1.length).toBe(enemies2.length); // ±0%
expect(countByType(enemies1)).toEqual(countByType(enemies2));
```

**✓ Safe Spawn Radius:**
```typescript
// All enemies spawn ≥400px from player
for (const enemy of allEnemies) {
  const distance = calculateDistance(enemy.pos, playerPos);
  expect(distance).toBeGreaterThanOrEqual(400);
}
```

**✓ Per-Frame Spawn Cap:**
```typescript
// High accumulator (many pending spawns)
accumulator = 10;
const result = stepSpawns(dt, accumulator, rng, 5, playerPos);

// Never exceeds cap
expect(result.newEnemies.length).toBeLessThanOrEqual(12);
```

## Code Statistics

### New Code (System 4)
- `src/waves/table.ts`: ~180 LOC
- `src/systems/spawn.ts`: ~200 LOC
- `src/types.ts` (additions): ~40 LOC
- `src/state/world.ts` (updates): ~25 LOC
- `src/App.tsx` (updates): ~50 LOC

**Total New Core Implementation: ~495 LOC**

### Tests
- `tests/spawn.spec.ts`: ~295 LOC

**Total New Tests: ~295 LOC**

### Total Project
- Core: ~1,615 LOC
- Tests: ~1,355 LOC
- Config: ~150 LOC
- **Grand Total: ~3,120 LOC**

## Design Decisions

### 1. Spawn Accumulator Pattern

**Instead of intervals/timers:**
```typescript
// Bad (non-deterministic, memory overhead)
setInterval(() => spawnEnemy(), 1000 / spawnRate);

// Good (deterministic, zero allocation)
accumulator += dt;
while (accumulator >= spawnInterval) {
  spawnEnemy();
  accumulator -= spawnInterval;
}
```

**Benefits:**
- Perfectly deterministic
- No closures or timers
- Works with fixed timestep
- Easy to serialize

### 2. Weighted Random Selection

**Cumulative distribution approach:**
```typescript
totalWeight = enemies.reduce((sum, e) => sum + e.weight, 0);
roll = random(0, totalWeight);

accumulated = 0;
for (enemy of enemies) {
  accumulated += enemy.weight;
  if (roll < accumulated) return enemy;
}
```

**Benefits:**
- O(n) selection (acceptable for small lists)
- Simple to configure (just weights)
- Easy to understand probabilities

### 3. Ring-Based Spawning

**Instead of random screen positions:**
```typescript
angle = random(0, 2π);
radius = random(minRadius, maxRadius);
pos = player + (cos(angle), sin(angle)) * radius;
```

**Benefits:**
- Never spawns on player
- Ensures reasonable distance
- Creates natural enemy "pressure"
- Easy to configure danger zone

### 4. Per-Frame Spawn Cap

**Prevents lag spikes:**
```typescript
spawnsThisFrame = 0;
while (canSpawn && spawnsThisFrame < MAX) {
  spawnEnemy();
  spawnsThisFrame++;
}
```

**Benefits:**
- Smooth frame times
- Accumulator carries excess to next frame
- No enemy loss (just delayed)
- Configurable cap per game needs

### 5. Elite System

**Multiplier-based enhancement:**
```typescript
hp = isElite ? baseHP * 3.0 : baseHP;
speed = isElite ? baseSpeed * 1.2 : baseSpeed;
damage = isElite ? baseDamage * 2.0 : baseDamage;
```

**Benefits:**
- Single boolean flag
- Scales with base stats
- Easy to tune
- Clear visual indicator

## Wave Progression Design

### Early Game (Minutes 0-2)
**Goal:** Tutorial, establish core loop
- Low spawn rate (2-4/sec)
- Simple enemies (Zombie, Fast)
- Rare elites (0-8%)

### Mid Game (Minutes 3-4)
**Goal:** Introduce complexity
- Medium spawn rate (5-6/sec)
- All enemy types appear
- Moderate elites (10-12%)

### Late Game (Minute 5+)
**Goal:** Maximum challenge
- High spawn rate (8/sec)
- Balanced enemy mix
- Frequent elites (15%)

## Usage Examples

### Simulate a Minute of Spawns
```typescript
const playerPos = { x: 400, y: 300 };
let accumulator = 0;
let rng = mkRng(42);
const enemies = [];

for (let frame = 0; frame < 60 * 60; frame++) { // 60 seconds
  const minute = Math.floor((frame * dt) / 60);
  const result = stepSpawns(dt, accumulator, rng, minute, playerPos);
  accumulator = result.newAccumulator;
  rng = result.rng;
  enemies.push(...result.newEnemies);
}

console.log(`Spawned ${enemies.length} enemies`);
```

### Check Wave Config
```typescript
const minute = Math.floor(state.time / 60);
const config = getWaveConfig(minute);

console.log(`Minute ${minute}: ${config.spawnRate}/sec`);
console.log(`Elite chance: ${(config.eliteChance * 100).toFixed(0)}%`);
```

### Count Enemies by Type
```typescript
const counts = { zombie: 0, fast: 0, tank: 0, swarm: 0 };
const eliteCount = enemies.filter(e => e.isElite).length;

for (const enemy of enemies) {
  counts[enemy.kind]++;
}
```

## Constraints Met

✓ **Deterministic:** Given seed+minute, same enemy counts/types (±0%)
✓ **Safe Spawning:** No enemies spawn within 400px player radius
✓ **Spawn Cap:** Maximum 12 spawns per frame enforced
✓ **Weighted Selection:** RNG-based type selection with configurable weights
✓ **Elite Chance:** Separate RNG roll for elite status
✓ **Ring Spawning:** Random angle and radius around player

## Performance Considerations

**Spawn System Overhead:**
- O(1) accumulator check
- O(n) weighted selection (n = 4 enemy types)
- O(m) spawning (m ≤ 12 per frame)
- Negligible impact on frame time

**Expected Spawn Rates:**
- Minute 0: ~2 enemies/sec = 120 enemies/minute
- Minute 5: ~8 enemies/sec = 480 enemies/minute
- Total after 5 minutes: ~2,100 enemies spawned

## Integration with Previous Systems

### System 1: Core Loop & RNG
- Uses deterministic RNG for all randomness
- Works with fixed 60Hz timestep
- Fully replay-compatible

### System 3: Weapons & Projectiles
- Enemies provide targets for projectiles
- Player position used for spawn positioning
- Separate from collision (future system)

## Next Steps (Future Systems)

- System 5: Enemy AI & Movement (chase player)
- System 6: Collision Detection (projectiles vs enemies)
- System 7: Damage System (apply projectile damage)
- System 8: Experience & Progression (drops, level ups)
- System 9: Screen bounds culling (remove off-screen enemies)

## Conclusion

System 4 provides a robust, deterministic enemy spawning system with smooth wave progression and elite variants. The spawn accumulator ensures perfect timing control, weighted selection creates varied encounters, and the per-frame cap prevents performance spikes.

All acceptance criteria met with zero tolerance for determinism.
