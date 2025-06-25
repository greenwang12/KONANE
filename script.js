const rulesPage = document.getElementById("rulesPage");
const playGameBtn = document.getElementById("playGameBtn");

const boardEl = document.getElementById("board");
const statusP = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
const gridSizeSelect = document.getElementById("gridSize");
const playerModeSelect = document.getElementById("playerMode");
const gameArea = document.getElementById("gameArea");
const homeOverlay = document.getElementById("homeOverlay");

let BOARD_SIZE = 8;
let board = [];
let currentPlayer = 'black';
let gamePhase = 'init';
let selected = null;
let lastMover = null;
let numPlayers = 2;
let blackRemovedPos = null;

startBtn.addEventListener("click", () => {
  homeOverlay.classList.add("fade-out");
  setTimeout(() => {
    homeOverlay.classList.add("hidden");
    rulesPage.classList.remove("hidden");
  }, 400);
});

playGameBtn.addEventListener("click", () => {
  rulesPage.classList.add("hidden");
  homeOverlay.classList.add("hidden"); // ✅ ensure it's gone
  gameArea.classList.remove("hidden");
  document.body.classList.add("game-mode");
  restartBtn.style.display = "inline-block";

  BOARD_SIZE = parseInt(gridSizeSelect.value);
  numPlayers = parseInt(playerModeSelect.value);
  currentPlayer = 'black';
  gamePhase = 'init-black';
  selected = null;
  lastMover = null;

  initBoard(BOARD_SIZE);
  renderBoard();
  statusP.textContent = "Black: Remove a center or corner piece to start";
});

restartBtn.addEventListener("click", () => {
  gameArea.classList.add("hidden");
  rulesPage.classList.add("hidden");
  homeOverlay.classList.remove("hidden");
  homeOverlay.classList.remove("fade-out");
  document.body.classList.remove("game-mode");
});

function initBoard(size) {
  board = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push((r + c) % 2 === 0 ? 'black' : 'white');
    }
    board.push(row);
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 60px)`;
  boardEl.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 60px)`;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'tile ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      cell.dataset.r = r;
      cell.dataset.c = c;

      const piece = board[r][c];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece ' + piece;
        cell.appendChild(pieceEl);
      }

      if (selected && selected.r == r && selected.c == c) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => handleCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function handleCellClick(r, c) {
  if (gamePhase === 'game-over') return;

  if (gamePhase === 'init-black') {
  if (isCornerOrCenter(r, c) && board[r][c] === 'black') {
    board[r][c] = null;
    blackRemovedPos = { r, c };
    renderBoard();

    if (numPlayers === 1) {
      // AI removes adjacent white piece automatically
     if (numPlayers === 1) {
      statusP.textContent = "White's turn";
      setTimeout(() => {
      const adj = getAdjacentWhite(blackRemovedPos.r, blackRemovedPos.c);
    if (adj) {
      board[adj.r][adj.c] = null;
      gamePhase = 'playing';
      currentPlayer = 'black';
      statusP.textContent = "Black's turn";
    } else {
      gamePhase = 'game-over';
      statusP.textContent = "Game Over! No adjacent white piece. Black wins!";
    }
    renderBoard();
  }, 1000); // 1 second delay
}


    } else {
      gamePhase = 'init-white';
      currentPlayer = 'white';
      statusP.textContent = "White: Remove a white piece adjacent to the empty black piece";
    }
  }
  return;
}


  if (gamePhase === 'init-white') {
   if (
  board[r][c] === 'white' &&
  blackRemovedPos &&
  isAdjacent(r, c, blackRemovedPos.r, blackRemovedPos.c)
   ) {
      board[r][c] = null;
      gamePhase = 'playing';
      currentPlayer = 'black';
      statusP.textContent = "Black's turn";
      renderBoard();

      if (numPlayers === 1 && currentPlayer === 'white') {
        setTimeout(aiMove, 500); // AI plays after a short delay
      }
    }
    return;
  }

  if (gamePhase === 'playing') {
    if (!selected && board[r][c] === currentPlayer) {
      selected = { r, c };
    } else if (selected) {
      const jumps = getJumps(selected.r, selected.c);
      const valid = jumps.find(j => j.r === r && j.c === c);
      if (valid) {
        const jumped = valid.jumped;
        board[r][c] = board[selected.r][selected.c];
        board[selected.r][selected.c] = null;
        board[jumped.r][jumped.c] = null;
        selected = null;

        lastMover = currentPlayer;
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';

        if (!hasAnyMoves(currentPlayer)) {
        gamePhase = 'game-over';
        statusP.textContent = `Game Over! ${capitalize(lastMover)} wins! 🎉`;
        } else {
        statusP.textContent = `${capitalize(currentPlayer)}'s turn`;
        if (numPlayers === 1 && currentPlayer === 'white') {
        setTimeout(aiMove, 500);
      }
      }
     } else {
        selected = null;
      }
    }
    renderBoard();
  }
}

