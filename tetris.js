// Canvas setup
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF', // Z
];

// Tetris pieces (7 standard pieces with 4 rotations each)
const PIECES = {
    I: [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ],
    J: [
        [[2,0,0], [2,2,2], [0,0,0]],
        [[0,2,2], [0,2,0], [0,2,0]],
        [[0,0,0], [2,2,2], [0,0,2]],
        [[0,2,0], [0,2,0], [2,2,0]]
    ],
    L: [
        [[0,0,3], [3,3,3], [0,0,0]],
        [[0,3,0], [0,3,0], [0,3,3]],
        [[0,0,0], [3,3,3], [3,0,0]],
        [[3,3,0], [0,3,0], [0,3,0]]
    ],
    O: [
        [[4,4], [4,4]],
        [[4,4], [4,4]],
        [[4,4], [4,4]],
        [[4,4], [4,4]]
    ],
    S: [
        [[0,5,5], [5,5,0], [0,0,0]],
        [[0,5,0], [0,5,5], [0,0,5]],
        [[0,0,0], [0,5,5], [5,5,0]],
        [[5,0,0], [5,5,0], [0,5,0]]
    ],
    T: [
        [[0,6,0], [6,6,6], [0,0,0]],
        [[0,6,0], [0,6,6], [0,6,0]],
        [[0,0,0], [6,6,6], [0,6,0]],
        [[0,6,0], [6,6,0], [0,6,0]]
    ],
    Z: [
        [[7,7,0], [0,7,7], [0,0,0]],
        [[0,0,7], [0,7,7], [0,7,0]],
        [[0,0,0], [7,7,0], [0,7,7]],
        [[0,7,0], [7,7,0], [7,0,0]]
    ]
};

const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// Game state
let board = [];
let currentPiece = null;
let currentPosition = { x: 0, y: 0 };
let currentRotation = 0;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let isPaused = false;
let dropInterval = null;
let baseSpeed = 1000;
let currentSpeed = 1000;

// Power-up state
let slowMoActive = false;
let slowMoTimeout = null;

// Initialize game
function init() {
    // Create empty board
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

    // Reset game state
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    slowMoActive = false;
    baseSpeed = 1000;
    currentSpeed = 1000;

    // Clear any existing intervals/timeouts
    if (dropInterval) clearInterval(dropInterval);
    if (slowMoTimeout) clearTimeout(slowMoTimeout);

    // Generate first pieces
    nextPiece = randomPiece();
    spawnPiece();

    // Update UI
    updateUI();

    // Hide game over screen
    document.getElementById('game-over').classList.remove('show');

    // Start game loop
    startGameLoop();
}

// Get random piece
function randomPiece() {
    const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    return type;
}

// Spawn new piece
function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    currentRotation = 0;
    currentPosition = {
        x: Math.floor(COLS / 2) - 1,
        y: 0
    };

    // Check if game over (can't spawn piece)
    if (hasCollision(currentPiece, currentPosition, currentRotation)) {
        endGame();
    }

    drawNextPiece();
}

// Get piece shape
function getPieceShape(pieceType, rotation) {
    return PIECES[pieceType][rotation];
}

// Check collision
function hasCollision(pieceType, position, rotation) {
    const shape = getPieceShape(pieceType, rotation);

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = position.x + col;
                const newY = position.y + row;

                // Check boundaries
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                // Check board collision
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }

    return false;
}

// Move piece
function movePiece(dx, dy) {
    if (gameOver || isPaused) return false;

    const newPosition = {
        x: currentPosition.x + dx,
        y: currentPosition.y + dy
    };

    if (!hasCollision(currentPiece, newPosition, currentRotation)) {
        currentPosition = newPosition;
        draw();
        return true;
    }

    return false;
}

// Rotate piece
function rotatePiece() {
    if (gameOver || isPaused) return;

    const newRotation = (currentRotation + 1) % 4;

    if (!hasCollision(currentPiece, currentPosition, newRotation)) {
        currentRotation = newRotation;
        draw();
    }
}

