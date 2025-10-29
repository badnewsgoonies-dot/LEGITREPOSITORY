// Tetris Game with LINE BOMB Power-up
// Simple patterns for rapid prototyping

// Constants
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
    L: '#f0a000',
    EMPTY: '#000000',
    GHOST: 'rgba(255, 255, 255, 0.3)',
    GRID: '#222'
};

// Tetris Pieces - Simple pattern: pre-define all rotations
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

// Game State
let canvas, ctx, nextPieceCanvas, nextPieceCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let linesCleared = 0;
let lineBombs = 3; // LINE BOMB power-up count
let gameOver = false;
let isPaused = false;
let gameLoopInterval = null;
let dropCounter = 0;
let dropInterval = 1000; // milliseconds

// Initialize game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    nextPieceCanvas = document.getElementById('next-piece-canvas');
    nextPieceCtx = nextPieceCanvas.getContext('2d');

    // Create empty board
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

    // Set up event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('restart-game-over').addEventListener('click', restartGame);

    // Start game
    nextPiece = createRandomPiece();
    spawnNewPiece();
    startGameLoop();
    updateUI();
    draw();
}

// Create random piece - Simple pattern: Math.random()
function createRandomPiece() {
    const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    return {
        type: type,
        rotation: 0,
        x: Math.floor(COLS / 2) - 1,
        y: 0,
        color: COLORS[type]
    };
}

// Spawn new piece
function spawnNewPiece() {
    currentPiece = nextPiece;
    currentPiece.x = Math.floor(COLS / 2) - 1;
    currentPiece.y = 0;
    nextPiece = createRandomPiece();

    // Check game over
    if (hasCollision(currentPiece)) {
        endGame();
    }

    drawNextPiece();
}

// Get current piece shape
function getPieceShape(piece) {
    return PIECES[piece.type][piece.rotation];
}

// Collision detection - Simple pattern: brute force check
function hasCollision(piece, offsetX = 0, offsetY = 0) {
    const shape = getPieceShape(piece);
    const newX = piece.x + offsetX;
    const newY = piece.y + offsetY;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardX = newX + col;
                const boardY = newY + row;

                // Check boundaries
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }

                // Check collision with placed pieces
                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Move piece
function movePiece(dx, dy) {
    if (!hasCollision(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        draw();
        return true;
    }
    return false;
}

// Rotate piece
function rotatePiece() {
    const oldRotation = currentPiece.rotation;
    currentPiece.rotation = (currentPiece.rotation + 1) % 4;

    if (hasCollision(currentPiece)) {
        // Try wall kicks
        if (!movePiece(1, 0) && !movePiece(-1, 0)) {
            currentPiece.rotation = oldRotation; // Revert rotation
        }
    }
    draw();
}

// Hard drop
function hardDrop() {
    while (movePiece(0, 1)) {
        score += 2; // Bonus points for hard drop
    }
    lockPiece();
}

// Lock piece to board
function lockPiece() {
    const shape = getPieceShape(currentPiece);

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.type;
                }
            }
        }
    }

    clearLines();
    spawnNewPiece();
    updateUI();
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            // Remove line
            board.splice(row, 1);
            // Add empty line at top
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check same row again
        }
    }

    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
}

// LINE BOMB Power-up - Clears bottom row instantly
function useLineBomb() {
    if (lineBombs <= 0 || gameOver) {
        return;
    }

    try {
        // Visual feedback
        flashBombExplosion();

        // Remove bottom row
        board.splice(ROWS - 1, 1);
        // Add empty line at top
        board.unshift(Array(COLS).fill(0));

        // Decrease bomb count
        lineBombs--;

        // Award points
        score += 500;

        updateUI();
        draw();
    } catch (error) {
        console.error('LINE BOMB error:', error);
    }
}

// Visual feedback for bomb explosion
function flashBombExplosion() {
    // Save current canvas state
    ctx.save();

    // Flash effect
    ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
    ctx.fillRect(0, (ROWS - 1) * BLOCK_SIZE, COLS * BLOCK_SIZE, BLOCK_SIZE);

    setTimeout(() => {
        draw();
    }, 100);

    ctx.restore();
}

