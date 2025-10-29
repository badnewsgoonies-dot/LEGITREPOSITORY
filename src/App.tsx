/**
 * Main App component - integrates game loop with React
 */

import { useEffect, useRef, useState } from 'react';
import { start } from './core/loop';
import { beginRun, endRun, log, exportRunLog } from './core/replay';
import { initWorld, updateWorld } from './state/world';
import { applyUpgrade } from './systems/draft';

import { initInput, cleanupInput } from './core/input';
import { initAudio } from './core/audio';
import { renderParticles } from './systems/particles';
import { applyScreenShake, restoreScreenShake } from './core/screenshake';

import type { WorldState, Upgrade } from './types';

const INITIAL_SEED = 42;

function App() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const loopHandleRef = useRef<ReturnType<typeof start> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize and start game loop
  useEffect(() => {
    // Initialize input system
    initInput();

    // Initialize audio system (requires user interaction, but we init context here)
    initAudio();

    const initialState = initWorld(INITIAL_SEED);
    setWorldState(initialState);

    // Start replay recording
    beginRun(INITIAL_SEED);

    // Start game loop
    const handle = start(initialState, {
      targetFPS: 60,
      maxFrameDelta: 50,
      onUpdate: (state) => {
        const updated = updateWorld(state);

        // Log events periodically for demo
        if (updated.frameCount % 60 === 0) {
          log({
            type: 'custom',
            frame: updated.frameCount,
            name: 'tick',
            data: { time: updated.time },
          });
        }

        return updated;
      },
      onRender: (state, alpha) => {
        setWorldState(state);
        renderGame(canvasRef.current, state, alpha);
      },
    });

    loopHandleRef.current = handle;
    setIsRunning(true);

    // Cleanup
    return () => {
      handle.stop();
      cleanupInput();
      setIsRunning(false);
    };
  }, []);

  // Handle pause/resume
  const togglePause = () => {
    if (loopHandleRef.current) {
      if (worldState?.isPaused) {
        loopHandleRef.current.resume();
      } else {
        loopHandleRef.current.pause();
      }
    }
  };

  // Export replay
  const handleExportReplay = () => {
    if (loopHandleRef.current && worldState) {
      const currentState = loopHandleRef.current.getState();
      const runLog = endRun(currentState);
      const json = exportRunLog(runLog);

      // Download as file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'replay-sample.json';
      a.click();
      URL.revokeObjectURL(url);

      // Restart recording
      beginRun(INITIAL_SEED);
    }
  };

  // Handle upgrade selection
  const handleUpgradeSelect = (upgrade: Upgrade) => {
    if (loopHandleRef.current && worldState?.draftChoice) {
      const currentState = loopHandleRef.current.getState();
      applyUpgrade(upgrade, currentState);
      currentState.draftChoice = null;
      currentState.isPaused = false;
      setWorldState({ ...currentState });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Nightfall Survivors - Core Loop Demo</h1>

      {/* Debug HUD */}
      <div
        style={{
          background: '#222',
          color: '#0f0',
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '4px',
        }}
      >
        <div>Status: {isRunning ? 'Running' : 'Stopped'}</div>
        <div>Paused: {worldState?.isPaused ? 'Yes' : 'No'}</div>
        <div>Frame: {worldState?.frameCount ?? 0}</div>
        <div>
          Time: {worldState?.time.toFixed(2) ?? 0}s | Minute:{' '}
          {Math.floor((worldState?.time ?? 0) / 60)}
        </div>
        <div>Seed: {worldState?.seed ?? INITIAL_SEED}</div>
        <div>
          Level: {worldState?.player.level ?? 1} | XP: {worldState?.player.xp ?? 0}/
          {worldState?.player.xpToNext ?? 0}
        </div>
        <div>
          Player HP: {worldState?.player.hp.toFixed(1) ?? 0}/{worldState?.player.maxHp ?? 0}
          {(worldState?.player.iframes ?? 0) > 0 && ' [INVINCIBLE]'}
        </div>
        <div>Weapons: {worldState?.weapons.length ?? 0}</div>
        <div>Upgrades: {worldState?.upgrades.length ?? 0}</div>
        <div>Enemies: {worldState?.enemies.length ?? 0}</div>
        <div>Projectiles: {worldState?.projectiles.length ?? 0}</div>
        <div>XP Gems: {worldState?.xpGems.length ?? 0}</div>
        <div>
          Pool: {worldState?.projectilesPool.available() ?? 0}/
          {worldState?.projectilesPool.size() ?? 0}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={togglePause} style={{ marginRight: '10px' }}>
          {worldState?.isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={handleExportReplay}>Export Replay</button>
      </div>

      {/* Canvas for future rendering */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #333', background: '#111' }}
      />

      {/* Info */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>
          <strong>System 1: Core Loop & Deterministic RNG</strong>
        </p>
        <p>
          ✓ Fixed 60Hz timestep
          <br />
          ✓ Deterministic xoroshiro128+ RNG
          <br />
          ✓ Replay recording system
          <br />✓ Frame delta clamping (50ms max)
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>System 3: Weapons & Projectiles</strong>
        </p>
        <p>
          ✓ Object pooling (512 projectiles)
          <br />
          ✓ Cooldown accumulator pattern
          <br />
          ✓ Deterministic spread angles
          <br />✓ TTL-based lifecycle
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>System 4: Enemy Spawner & Waves</strong>
        </p>
        <p>
          ✓ Deterministic wave progression
          <br />
          ✓ Weighted enemy type selection
          <br />
          ✓ Elite enemies with multipliers
          <br />✓ Per-frame spawn cap (12 max)
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>System 5: Collision, Damage & Knockback</strong>
        </p>
        <p>
          ✓ Circle collision detection
          <br />
          ✓ Player i-frame system (1.0s immunity)
          <br />
          ✓ Knockback mechanics
          <br />✓ Damage event logging
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>System 6: XP & Level-Up Draft</strong>
        </p>
        <p>
          ✓ XP gem drops on enemy kill
          <br />
          ✓ Proximity magnet (80px + upgrades)
          <br />
          ✓ Level-up draft (3 weighted upgrades)
          <br />✓ Deterministic draft rolls
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>System 7: Stats & Scaling</strong>
        </p>
        <p>
          ✓ Upgrade multipliers (damage, cooldown, count)
          <br />
          ✓ Player regeneration
          <br />
          ✓ Enemy difficulty curve
          <br />✓ Weapon stat updates
        </p>
      </div>

      {/* Draft Modal */}
      {worldState?.draftChoice && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#222',
              padding: '30px',
              borderRadius: '10px',
              border: '2px solid #0f0',
              maxWidth: '800px',
            }}
          >
            <h2 style={{ color: '#0f0', marginTop: 0 }}>Level Up!</h2>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>
              Choose an upgrade (Level {worldState.player.level})
            </p>

            <div style={{ display: 'flex', gap: '20px' }}>
              {worldState.draftChoice.upgrades.map((upgrade) => {
                const rarityColor =
                  upgrade.rarity === 'epic'
                    ? '#ff00ff'
                    : upgrade.rarity === 'rare'
                    ? '#00aaff'
                    : '#aaa';

                return (
                  <button
                    key={upgrade.id}
                    onClick={() => handleUpgradeSelect(upgrade)}
                    style={{
                      flex: 1,
                      padding: '20px',
                      background: '#333',
                      border: `2px solid ${rarityColor}`,
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = '#444')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = '#333')
                    }
                  >
                    <div
                      style={{
                        color: rarityColor,
                        fontWeight: 'bold',
                        marginBottom: '8px',
                      }}
                    >
                      {upgrade.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      {upgrade.description}
                    </div>
                    <div
                      style={{
                        marginTop: '10px',
                        fontSize: '11px',
                        color: '#888',
                      }}
                    >
                      {upgrade.rarity.toUpperCase()} | Level{' '}
                      {upgrade.currentLevel + 1}/{upgrade.maxLevel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* Game Over Screen */}
      {worldState?.gameState === 'game_over' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#222',
              padding: '40px',
              borderRadius: '10px',
              border: '3px solid #f00',
              textAlign: 'center',
              maxWidth: '500px',
            }}
          >
            <h1 style={{ color: '#f00', marginTop: 0, fontSize: '48px' }}>
              GAME OVER
            </h1>
            <div style={{ color: '#aaa', marginBottom: '30px' }}>
              <p style={{ fontSize: '20px' }}>
                You survived {Math.floor(worldState.stats.timeSurvived / 60)}{' '}
                minutes {Math.floor(worldState.stats.timeSurvived % 60)} seconds
              </p>
              <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
                <div>Level: {worldState.player.level}</div>
                <div>Enemies Killed: {worldState.stats.enemiesKilled}</div>
                <div>Upgrades: {worldState.upgrades.length}</div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                background: '#f00',
                border: 'none',
                borderRadius: '5px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#ff3333')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#f00')}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {worldState?.gameState === 'victory' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 20, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#222',
              padding: '40px',
              borderRadius: '10px',
              border: '3px solid #0f0',
              textAlign: 'center',
              maxWidth: '500px',
            }}
          >
            <h1 style={{ color: '#0f0', marginTop: 0, fontSize: '48px' }}>
              VICTORY!
            </h1>
            <div style={{ color: '#aaa', marginBottom: '30px' }}>
              <p style={{ fontSize: '20px', color: '#0f0' }}>
                You survived all 20 minutes!
              </p>
              <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
                <div>Final Level: {worldState.player.level}</div>
                <div>Enemies Killed: {worldState.stats.enemiesKilled}</div>
                <div>Upgrades Collected: {worldState.upgrades.length}</div>
                <div>Final HP: {worldState.player.hp}/{worldState.player.maxHp}</div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                background: '#0f0',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#3f3')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#0f0')}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Simple canvas rendering for visualization.
 * @param canvas - Canvas element
 * @param state - World state
 * @param _alpha - Interpolation factor [0, 1] (unused for now)
 */
function renderGame(
  canvas: HTMLCanvasElement | null,
  state: WorldState,
  _alpha: number
) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply screen shake
  applyScreenShake(ctx, state.screenShake);

  // Draw player
  const playerPos = state.player.pos;
  const hasIframes = state.player.iframes > 0;

  // Player body
  ctx.fillStyle = hasIframes ? '#00ffff' : '#0ff'; // Cyan when invincible, bright cyan normally
  ctx.beginPath();
  ctx.arc(playerPos.x, playerPos.y, state.player.radius, 0, Math.PI * 2);
  ctx.fill();

  // I-frame indicator (pulsing ring)
  if (hasIframes) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const pulseSize = state.player.radius + 4 + Math.sin(state.time * 10) * 2;
    ctx.beginPath();
    ctx.arc(playerPos.x, playerPos.y, pulseSize, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw projectiles (player)
  ctx.fillStyle = '#ff0';
  for (const proj of state.projectiles) {
    if (proj.active) {
      ctx.beginPath();
      ctx.arc(proj.pos.x, proj.pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw enemy projectiles
  ctx.fillStyle = '#f80';
  for (const proj of state.enemyProjectiles) {
    if (proj.active) {
      ctx.beginPath();
      ctx.arc(proj.pos.x, proj.pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw enemies
  for (const enemy of state.enemies) {
    // Color based on type and elite status
    let color = '#f00'; // default red
    if (enemy.kind === 'fast') color = '#ff6600';
    if (enemy.kind === 'tank') color = '#660000';
    if (enemy.kind === 'swarm') color = '#ff9999';
    if (enemy.kind === 'ranged') color = '#9900ff';
    if (enemy.kind === 'shielded') color = '#00ccff';
    if (enemy.kind === 'boss') color = '#cc0000';
    if (enemy.isElite) color = '#ff00ff'; // elite purple

    ctx.fillStyle = color;
    ctx.beginPath();
    const size = enemy.kind === 'tank' ? 8 : enemy.kind === 'swarm' ? 4 : enemy.kind === 'boss' ? 15 : 6;
    ctx.arc(enemy.pos.x, enemy.pos.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw shield indicator for shielded enemies
    if (enemy.kind === 'shielded' && enemy.shieldHp && enemy.shieldHp > 0) {
      const shieldPercent = enemy.maxShieldHp ? enemy.shieldHp / enemy.maxShieldHp : 0;
      ctx.strokeStyle = `rgba(0, 200, 255, ${shieldPercent})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(enemy.pos.x, enemy.pos.y, size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw elite indicator
    if (enemy.isElite) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.pos.x, enemy.pos.y, size + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw XP gems
  ctx.fillStyle = '#00ff00';
  for (const gem of state.xpGems) {
    ctx.beginPath();
    ctx.arc(gem.pos.x, gem.pos.y, gem.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw magnet range indicator (subtle)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(gem.pos.x, gem.pos.y, gem.magnetRange, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw power-ups
  for (const powerUp of state.powerUps) {
    // Color based on type
    let color = '#fff';
    if (powerUp.type === 'heal') color = '#ff6b9d'; // Pink
    if (powerUp.type === 'screen_clear') color = '#ffd700'; // Gold
    if (powerUp.type === 'flamethrower') color = '#ff4500'; // Orange-red

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(powerUp.pos.x, powerUp.pos.y, powerUp.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw icon or symbol
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let symbol = '?';
    if (powerUp.type === 'heal') symbol = '+';
    if (powerUp.type === 'screen_clear') symbol = '⚡';
    if (powerUp.type === 'flamethrower') symbol = '🔥';
    ctx.fillText(symbol, powerUp.pos.x, powerUp.pos.y);

    // Draw pulsing ring
    const pulseSize = powerUp.radius + 2 + Math.sin(state.time * 3) * 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(powerUp.pos.x, powerUp.pos.y, pulseSize, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw particles
  renderParticles(ctx, state.particles);

  // Restore screen shake (before UI elements)
  restoreScreenShake(ctx);

  // Debug text (not affected by shake)

  const minute = Math.floor(state.time / 60);
  ctx.fillStyle = '#0f0';
  ctx.font = '14px monospace';
  ctx.fillText(`Frame: ${state.frameCount}`, 10, 20);
  ctx.fillText(`Time: ${state.time.toFixed(2)}s | Min: ${minute}`, 10, 40);
  ctx.fillText(
    `Player HP: ${state.player.hp}/${state.player.maxHp}${hasIframes ? ' [INVINCIBLE]' : ''}`,
    10,
    60
  );
  ctx.fillText(`Enemies: ${state.enemies.length}`, 10, 80);
  ctx.fillText(`Projectiles: ${state.projectiles.length}`, 10, 100);
  ctx.fillText(
    `Pool: ${state.projectilesPool.available()}/${state.projectilesPool.size()}`,
    10,
    120
  );

  // Flamethrower buff indicator
  if (state.flamethrowerTime > 0) {
    ctx.fillStyle = '#ff4500';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(
      `🔥 FLAMETHROWER: ${state.flamethrowerTime.toFixed(1)}s 🔥`,
      10,
      150
    );
  }
}

export default App;
