/**
 * Character Selection Component
 * Vampire Survivors inspired design with character cards
 */

import React from 'react';
import type { CharacterDefinition } from '../data/characters';

interface CharacterSelectProps {
  characters: CharacterDefinition[];
  selectedCharacterId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function CharacterSelect({
  characters,
  selectedCharacterId,
  onSelect,
  onConfirm,
  onBack,
}: CharacterSelectProps) {
  const selectedChar = characters.find(c => c.id === selectedCharacterId);

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
        fontFamily: 'monospace',
        color: '#fff',
        padding: '40px',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '40px',
          color: '#ffd700',
          textShadow: '0 0 10px #ffd700',
        }}
      >
        SELECT YOUR CHARACTER
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '40px' }}>
        {/* Character Grid */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '20px',
            alignContent: 'start',
            overflowY: 'auto',
            padding: '10px',
          }}
        >
          {characters.map(char => (
            <CharacterCard
              key={char.id}
              character={char}
              isSelected={char.id === selectedCharacterId}
              onSelect={() => onSelect(char.id)}
            />
          ))}
        </div>

        {/* Character Details Panel */}
        {selectedChar && (
          <div
            style={{
              width: '400px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '3px solid #ffd700',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Portrait */}
            <div
              style={{
                width: '100%',
                height: '200px',
                background: `linear-gradient(135deg, ${selectedChar.portrait} 0%, #000 100%)`,
                border: '3px solid #ffd700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '72px',
              }}
            >
              {selectedChar.name[0]}
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffd700',
                textAlign: 'center',
              }}
            >
              {selectedChar.name}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '16px',
                color: '#ccc',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              {selectedChar.description}
            </div>

            {/* Starting Weapon */}
            <div style={{ fontSize: '14px', color: '#aaa' }}>
              <div style={{ color: '#ffd700', marginBottom: '5px' }}>Starting Weapon:</div>
              <div>{selectedChar.startingWeapon.toUpperCase()}</div>
            </div>

            {/* Passive */}
            {selectedChar.passive && (
              <div style={{ fontSize: '14px', color: '#aaa' }}>
                <div style={{ color: '#ffd700', marginBottom: '5px' }}>Passive:</div>
                <div style={{ color: '#0f0' }}>{selectedChar.passive}</div>
              </div>
            )}

            {/* Stats */}
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              <div style={{ color: '#ffd700', marginBottom: '10px', fontSize: '14px' }}>
                Stats:
              </div>
              <StatRow label="Max HP" value={selectedChar.baseStats.maxHp} />
              <StatRow label="Move Speed" value={`${(selectedChar.baseStats.moveSpeed * 100).toFixed(0)}%`} />
              <StatRow label="Might" value={`${(selectedChar.baseStats.might * 100).toFixed(0)}%`} />
              {selectedChar.baseStats.amount > 0 && (
                <StatRow label="Amount" value={`+${selectedChar.baseStats.amount}`} />
              )}
              {selectedChar.baseStats.growth !== 1.0 && (
                <StatRow label="Growth" value={`${(selectedChar.baseStats.growth * 100).toFixed(0)}%`} />
              )}
              {selectedChar.baseStats.area !== 1.0 && (
                <StatRow label="Area" value={`${(selectedChar.baseStats.area * 100).toFixed(0)}%`} />
              )}
              {selectedChar.baseStats.revivals > 0 && (
                <StatRow label="Revivals" value={selectedChar.baseStats.revivals} />
              )}
            </div>

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              style={{
                padding: '15px',
                fontSize: '20px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: '#000',
                background: 'linear-gradient(90deg, #ffd700 0%, #ffed4e 100%)',
                border: '3px solid #ffd700',
                cursor: 'pointer',
                marginTop: 'auto',
                boxShadow: '0 0 20px #ffd700',
              }}
            >
              START WITH {selectedChar.name.toUpperCase()}
            </button>
          </div>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '10px 30px',
          fontSize: '16px',
          fontFamily: 'monospace',
          color: '#ffd700',
          background: 'transparent',
          border: '2px solid #ffd700',
          cursor: 'pointer',
        }}
      >
        ← BACK
      </button>
    </div>
  );
}

function CharacterCard({
  character,
  isSelected,
  onSelect,
}: {
  character: CharacterDefinition;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isSelected
          ? 'rgba(255, 215, 0, 0.2)'
          : isHovered
          ? 'rgba(255, 215, 0, 0.1)'
          : 'rgba(0, 0, 0, 0.5)',
        border: `3px solid ${isSelected ? '#ffd700' : isHovered ? '#ffd700' : '#666'}`,
        padding: '15px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: isSelected ? '0 0 20px #ffd700' : 'none',
        opacity: character.unlocked ? 1 : 0.5,
        pointerEvents: character.unlocked ? 'auto' : 'none',
      }}
    >
      {/* Portrait */}
      <div
        style={{
          width: '100%',
          height: '100px',
          background: `linear-gradient(135deg, ${character.portrait} 0%, #000 100%)`,
          border: '2px solid #ffd700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '2px 2px 4px #000',
        }}
      >
        {character.name[0]}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: isSelected ? '#ffd700' : '#fff',
          textAlign: 'center',
        }}
      >
        {character.name}
      </div>

      {/* Locked Indicator */}
      {!character.unlocked && (
        <div
          style={{
            fontSize: '12px',
            color: '#f00',
            textAlign: 'center',
          }}
        >
          🔒 LOCKED
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
      <span>{label}:</span>
      <span style={{ color: '#fff' }}>{value}</span>
    </div>
  );
}
