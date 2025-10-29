/**
 * Main React App - game + UI
 */

import { useEffect, useRef, useState } from 'react';
import { createGame, updateGame, selectDraftCard, togglePause, resetGame } from './core/game';
import type { GameEngine } from './core/game';
import { setUpdateCallback, start as startLoop } from './core/loop';
import { Renderer } from './core/renderer';
import { HUD } from './ui/HUD';
import { DraftModal } from './ui/DraftModal';
import { GameOver } from './ui/GameOver';
import { startRecording, finishRecording, exportReplay, hashState } from './core/replay';
import './ui/styles.css';

const GAME_SEED = 42;

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [, forceUpdate] = useState({});

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine and renderer
    engineRef.current = createGame(GAME_SEED);
    rendererRef.current = new Renderer(canvasRef.current);

    // Start replay recording
    startRecording(GAME_SEED);

    // Set update callback
    setUpdateCallback((dt: number) => {
      if (engineRef.current) {
        updateGame(engineRef.current, dt);
        forceUpdate({});
      }
    });

    // Start game loop
    startLoop();

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      const { input } = engineRef.current;

      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          input.up = true;
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          input.down = true;
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          input.left = true;
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          input.right = true;
          break;
        case 'Escape':
          togglePause(engineRef.current);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      const { input } = engineRef.current;

      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          input.up = false;
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          input.down = false;
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          input.left = false;
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          input.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Render loop
  useEffect(() => {
    const render = () => {
      if (engineRef.current && rendererRef.current) {
        rendererRef.current.render(engineRef.current.state);
      }
      requestAnimationFrame(render);
    };

    render();
  }, []);

  const engine = engineRef.current;
  if (!engine) {
    return <div>Loading...</div>;
  }

  const handleRestart = () => {
    if (engineRef.current) {
      // Finish replay
      const log = finishRecording(hashState(engineRef.current.state));
      console.log('Replay:', exportReplay(log));

      // Reset
      resetGame(engineRef.current, GAME_SEED);
      startRecording(GAME_SEED);
    }
  };

  return (
    <div className="app">
      <canvas ref={canvasRef} />

      <HUD state={engine.state} />

      {engine.draftCards && (
        <DraftModal
          cards={engine.draftCards}
          onSelect={(card) => selectDraftCard(engine, card)}
        />
      )}

      {engine.state.gameOver && (
        <GameOver
          won={engine.state.won}
          time={engine.state.time}
          level={engine.state.player.level}
          kills={engine.kills}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
