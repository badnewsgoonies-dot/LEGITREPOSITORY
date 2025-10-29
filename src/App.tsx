/**
 * Main App component - integrates game loop with React
 */

import { useEffect, useRef, useState } from 'react';
import { start } from './core/loop';
import { beginRun, endRun, log, exportRunLog } from './core/replay';
import { initWorld, updateWorld } from './state/world';
import type { WorldState } from './types';

const INITIAL_SEED = 42;

function App() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const loopHandleRef = useRef<ReturnType<typeof start> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize and start game loop
  useEffect(() => {
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
        <div>Time: {worldState?.time.toFixed(2) ?? 0}s</div>
        <div>Seed: {worldState?.seed ?? INITIAL_SEED}</div>
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
      </div>
    </div>
  );
}

/**
 * Simple canvas rendering for visualization.
 * @param canvas - Canvas element
 * @param state - World state
 * @param alpha - Interpolation factor [0, 1]
 */
function renderGame(
  canvas: HTMLCanvasElement | null,
  state: WorldState,
  alpha: number
) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw a simple animated element to prove the loop works
  const x = (state.time * 100) % canvas.width;
  const y = canvas.height / 2 + Math.sin(state.time * 2) * 50;

  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Debug text
  ctx.fillStyle = '#0f0';
  ctx.font = '14px monospace';
  ctx.fillText(`Frame: ${state.frameCount}`, 10, 20);
  ctx.fillText(`Time: ${state.time.toFixed(2)}s`, 10, 40);
  ctx.fillText(`Alpha: ${alpha.toFixed(3)}`, 10, 60);
}

export default App;
