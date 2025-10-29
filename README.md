# Tetris - Line Bomb Edition

A classic Tetris game with a special **LINE BOMB** power-up feature!

## Features

### Core Tetris Mechanics
- **10x20 game board** with all 7 classic Tetris pieces (I, O, T, S, Z, J, L)
- **Smooth piece movement** with arrow keys
- **Piece rotation** with proper collision detection
- **Ghost piece preview** showing where the piece will land
- **Line clearing** with scoring system
- **Progressive difficulty** - speed increases with level
- **Next piece preview**
- **Score tracking** with levels and lines cleared

### LINE BOMB Power-Up
- **Press 'B' to clear the bottom row instantly!**
- Start with 3 LINE BOMBS per game
- Visual explosion effect when used
- Earn 500 points per bomb
- Strategic use required!

## How to Play

### Controls
- **← →** : Move piece left/right
- **↑** : Rotate piece clockwise
- **↓** : Soft drop (move down faster, earn points)
- **SPACE** : Hard drop (instant drop to bottom)
- **B** : Use LINE BOMB power-up (clears bottom row)
- **P** : Pause game

### Scoring
- **Soft drop**: 1 point per row
- **Hard drop**: 2 points per row
- **Line clear**: 100 × level (1 line), 300 × level (2 lines), 500 × level (3 lines), 800 × level (4 lines)
- **LINE BOMB**: 500 points

### Objective
- Clear lines by filling complete horizontal rows
- Survive as long as possible
- Use LINE BOMBS strategically to escape tight situations
- Reach the highest score!

## Getting Started

### Play Locally
1. Clone this repository
2. Open `index.html` in your web browser
3. Start playing!

No build process or dependencies required - just pure HTML, CSS, and JavaScript!

## Technical Details

### Implementation Approach
Following rapid prototyping patterns for fast development:
- **Vanilla JavaScript** - No framework overhead
- **Canvas rendering** - Smooth 60 FPS gameplay
- **Pre-defined rotations** - Simple and predictable piece behavior
- **setInterval game loop** - Standard and reliable
- **Direct collision detection** - Brute force but clear logic

### Files
- `index.html` - Game structure and UI
- `style.css` - Styling and animations
- `tetris.js` - Game logic and mechanics

### Code Quality
- Clean, readable code
- Simple patterns over clever ones
- Commented for learning
- Error handling with try-catch

## Development Notes

Built following the **Tetris Onboarding Document** philosophy:
- Prioritize speed over perfection
- Use simple patterns for rapid prototyping
- Focus on working prototype first
- Ship MVP, iterate later

**Total Development Time**: ~1-2 hours
**Lines of Code**: ~600 lines

## Future Enhancements (V2 Ideas)
- [ ] More power-up types (freeze time, clear column, etc.)
- [ ] High score persistence (localStorage)
- [ ] Sound effects and music
- [ ] Touch controls for mobile
- [ ] Multiplayer mode
- [ ] Custom themes

## License

MIT License - Free to use and modify!

---

**Have fun and happy bombing!** 💣
