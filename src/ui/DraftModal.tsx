/**
 * S8: UI/HUD & Run States
 * Level-up draft modal - 3-card upgrade selection
 */

import { useEffect } from 'react';
import type { UpgradeCard } from '../types/game';

interface DraftModalProps {
  cards: UpgradeCard[];
  onSelect: (card: UpgradeCard) => void;
  onBanish?: (card: UpgradeCard) => void;
}

export function DraftModal({ cards, onSelect, onBanish }: DraftModalProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1' && cards[0]) {
        onSelect(cards[0]);
      } else if (e.key === '2' && cards[1]) {
        onSelect(cards[1]);
      } else if (e.key === '3' && cards[2]) {
        onSelect(cards[2]);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cards, onSelect]);

  return (
    <div className="draft-modal-overlay">
      <div className="draft-modal">
        <h2 className="draft-title">Level Up!</h2>
        <p className="draft-subtitle">Choose an upgrade</p>

        <div className="draft-cards">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className={`draft-card rarity-${card.rarity}`}
              onClick={() => onSelect(card)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelect(card);
                }
              }}
            >
              <div className="card-header">
                <div className="card-name">{card.name}</div>
                <div className="card-rarity">{card.rarity}</div>
              </div>

              <div className="card-description">{card.description}</div>

              <div className="card-footer">
                <span className="card-hotkey">{idx + 1}</span>
                {onBanish && (
                  <button
                    className="banish-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBanish(card);
                    }}
                  >
                    Banish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