function isCornerOrCenter(r, c) {
  const size = BOARD_SIZE;
  const mid1 = Math.floor((size - 1) / 2);
  const mid2 = Math.ceil((size - 1) / 2);

  const corners = [
    [0, 0], [0, size - 1],
    [size - 1, 0], [size - 1, size - 1]
  ];

  const centers = [
    [mid1, mid1], [mid1, mid2],
    [mid2, mid1], [mid2, mid2]
  ];

  return corners.concat(centers).some(([rr, cc]) => rr === r && cc === c);
}

function isAdjacentToEmpty(r, c) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  return dirs.some(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    return isOnBoard(nr, nc) && board[nr][nc] === null;
  });
}

function isOnBoard(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function isAdjacent(r1, c1, r2, c2) {
  return (
    (r1 === r2 && Math.abs(c1 - c2) === 1) ||  // left/right
    (c1 === c2 && Math.abs(r1 - r2) === 1)     // up/down
  );
}

function getAdjacentWhite(r, c) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (isOnBoard(nr, nc) && board[nr][nc] === 'white') {
      return { r: nr, c: nc };
    }
  }
  return null;
}

function getJumps(r, c) {
  const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
  const jumps = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    const mr = r + dr / 2, mc = c + dc / 2;
    if (
      isOnBoard(nr, nc) &&
      board[nr][nc] === null &&
      board[mr][mc] &&
      board[mr][mc] !== board[r][c]
    ) {
      jumps.push({ r: nr, c: nc, jumped: { r: mr, c: mc } });
    }
  }
  return jumps;
}

function hasAnyMoves(player) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player && getJumps(r, c).length > 0) return true;
    }
  }
  return false;
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

// **Minimax** AI Move Logic
function aiMove() {
  if (gamePhase !== 'playing' || currentPlayer !== 'white' || numPlayers !== 1) return;

  // Get all possible moves for AI
  const moves = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'white') {
        const jumps = getJumps(r, c);
        for (const jump of jumps) {
          moves.push({ from: { r, c }, to: jump });
        }
      }
    }
  }

  if (moves.length === 0) {
    gamePhase = 'game-over';
    statusP.textContent = `Game Over! Black wins!`;
    renderBoard();
    return;
  }

  // Minimax algorithm with evaluation
  let bestMove = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const simulatedBoard = simulateMove(move);
    const score = evaluateBoard(simulatedBoard, 'white');
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // Execute the best move
  board[bestMove.to.r][bestMove.to.c] = board[bestMove.from.r][bestMove.from.c];
  board[bestMove.from.r][bestMove.from.c] = null;
  board[bestMove.to.jumped.r][bestMove.to.jumped.c] = null;

  lastMover = currentPlayer;
  currentPlayer = 'black';

  if (!hasAnyMoves('black')) {
  gamePhase = 'game-over';
  statusP.textContent = `Game Over! ${capitalize(lastMover)} wins! 🎉`;
} else {
  statusP.textContent = `Black's turn`;
}
  renderBoard();
}

function simulateMove(move) {
  // Create a simulated board after the move
  const simulatedBoard = JSON.parse(JSON.stringify(board));  // deep copy
  simulatedBoard[move.to.r][move.to.c] = simulatedBoard[move.from.r][move.from.c];
  simulatedBoard[move.from.r][move.from.c] = null;
  simulatedBoard[move.to.jumped.r][move.to.jumped.c] = null;
  return simulatedBoard;
}

function evaluateBoard(board, player) {
  let score = 0;

  // Evaluate pieces remaining
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) score += 1;
      if (board[r][c] && board[r][c] !== player) score -= 1;
    }
  }

  // More sophisticated evaluation can be added (e.g., blocking moves, corner control)
  return score;
}
