// Game Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

// Piece Definitions (all 4 rotations pre-defined)
const PIECES = {
    I: [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ],
    O: [
        [[1,1], [1,1]],
        [[1,1], [1,1]],
        [[1,1], [1,1]],
        [[1,1], [1,1]]
    ],
    T: [
        [[0,1,0], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,1], [0,1,0]],
        [[0,1,0], [1,1,0], [0,1,0]]
    ],
    S: [
        [[0,1,1], [1,1,0], [0,0,0]],
        [[0,1,0], [0,1,1], [0,0,1]],
        [[0,0,0], [0,1,1], [1,1,0]],
        [[1,0,0], [1,1,0], [0,1,0]]
    ],
    Z: [
        [[1,1,0], [0,1,1], [0,0,0]],
        [[0,0,1], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,0], [0,1,1]],
        [[0,1,0], [1,1,0], [1,0,0]]
    ],
    J: [
        [[1,0,0], [1,1,1], [0,0,0]],
        [[0,1,1], [0,1,0], [0,1,0]],
        [[0,0,0], [1,1,1], [0,0,1]],
        [[0,1,0], [0,1,0], [1,1,0]]
    ],
    L: [
        [[0,0,1], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,0], [0,1,1]],
        [[0,0,0], [1,1,1], [1,0,0]],
        [[1,1,0], [0,1,0], [0,1,0]]
    ]
};

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Power-up types
const POWERUP_TYPES = {
    LINE_BOMB: 'LINE_BOMB',
    GRAVITY_FLIP: 'GRAVITY_FLIP',
    SLOW_MO: 'SLOW_MO'
};

// Game State
let canvas, ctx, nextPieceCanvas, nextPieceCtx;
let board = [];
let currentPiece = null;
let currentPosition = { x: 0, y: 0 };
let currentRotation = 0;
let nextPiece = null;
let score = 0;
let level = 1;
let linesCleared = 0;
let gameOver = false;
let isPaused = false;
let gameLoop = null;
let dropInterval = 1000;
let lastDropTime = 0;

// Power-up State
let powerUpInventory = [];
let activeEffects = [];

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    nextPieceCanvas = document.getElementById('nextPieceCanvas');
    nextPieceCtx = nextPieceCanvas.getContext('2d');

    // Initialize board
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

    // Reset game state
    score = 0;
    level = 1;
    linesCleared = 0;
    gameOver = false;
    powerUpInventory = [];
    activeEffects = [];

    // Generate first pieces
    nextPiece = getRandomPiece();
    spawnNewPiece();

    // Update displays
    updateScore();
    updateLevel();
    updateLines();
    updatePowerUpInventory();
    updateActiveEffects();

    // Hide game over screen
    document.getElementById('gameOver').classList.add('hidden');

    // Start game loop
    lastDropTime = Date.now();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 16); // ~60 FPS

    // Draw initial state
    draw();
    drawNextPiece();
}

// Get random piece type
function getRandomPiece() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

// Spawn new piece
function spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    currentRotation = 0;
    currentPosition = {
        x: Math.floor(COLS / 2) - Math.floor(PIECES[currentPiece][0][0].length / 2),
        y: 0
    };

    // Check if game over
    if (hasCollision(currentPiece, currentPosition, currentRotation)) {
        gameOver = true;
        endGame();
    }

    drawNextPiece();
}

// Check collision
function hasCollision(pieceType, position, rotation) {
    const piece = PIECES[pieceType][rotation];

    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const newX = position.x + col;
                const newY = position.y + row;

                // Check boundaries
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                // Check board collision (but allow negative y for spawning)
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }

    return false;
}

// Lock piece to board
function lockPiece() {
    const piece = PIECES[currentPiece][currentRotation];

    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const boardX = currentPosition.x + col;
                const boardY = currentPosition.y + row;

                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece;
                }
            }
        }
    }

    // Check for line clears
    checkLines();

    // Spawn next piece
    spawnNewPiece();
}

// Check and clear completed lines
function checkLines() {
    let linesComplete = [];

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            linesComplete.push(row);
        }
    }

    if (linesComplete.length > 0) {
        // Clear lines
        linesComplete.forEach(row => {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
        });

        // Update score
        const points = [0, 100, 300, 500, 800][linesComplete.length];
        score += points * level;
        linesCleared += linesComplete.length;

        // Update level
        level = Math.floor(linesCleared / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);

        // Update displays
        updateScore();
        updateLevel();
        updateLines();

        // 20% chance to get a power-up per line clear
        for (let i = 0; i < linesComplete.length; i++) {
            if (Math.random() < 0.2) {
                addRandomPowerUp();
            }
        }
    }
}

