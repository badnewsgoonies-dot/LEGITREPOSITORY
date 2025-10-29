# Tetris with Power-ups

A fully functional Tetris clone with two exciting power-ups!

## Features

- Classic Tetris gameplay (10x20 grid)
- All 7 standard Tetris pieces (I, J, L, O, S, T, Z)
- Piece rotation and movement
- Line clearing and scoring system
- Progressive difficulty (level increases every 10 lines)
- Next piece preview
- Game over and restart functionality

## Power-ups

### 1. LINE BOMB (B key)
- Clears the bottom row instantly
- Useful for emergency situations
- Awards 50 bonus points

### 2. SLOW-MO (S key)
- Halves the game speed for 10 seconds
- Gives you time to think and position pieces
- Visual indicator shows when active
- Cannot be activated while already active

## Controls

- **← →** : Move piece left/right
- **↓** : Soft drop (faster fall, bonus points)
- **↑** : Rotate piece clockwise
- **Space** : Hard drop (instant drop, bonus points)
- **P** : Pause game
- **B** : Activate LINE BOMB power-up
- **S** : Activate SLOW-MO power-up

## Scoring

- **100 points** per line cleared
- **300 points** for 2 lines (double)
- **500 points** for 3 lines (triple)
- **800 points** for 4 lines (Tetris!)
- **+1 point** per soft drop move
- **+2 points** per hard drop move
- **50 points** for using LINE BOMB

Score multiplied by current level!

## How to Play

1. Open `index.html` in a web browser
2. Or start a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Then visit http://localhost:8000

3. Use arrow keys to control pieces
4. Clear lines to score points
5. Use power-ups strategically to survive longer!

## Game Rules

- Game starts at Level 1
- Every 10 lines cleared increases the level
- Game speed increases with each level
- Game ends when a new piece cannot spawn (board is full)
- Try to achieve the highest score possible!

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- No external dependencies
- Fully client-side (works offline)
- Responsive controls with collision detection
- Smooth piece rotation using pre-defined rotation matrices