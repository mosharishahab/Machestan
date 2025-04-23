document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const gameScreen = document.getElementById('game-screen');
  const startButton = document.getElementById('start-button');
  const gameBoard = document.getElementById('game-board');
  const scoreDisplay = document.getElementById('current-score');
  const objectiveText = document.getElementById('objective-text');
  const popupInfo = document.getElementById('popup-info');
  const coachDialog = document.getElementById('coach-dialog');

  const rows = 10;
  const cols = 8;
  const pieceColors = ['red', 'blue', 'green', 'yellow', 'purple'];
  let gameGrid = [];
  let score = 0;
  let pieceFalling = [];
  let redTarget = 5;

  let touchStartX = 0, touchStartY = 0;
  let startRow = null, startCol = null;
  let coachTimer = null;

  const coachQuotes = {
    start: [
      "بیا ببینم چیکار می‌کنی قهرمان!",
      "ننه‌جونمم اگه بازی می‌کرد الان شروع کرده بود!",
      "وقتشه ترکوندن رو شروع کنی!"
    ],
    score: [
      "بابا قهرمان! زدی ترکوندی!",
      "اینم از اون حرکات بود که باید قابش کرد!",
      "هوووو! این یکی حرکت توپ بود!"
    ],
    idle: [
      "خوابی یا داری با مرغای همسایه مشورت می‌کنی؟",
      "بجنب دیگه، دارم خسته می‌شم!",
      "بازی‌و ول نکن! من هنوز دارم می‌پرم!"
    ],
    win: [
      "بردی؟ دمــت گرم گُنده‌پا!",
      "این بردو باید بزنیم رو تی‌شرت!",
      "مربی‌ات افتخار می‌کنه بهت!"
    ]
  };

  function coachSay(type) {
    if (coachTimer) return;
    const list = coachQuotes[type];
    if (!list) return;
    const quote = list[Math.floor(Math.random() * list.length)];
    coachDialog.textContent = quote;

    coachTimer = setTimeout(() => {
      coachTimer = null;
    }, 3000);
  }

  startButton.addEventListener('click', () => {
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    initBoard();
    coachSay('start');
  });

  function initBoard() {
    gameGrid = [];
    score = 0;
    redTarget = 5;
    updateScore();
    updateObjective();

    for (let row = 0; row < rows; row++) {
      gameGrid[row] = [];
      for (let col = 0; col < cols; col++) {
        gameGrid[row][col] = randomColor();
      }
    }

    renderBoard();
    removeMatches();
  }

  function randomColor() {
    return pieceColors[Math.floor(Math.random() * pieceColors.length)];
  }

  function updateScore() {
    scoreDisplay.textContent = score;
  }

  function updateObjective() {
    objectiveText.textContent = redTarget <= 0 ? 'مرحله تموم شد!' : `جمع آوری ${redTarget} کاپ‌کیک قرمز`;
    if (redTarget <= 0) coachSay('win');
  }

  function showPopup(message) {
    popupInfo.textContent = message;
    popupInfo.classList.remove('hidden');
    popupInfo.classList.add('show');
    setTimeout(() => {
      popupInfo.classList.remove('show');
      popupInfo.classList.add('hidden');
    }, 1500);
  }

  function renderBoard(shakeCoords = null) {
    gameBoard.innerHTML = '';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color = gameGrid[row][col];
        if (!color) continue;

        const piece = document.createElement('div');
        piece.className = `puzzle-piece ${color}`;
        piece.setAttribute('data-row', row);
        piece.setAttribute('data-col', col);

        if (shakeCoords && ((row === shakeCoords.r1 && col === shakeCoords.c1) || (row === shakeCoords.r2 && col === shakeCoords.c2))) {
          piece.classList.add('shake-back');
        }

        if (pieceFalling[row]?.includes(col)) {
          piece.classList.add('falling');
        }

        piece.addEventListener('touchstart', e => {
          coachSay('score');
          const touch = e.touches[0];
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
          startRow = parseInt(piece.getAttribute('data-row'));
          startCol = parseInt(piece.getAttribute('data-col'));
        }, { passive: true });

        piece.addEventListener('touchend', e => {
          const touch = e.changedTouches[0];
          const dx = touch.clientX - touchStartX;
          const dy = touch.clientY - touchStartY;

          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          let toRow = startRow;
          let toCol = startCol;

          if (Math.max(absDx, absDy) < 10) return;

          if (absDx > absDy) {
            if (dx < 0 && startCol < cols - 1) toCol = startCol + 1;
            else if (dx > 0 && startCol > 0) toCol = startCol - 1;
            else return;
          } else {
            if (dy > 0 && startRow < rows - 1) toRow = startRow + 1;
            else if (dy < 0 && startRow > 0) toRow = startRow - 1;
            else return;
          }

          swapPieces(startRow, startCol, toRow, toCol, true);
        });

        gameBoard.appendChild(piece);
      }
    }
  }

  function swapPieces(r1, c1, r2, c2, checkMatch) {
    const temp = gameGrid[r1][c1];
    gameGrid[r1][c1] = gameGrid[r2][c2];
    gameGrid[r2][c2] = temp;

    renderBoard();

    if (checkMatch) {
      setTimeout(() => {
        if (!removeMatches()) {
          const back = gameGrid[r1][c1];
          gameGrid[r1][c1] = gameGrid[r2][c2];
          gameGrid[r2][c2] = back;
          pieceFalling = [];
          renderBoard({ r1, c1, r2, c2 });
          setTimeout(() => renderBoard(), 300);
        }
      }, 250);
    }
  }

  function removeMatches() {
    let matched = [];
    let redCount = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 2; col++) {
        const color = gameGrid[row][col];
        if (color && color === gameGrid[row][col + 1] && color === gameGrid[row][col + 2]) {
          matched.push([row, col], [row, col + 1], [row, col + 2]);
        }
      }
    }

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows - 2; row++) {
        const color = gameGrid[row][col];
        if (color && color === gameGrid[row + 1][col] && color === gameGrid[row + 2][col]) {
          matched.push([row, col], [row + 1, col], [row + 2, col]);
        }
      }
    }

    if (matched.length === 0) return false;

    matched.forEach(([r, c]) => {
      if (gameGrid[r][c] === 'red') {
        redTarget--;
        redCount++;
        updateObjective();
      }
      gameGrid[r][c] = null;
    });

    const gained = matched.length * 10;
    score += gained;
    updateScore();

    if (gained > 0) {
      showPopup(`+${gained} امتیاز! (${redCount} قرمز)`);
    }

    setTimeout(() => {
      dropPieces();
    }, 250);

    return true;
  }

  function dropPieces() {
    pieceFalling = [];

    for (let col = 0; col < cols; col++) {
      let empty = 0;
      for (let row = rows - 1; row >= 0; row--) {
        if (gameGrid[row][col] === null) {
          empty++;
        } else if (empty > 0) {
          gameGrid[row + empty][col] = gameGrid[row][col];
          gameGrid[row][col] = null;
        }
      }

      for (let r = 0; r < empty; r++) {
        gameGrid[r][col] = randomColor();
        if (!pieceFalling[r]) pieceFalling[r] = [];
        pieceFalling[r].push(col);
      }
    }

    renderBoard();
    setTimeout(() => removeMatches(), 200);
  }
});
