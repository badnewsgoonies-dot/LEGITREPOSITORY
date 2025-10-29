/**
 * S8: UI/HUD & Run States
 * Main HUD overlay - HP bar, XP bar, timer, stats
 */

import type { GameState } from '../types/game';

interface HUDProps {
  state: GameState;
}

export function HUD({ state }: HUDProps) {
  const { player, time, paused } = state;

  // Format time as MM:SS
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // HP percentage
  const hpPercent = (player.hp / player.maxHp) * 100;

  // XP percentage
  const xpPercent = (player.xp / player.xpToNext) * 100;

  return (
    <div className="hud">
      {/* Top bar */}
      <div className="hud-top">
        {/* Timer */}
        <div className="timer">
          <span className="label">Time</span>
          <span className="value">{timeStr}</span>
        </div>

        {/* Level */}
        <div className="level">
          <span className="label">Level</span>
          <span className="value">{player.level}</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="hud-bottom">
        {/* HP Bar */}
        <div className="stat-bar">
          <div className="stat-label">HP</div>
          <div className="bar-container">
            <div className="bar bar-hp" style={{ width: `${hpPercent}%` }} />
          </div>
          <div className="stat-value">
            {Math.ceil(player.hp)} / {player.maxHp}
          </div>
        </div>

        {/* XP Bar */}
        <div className="stat-bar">
          <div className="stat-label">XP</div>
          <div className="bar-container">
            <div className="bar bar-xp" style={{ width: `${xpPercent}%` }} />
          </div>
          <div className="stat-value">
            {player.xp} / {player.xpToNext}
          </div>
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="pause-overlay">
          <div className="pause-text">PAUSED</div>
          <div className="pause-hint">Press ESC to resume</div>
        </div>
      )}
    </div>
  );
}
