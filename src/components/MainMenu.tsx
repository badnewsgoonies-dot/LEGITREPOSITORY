/**
 * Main Menu Component
 * Vampire Survivors inspired design
 */

import React from 'react';

interface MainMenuProps {
  onStart: () => void;
  onCharacterSelect: () => void;
  onSettings: () => void;
}

export function MainMenu({ onStart, onCharacterSelect, onSettings }: MainMenuProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        color: '#fff',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: '72px',
          fontWeight: 'bold',
          marginBottom: '60px',
          textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000',
          color: '#ffd700',
          letterSpacing: '4px',
        }}
      >
        NIGHTFALL SURVIVORS
      </div>

      {/* Menu Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <MenuButton onClick={onStart}>START GAME</MenuButton>
        <MenuButton onClick={onCharacterSelect}>SELECT CHARACTER</MenuButton>
        <MenuButton onClick={onSettings}>SETTINGS</MenuButton>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          fontSize: '14px',
          color: '#666',
        }}
      >
        Press WASD to move • Survive 20 minutes
      </div>
    </div>
  );
}

function MenuButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '20px 60px',
        fontSize: '24px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        color: isHovered ? '#000' : '#ffd700',
        background: isHovered
          ? 'linear-gradient(90deg, #ffd700 0%, #ffed4e 100%)'
          : 'transparent',
        border: '3px solid #ffd700',
        borderRadius: '0',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textShadow: isHovered ? 'none' : '0 0 10px #ffd700',
        boxShadow: isHovered
          ? '0 0 20px #ffd700, inset 0 0 20px rgba(255,215,0,0.3)'
          : 'none',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {children}
    </button>
  );
}