// Add random power-up to inventory
function addRandomPowerUp() {
    const types = Object.values(POWERUP_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    powerUpInventory.push(randomType);
    updatePowerUpInventory();
}

// Use power-up from inventory
function usePowerUp(index) {
    if (index >= 0 && index < powerUpInventory.length) {
        const powerUpType = powerUpInventory[index];
        powerUpInventory.splice(index, 1);
        activatePowerUp(powerUpType);
        updatePowerUpInventory();
    }
}

// Activate power-up effect
function activatePowerUp(type) {
    try {
        switch (type) {
            case POWERUP_TYPES.LINE_BOMB:
                // Clear bottom row instantly
                clearBottomRow();
                break;

            case POWERUP_TYPES.GRAVITY_FLIP:
                // Start gravity flip effect for 15 seconds
                startTimedEffect('GRAVITY_FLIP', 15000);
                break;

            case POWERUP_TYPES.SLOW_MO:
                // Start slow-mo effect for 10 seconds
                startTimedEffect('SLOW_MO', 10000);
                break;
        }
    } catch (error) {
        console.error('Error activating power-up:', error);
    }
}

// Clear bottom row (LINE BOMB power-up)
function clearBottomRow() {
    board.splice(ROWS - 1, 1);
    board.unshift(Array(COLS).fill(0));

    // Add points
    score += 50;
    updateScore();
}

// Start timed effect (GRAVITY_FLIP or SLOW_MO)
function startTimedEffect(effectType, duration) {
    // Check if effect is already active
    const existingEffect = activeEffects.find(e => e.type === effectType);
    if (existingEffect) {
        // Extend duration
        existingEffect.endTime = Date.now() + duration;
    } else {
        // Add new effect
        activeEffects.push({
            type: effectType,
            endTime: Date.now() + duration
        });

        // Add visual class
        if (effectType === 'GRAVITY_FLIP') {
            document.querySelector('.main-area').classList.add('gravity-flip-active');
        } else if (effectType === 'SLOW_MO') {
            document.querySelector('.main-area').classList.add('slow-mo-active');
        }
    }

    updateActiveEffects();
}

// Update active effects (remove expired ones)
function updateActiveEffectsState() {
    const now = Date.now();
    const expiredEffects = activeEffects.filter(e => e.endTime <= now);

    // Remove expired effects
    expiredEffects.forEach(effect => {
        if (effect.type === 'GRAVITY_FLIP') {
            document.querySelector('.main-area').classList.remove('gravity-flip-active');
        } else if (effect.type === 'SLOW_MO') {
            document.querySelector('.main-area').classList.remove('slow-mo-active');
        }
    });

    activeEffects = activeEffects.filter(e => e.endTime > now);
    updateActiveEffects();
}

// Check if gravity is flipped
function isGravityFlipped() {
    return activeEffects.some(e => e.type === 'GRAVITY_FLIP');
}

// Get current speed multiplier
function getSpeedMultiplier() {
    return activeEffects.some(e => e.type === 'SLOW_MO') ? 0.5 : 1.0;
}

// Move piece
function movePiece(dx, dy) {
    const newPosition = {
        x: currentPosition.x + dx,
        y: currentPosition.y + dy
    };

    if (!hasCollision(currentPiece, newPosition, currentRotation)) {
        currentPosition = newPosition;
        return true;
    }

    return false;
}

// Rotate piece
function rotatePiece() {
    const newRotation = (currentRotation + 1) % 4;

    if (!hasCollision(currentPiece, currentPosition, newRotation)) {
        currentRotation = newRotation;
    }
}

// Hard drop
function hardDrop() {
    const isFlipped = isGravityFlipped();

    if (isFlipped) {
        // Drop upward
        while (movePiece(0, -1)) {}
    } else {
        // Drop downward
        while (movePiece(0, 1)) {}
    }

    lockPiece();
}

// Game loop update
function update() {
    if (gameOver || isPaused) return;

    // Update active effects
    updateActiveEffectsState();

    // Auto-drop piece
    const now = Date.now();
    const effectiveDropInterval = dropInterval / getSpeedMultiplier();

    if (now - lastDropTime > effectiveDropInterval) {
        const isFlipped = isGravityFlipped();

        if (isFlipped) {
            // Move upward when gravity is flipped
            if (!movePiece(0, -1)) {
                // If can't move up, lock piece
                lockPiece();
            }
        } else {
            // Normal downward movement
            if (!movePiece(0, 1)) {
                lockPiece();
            }
        }

        lastDropTime = now;
    }

    draw();
}

// Draw game board
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw locked pieces
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(col, row, COLORS[board[row][col]]);
            }
        }
    }

    // Draw current piece
    if (currentPiece) {
        const piece = PIECES[currentPiece][currentRotation];
        const color = COLORS[currentPiece];

        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    drawBlock(
                        currentPosition.x + col,
                        currentPosition.y + row,
                        color
                    );
                }
            }
        }
    }

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
}

