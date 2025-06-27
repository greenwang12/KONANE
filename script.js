// Konane Game Logic - with white/black pieces swapped
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
let currentPlayer = 'white';
let gamePhase = 'init-white';
let selected = null;
let lastMover = null;
let numPlayers = 2;
let firstRemovedPos = null;

startBtn.addEventListener("click", () => {
  homeOverlay.classList.add("fade-out");
  setTimeout(() => {
    homeOverlay.classList.add("hidden");
    rulesPage.classList.remove("hidden");
  }, 400);
});

playGameBtn.addEventListener("click", () => {
  rulesPage.classList.add("hidden");
  homeOverlay.classList.add("hidden");
  gameArea.classList.remove("hidden");
  document.body.classList.add("game-mode");
  restartBtn.style.display = "inline-block";

  BOARD_SIZE = parseInt(gridSizeSelect.value);
  numPlayers = parseInt(playerModeSelect.value);
  currentPlayer = 'white';
  gamePhase = 'init-white';
  selected = null;
  lastMover = null;

  initBoard(BOARD_SIZE);
  renderBoard();
  statusP.textContent = "White: Remove a center or corner piece to start";
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
      row.push((r + c) % 2 === 0 ? 'white' : 'black');
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

  if (gamePhase === 'init-white') {
    if (isCornerOrCenter(r, c) && board[r][c] === 'white') {
      board[r][c] = null;
      firstRemovedPos = { r, c };
      renderBoard();

      if (numPlayers === 1) {
        statusP.textContent = "Black's turn";
        setTimeout(() => {
          const adj = getAdjacentPiece(firstRemovedPos.r, firstRemovedPos.c, 'black');
          if (adj) {
            board[adj.r][adj.c] = null;
            gamePhase = 'playing';
            currentPlayer = 'white';
            statusP.textContent = "White's turn";
          } else {
            gamePhase = 'game-over';
            statusP.textContent = "Game Over! No adjacent black piece. White wins!";
          }
          renderBoard();
        }, 1000);
      } else {
        gamePhase = 'init-black';
        currentPlayer = 'black';
        statusP.textContent = "Black: Remove a black piece adjacent to the empty white piece";
      }
    }
    return;
  }

  if (gamePhase === 'init-black') {
    if (
      board[r][c] === 'black' &&
      firstRemovedPos &&
      isAdjacent(r, c, firstRemovedPos.r, firstRemovedPos.c)
    ) {
      board[r][c] = null;
      gamePhase = 'playing';
      currentPlayer = 'white';
      statusP.textContent = "White's turn";
      renderBoard();

      if (numPlayers === 1 && currentPlayer === 'black') {
        setTimeout(aiMove, 500);
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
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

        if (!hasAnyMoves(currentPlayer)) {
          gamePhase = 'game-over';
          statusP.textContent = `Game Over! ${capitalize(lastMover)} wins! 🎉`;
        } else {
          statusP.textContent = `${capitalize(currentPlayer)}'s turn`;
          if (numPlayers === 1 && currentPlayer === 'black') {
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

function isAdjacent(r1, c1, r2, c2) {
  return (
    (r1 === r2 && Math.abs(c1 - c2) === 1) ||
    (c1 === c2 && Math.abs(r1 - r2) === 1)
  );
}

function isOnBoard(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function getAdjacentPiece(r, c, color) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (isOnBoard(nr, nc) && board[nr][nc] === color) {
      return { r: nr, c: nc };
    }
  }
  return null;
}

function getJumps(r, c) {
  const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];
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

function aiMove() {
  if (gamePhase !== 'playing' || currentPlayer !== 'black' || numPlayers !== 1) return;

  const moves = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') {
        const jumps = getJumps(r, c);
        for (const jump of jumps) {
          moves.push({ from: { r, c }, to: jump });
        }
      }
    }
  }

  if (moves.length === 0) {
    gamePhase = 'game-over';
    statusP.textContent = `Game Over! White wins!`;
    renderBoard();
    return;
  }

  let bestMove = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const simulatedBoard = simulateMove(move);
    const score = evaluateBoard(simulatedBoard, 'black');
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  board[bestMove.to.r][bestMove.to.c] = board[bestMove.from.r][bestMove.from.c];
  board[bestMove.from.r][bestMove.from.c] = null;
  board[bestMove.to.jumped.r][bestMove.to.jumped.c] = null;

  lastMover = currentPlayer;
  currentPlayer = 'white';

  if (!hasAnyMoves('white')) {
    gamePhase = 'game-over';
    statusP.textContent = `Game Over! ${capitalize(lastMover)} wins! 🎉`;
  } else {
    statusP.textContent = `White's turn`;
  }
  renderBoard();
}

function simulateMove(move) {
  const simulatedBoard = JSON.parse(JSON.stringify(board));
  simulatedBoard[move.to.r][move.to.c] = simulatedBoard[move.from.r][move.from.c];
  simulatedBoard[move.from.r][move.from.c] = null;
  simulatedBoard[move.to.jumped.r][move.to.jumped.c] = null;
  return simulatedBoard;
}

function evaluateBoard(board, player) {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) score++;
      if (board[r][c] && board[r][c] !== player) score--;
    }
  }
  // More sophisticated evaluation can be added (e.g., blocking moves, corner control)
  return score;
}

