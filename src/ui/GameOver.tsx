/**
 * S8: UI/HUD & Run States
 * Game over / Victory screen
 */

interface GameOverProps {
  won: boolean;
  time: number;
  level: number;
  kills: number;
  onRestart: () => void;
}

export function GameOver({ won, time, level, kills, onRestart }: GameOverProps) {
  // Format time
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const timeStr = `${minutes}m ${seconds}s`;

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h1 className={`game-over-title ${won ? 'victory' : 'defeat'}`}>
          {won ? 'VICTORY!' : 'GAME OVER'}
        </h1>

        <div className="game-over-stats">
          <div className="stat-row">
            <span className="stat-label">Time Survived:</span>
            <span className="stat-value">{timeStr}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Level Reached:</span>
            <span className="stat-value">{level}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Enemies Defeated:</span>
            <span className="stat-value">{kills}</span>
          </div>
        </div>

        <button className="restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}