// Draw single block
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
        x * BLOCK_SIZE + 1,
        y * BLOCK_SIZE + 1,
        BLOCK_SIZE - 2,
        BLOCK_SIZE - 2
    );

    // Add highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(
        x * BLOCK_SIZE + 1,
        y * BLOCK_SIZE + 1,
        BLOCK_SIZE - 2,
        BLOCK_SIZE / 3
    );
}

// Draw next piece preview
function drawNextPiece() {
    nextPieceCtx.fillStyle = '#000';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    if (nextPiece) {
        const piece = PIECES[nextPiece][0];
        const color = COLORS[nextPiece];
        const blockSize = 25;

        const offsetX = (nextPieceCanvas.width - piece[0].length * blockSize) / 2;
        const offsetY = (nextPieceCanvas.height - piece.length * blockSize) / 2;

        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    nextPieceCtx.fillStyle = color;
                    nextPieceCtx.fillRect(
                        offsetX + col * blockSize + 1,
                        offsetY + row * blockSize + 1,
                        blockSize - 2,
                        blockSize - 2
                    );
                }
            }
        }
    }
}

// Update UI displays
function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLevel() {
    document.getElementById('level').textContent = level;
}

function updateLines() {
    document.getElementById('lines').textContent = linesCleared;
}

function updatePowerUpInventory() {
    const container = document.getElementById('powerUpInventory');

    if (powerUpInventory.length === 0) {
        container.innerHTML = '<p style="opacity: 0.5; font-size: 12px;">No power-ups</p>';
        return;
    }

    container.innerHTML = '';
    powerUpInventory.forEach((powerUp, index) => {
        const item = document.createElement('div');
        item.className = `power-up-item ${powerUp.toLowerCase().replace('_', '-')}`;

        let name = '';
        switch (powerUp) {
            case POWERUP_TYPES.LINE_BOMB:
                name = 'LINE BOMB';
                break;
            case POWERUP_TYPES.GRAVITY_FLIP:
                name = 'GRAVITY FLIP';
                break;
            case POWERUP_TYPES.SLOW_MO:
                name = 'SLOW-MO';
                break;
        }

        item.innerHTML = `
            <span class="power-up-name">${name}</span>
            <span class="power-up-key">${index + 1}</span>
        `;

        container.appendChild(item);
    });
}

function updateActiveEffects() {
    const container = document.getElementById('activeEffects');

    if (activeEffects.length === 0) {
        container.innerHTML = '<p style="opacity: 0.5; font-size: 12px;">None</p>';
        return;
    }

    container.innerHTML = '';
    activeEffects.forEach(effect => {
        const item = document.createElement('div');
        item.className = `active-effect ${effect.type.toLowerCase().replace('_', '-')}`;

        let name = '';
        switch (effect.type) {
            case 'GRAVITY_FLIP':
                name = 'GRAVITY FLIP';
                break;
            case 'SLOW_MO':
                name = 'SLOW-MO';
                break;
        }

        const timeLeft = Math.ceil((effect.endTime - Date.now()) / 1000);

        item.innerHTML = `
            <div class="effect-name">${name}</div>
            <div class="effect-timer">${timeLeft}s remaining</div>
        `;

        container.appendChild(item);
    });
}

// End game
function endGame() {
    clearInterval(gameLoop);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver) return;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            draw();
            break;

        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            draw();
            break;

        case 'ArrowDown':
            e.preventDefault();
            const isFlipped = isGravityFlipped();
            if (isFlipped) {
                movePiece(0, -1);
            } else {
                movePiece(0, 1);
            }
            draw();
            break;

        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            draw();
            break;

        case ' ':
            e.preventDefault();
            hardDrop();
            draw();
            break;

        case '1':
            e.preventDefault();
            usePowerUp(0);
            break;

        case '2':
            e.preventDefault();
            usePowerUp(1);
            break;

        case '3':
            e.preventDefault();
            usePowerUp(2);
            break;
    }
});

// Restart button
document.getElementById('restartBtn').addEventListener('click', () => {
    init();
});

// Start game on load
window.addEventListener('load', () => {
    init();
});