// Hard drop
function hardDrop() {
    if (gameOver || isPaused) return;

    while (movePiece(0, 1)) {
        score += 2; // Bonus points for hard drop
    }

    lockPiece();
}

// Lock piece to board
function lockPiece() {
    const shape = getPieceShape(currentPiece, currentRotation);

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = currentPosition.x + col;
                const y = currentPosition.y + row;

                if (y >= 0) {
                    board[y][x] = shape[row][col];
                }
            }
        }
    }

    // Check for completed lines
    clearLines();

    // Spawn next piece
    spawnPiece();

    draw();
    updateUI();
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            // Remove the line
            board.splice(row, 1);
            // Add new empty line at top
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check same row again
        }
    }

    if (linesCleared > 0) {
        // Update score (100 per line, bonus for multiple)
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;

        // Update lines count
        lines += linesCleared;

        // Level up every 10 lines
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            updateSpeed();
        }
    }
}

// Update game speed
function updateSpeed() {
    baseSpeed = Math.max(100, 1000 - (level - 1) * 100);

    if (!slowMoActive) {
        currentSpeed = baseSpeed;
    }

    // Restart game loop with new speed
    if (dropInterval) {
        clearInterval(dropInterval);
        startGameLoop();
    }
}

// Game loop
function startGameLoop() {
    dropInterval = setInterval(() => {
        if (!gameOver && !isPaused) {
            if (!movePiece(0, 1)) {
                lockPiece();
            }
        }
    }, currentSpeed);
}

// Draw board
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }

    // Draw current piece
    if (currentPiece) {
        const shape = getPieceShape(currentPiece, currentRotation);
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    drawBlock(ctx, currentPosition.x + col, currentPosition.y + row, shape[row][col]);
                }
            }
        }
    }
}

// Draw single block
function drawBlock(context, x, y, colorIndex) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;

    context.fillStyle = COLORS[colorIndex];
    context.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);

    // Add border for depth
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 2;
    context.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw next piece
function drawNextPiece() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    const shape = getPieceShape(nextPiece, 0);
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                drawBlock(nextCtx, offsetX + col, offsetY + row, shape[row][col]);
            }
        }
    }
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// End game
function endGame() {
    gameOver = true;
    clearInterval(dropInterval);

    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.add('show');
}

// Power-up: LINE BOMB (clears bottom row)
function lineBomb() {
    if (gameOver || isPaused) return;

    // Visual feedback
    const bombElement = document.getElementById('bomb-powerup');
    bombElement.classList.add('active');
    setTimeout(() => bombElement.classList.remove('active'), 300);

    // Remove bottom row
    board.splice(ROWS - 1, 1);
    // Add new empty line at top
    board.unshift(Array(COLS).fill(0));

    // Small score bonus
    score += 50;

    draw();
    updateUI();
}

// Power-up: SLOW-MO (halves game speed for 10 seconds)
function slowMo() {
    if (gameOver || isPaused || slowMoActive) return;

    slowMoActive = true;
    currentSpeed = baseSpeed * 2; // Double the interval = half the speed

    // Visual feedback
    const slowMoElement = document.getElementById('slowmo-powerup');
    slowMoElement.classList.add('active');

    // Restart game loop with slow speed
    clearInterval(dropInterval);
    startGameLoop();

    // Reset after 10 seconds
    slowMoTimeout = setTimeout(() => {
        slowMoActive = false;
        currentSpeed = baseSpeed;
        slowMoElement.classList.remove('active');

        // Restart game loop with normal speed
        clearInterval(dropInterval);
        startGameLoop();
    }, 10000);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameOver) return;

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (movePiece(0, 1)) {
                score += 1; // Bonus for soft drop
                updateUI();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            isPaused = !isPaused;
            break;
        case 'b':
        case 'B':
            e.preventDefault();
            lineBomb();
            break;
        case 's':
        case 'S':
            e.preventDefault();
            slowMo();
            break;
    }
});

// Restart buttons
document.getElementById('restart-btn').addEventListener('click', init);
document.getElementById('restart-btn-2').addEventListener('click', init);

// Start game
init();