// Update score
function updateScore(lines) {
    const points = {
        1: 100,
        2: 300,
        3: 500,
        4: 800
    };

    score += points[lines] * level;
    linesCleared += lines;

    // Level up every 10 lines
    level = Math.floor(linesCleared / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = linesCleared;
    document.getElementById('bombs').textContent = lineBombs;
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.EMPTY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw placed pieces
    drawBoard();

    // Draw ghost piece
    drawGhostPiece();

    // Draw current piece
    if (currentPiece) {
        drawPiece(currentPiece, ctx);
    }
}

// Draw grid lines
function drawGrid() {
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }

    // Horizontal lines
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
}

// Draw board
function drawBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(col, row, COLORS[board[row][col]], ctx);
            }
        }
    }
}

// Draw ghost piece (preview where piece will land)
function drawGhostPiece() {
    if (!currentPiece) return;

    const ghostPiece = { ...currentPiece };

    // Move ghost piece down until collision
    while (!hasCollision(ghostPiece, 0, 1)) {
        ghostPiece.y++;
    }

    // Draw ghost piece
    const shape = getPieceShape(ghostPiece);
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = (ghostPiece.x + col) * BLOCK_SIZE;
                const y = (ghostPiece.y + row) * BLOCK_SIZE;

                ctx.strokeStyle = COLORS.GHOST;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            }
        }
    }
}

// Draw piece
function drawPiece(piece, context) {
    const shape = getPieceShape(piece);

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                drawBlock(piece.x + col, piece.y + row, piece.color, context);
            }
        }
    }
}

// Draw single block
function drawBlock(x, y, color, context) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;

    // Fill block
    context.fillStyle = color;
    context.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);

    // Add highlight for 3D effect
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(px, py, BLOCK_SIZE, 3);
    context.fillRect(px, py, 3, BLOCK_SIZE);

    // Add shadow for 3D effect
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(px, py + BLOCK_SIZE - 3, BLOCK_SIZE, 3);
    context.fillRect(px + BLOCK_SIZE - 3, py, 3, BLOCK_SIZE);

    // Border
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    context.lineWidth = 1;
    context.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw next piece preview
function drawNextPiece() {
    nextPieceCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    const shape = getPieceShape(nextPiece);
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const px = (offsetX + col) * BLOCK_SIZE;
                const py = (offsetY + row) * BLOCK_SIZE;

                nextPieceCtx.fillStyle = nextPiece.color;
                nextPieceCtx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);

                nextPieceCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                nextPieceCtx.lineWidth = 1;
                nextPieceCtx.strokeRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Game loop - Simple pattern: setInterval
function startGameLoop() {
    let lastTime = Date.now();

    gameLoopInterval = setInterval(() => {
        if (!isPaused && !gameOver) {
            const now = Date.now();
            dropCounter += now - lastTime;
            lastTime = now;

            if (dropCounter > dropInterval) {
                if (!movePiece(0, 1)) {
                    lockPiece();
                }
                dropCounter = 0;
            }
        }
    }, 16); // ~60 FPS
}

// Keyboard controls
function handleKeyPress(e) {
    if (gameOver) return;

    try {
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
                    score += 1; // Soft drop bonus
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
            case 'b':
            case 'B':
                e.preventDefault();
                useLineBomb(); // LINE BOMB power-up
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                isPaused = !isPaused;
                break;
        }
    } catch (error) {
        console.error('Keyboard error:', error);
    }
}

// End game
function endGame() {
    gameOver = true;
    clearInterval(gameLoopInterval);

    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

// Restart game
function restartGame() {
    // Reset game state
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    lineBombs = 3; // Reset bombs
    gameOver = false;
    isPaused = false;
    dropCounter = 0;
    dropInterval = 1000;

    // Clear old interval
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }

    // Hide game over screen
    document.getElementById('game-over').classList.add('hidden');

    // Restart
    nextPiece = createRandomPiece();
    spawnNewPiece();
    startGameLoop();
    updateUI();
    draw();
}

// Start game when page loads
window.addEventListener('load', init);
