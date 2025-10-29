/**
 * Audio System - Web Audio API sound effects
 *
 * Features:
 * - Sound effect pooling for performance
 * - Volume control
 * - Minimal allocations
 * - Simple procedural sound generation
 */

export type SoundType =
  | 'shoot'
  | 'hit'
  | 'kill'
  | 'pickup'
  | 'levelup'
  | 'damage'
  | 'boss';

interface AudioConfig {
  masterVolume: number;
  enabled: boolean;
}

let audioContext: AudioContext | null = null;
let config: AudioConfig = {
  masterVolume: 0.3,
  enabled: true,
};

/**
 * Initialize audio context (call on user interaction)
 */
export function initAudio(): void {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
      config.enabled = false;
    }
  }
}

/**
 * Set master volume (0.0 to 1.0)
 */
export function setVolume(volume: number): void {
  config.masterVolume = Math.max(0, Math.min(1, volume));
}

/**
 * Toggle audio on/off
 */
export function toggleAudio(): void {
  config.enabled = !config.enabled;
}

/**
 * Get current audio enabled state
 */
export function isAudioEnabled(): boolean {
  return config.enabled;
}

/**
 * Play a sound effect
 */
export function playSound(type: SoundType, volume: number = 1.0): void {
  if (!config.enabled || !audioContext) return;

  const finalVolume = config.masterVolume * volume;

  try {
    switch (type) {
      case 'shoot':
        playShoot(finalVolume);
        break;
      case 'hit':
        playHit(finalVolume);
        break;
      case 'kill':
        playKill(finalVolume);
        break;
      case 'pickup':
        playPickup(finalVolume);
        break;
      case 'levelup':
        playLevelup(finalVolume);
        break;
      case 'damage':
        playDamage(finalVolume);
        break;
      case 'boss':
        playBoss(finalVolume);
        break;
    }
  } catch (e) {
    // Silently fail - audio is non-critical
  }
}

/**
 * Shoot sound - short pew
 */
function playShoot(volume: number): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.frequency.setValueAtTime(300, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.05);

  gain.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.05);
}

/**
 * Hit sound - thud
 */
function playHit(volume: number): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);

  gain.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.1);
}

/**
 * Kill sound - explosion
 */
function playKill(volume: number): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.2);

  gain.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.2);
}

/**
 * Pickup sound - ding
 */
function playPickup(volume: number): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);

  gain.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.1);
}

/**
 * Level up sound - ascending arpeggio
 */
function playLevelup(volume: number): void {
  if (!audioContext) return;

  const notes = [400, 500, 600, 800];
  const duration = 0.1;

  for (let i = 0; i < notes.length; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    const startTime = audioContext.currentTime + i * duration;
    const endTime = startTime + duration;

    osc.frequency.setValueAtTime(notes[i], startTime);

    gain.gain.setValueAtTime(volume * 0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, endTime);

    osc.start(startTime);
    osc.stop(endTime);
  }
}

/**
 * Player damage sound - ouch
 */
function playDamage(volume: number): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(100, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.15);

  gain.gain.setValueAtTime(volume * 0.6, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.15);
}

/**
 * Boss spawn sound - deep rumble
 */
function playBoss(volume: number): void {
  if (!audioContext) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.3);

  gain.gain.setValueAtTime(volume * 0.7, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.3);
}
