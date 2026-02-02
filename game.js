(function () {
  const GRID_SIZE = 4;
  const CELL_GAP = 12;
  const STORAGE_KEY = '2048-best';
  const PASSWORD = 'xuanxuan'; // 修改这里的密码

  let grid = [];
  let score = 0;
  let best = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  let gameOver = false;
  let won = false;

  const passwordOverlay = document.getElementById('passwordOverlay');
  const passwordInput = document.getElementById('passwordInput');
  const passwordError = document.getElementById('passwordError');
  const passwordBtn = document.getElementById('passwordBtn');
  const gameContainer = document.getElementById('gameContainer');
  const gridEl = document.getElementById('grid');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const overlayEl = document.getElementById('gameOverlay');
  const messageEl = document.getElementById('gameMessage');
  const retryBtn = document.getElementById('retryBtn');
  const continueBtn = document.getElementById('continueBtn');

  function checkPassword() {
    const input = passwordInput.value.trim();
    if (input === PASSWORD) {
      passwordOverlay.classList.add('hidden');
      gameContainer.style.display = 'block';
      start();
    } else {
      passwordError.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  passwordBtn.addEventListener('click', checkPassword);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });

  function initGrid() {
    grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = 0;
      }
    }
  }

  function getEmptyCells() {
    const empty = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) empty.push({ r, c });
      }
    }
    return empty;
  }

  function spawnTile() {
    const empty = getEmptyCells();
    if (empty.length === 0) return;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    render();
  }

  function render() {
    gridEl.innerHTML = '';
    const wrapper = gridEl.parentElement;
    const totalGap = (GRID_SIZE - 1) * CELL_GAP;
    const available = Math.min(wrapper.clientWidth, wrapper.clientHeight);
    const cellSize = Math.max(0, (available - totalGap) / GRID_SIZE);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.width = cellSize + 'px';
        cell.style.height = cellSize + 'px';
        cell.style.gridColumn = c + 1;
        cell.style.gridRow = r + 1;
        gridEl.appendChild(cell);

        const value = grid[r][c];
        if (value > 0) {
          const tile = document.createElement('div');
          tile.className = 'tile tile-' + value;
          tile.style.width = cellSize + 'px';
          tile.style.height = cellSize + 'px';
          tile.style.left = (c * (cellSize + CELL_GAP)) + 'px';
          tile.style.top = (r * (cellSize + CELL_GAP)) + 'px';

          const img = document.createElement('img');
          img.src = 'tiles/' + value + '.png';
          img.alt = '';
          img.className = 'tile-img';
          img.onerror = function () {
            tile.classList.add('tile-no-image');
          };

          const span = document.createElement('span');
          span.className = 'tile-number';
          span.textContent = value;

          tile.appendChild(img);
          tile.appendChild(span);
          gridEl.appendChild(tile);
        }
      }
    }

    scoreEl.textContent = score;
    bestEl.textContent = best;
  }

  function getLine(dr, dc, index) {
    const line = [];
    if (dr !== 0) {
      for (let r = 0; r < GRID_SIZE; r++) line.push(grid[r][index]);
      if (dr > 0) line.reverse();
    } else {
      for (let c = 0; c < GRID_SIZE; c++) line.push(grid[index][c]);
      if (dc > 0) line.reverse();
    }
    return line;
  }

  function setLine(dr, dc, index, line) {
    if (dr !== 0) {
      const arr = dr > 0 ? line.slice().reverse() : line;
      for (let r = 0; r < GRID_SIZE; r++) grid[r][index] = arr[r];
    } else {
      const arr = dc > 0 ? line.slice().reverse() : line;
      for (let c = 0; c < GRID_SIZE; c++) grid[index][c] = arr[c];
    }
  }

  function mergeLine(line) {
    const filtered = line.filter((x) => x !== 0);
    const result = [];
    let i = 0;
    while (i < filtered.length) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        result.push(filtered[i] * 2);
        score += filtered[i] * 2;
        if (score > best) {
          best = score;
          localStorage.setItem(STORAGE_KEY, String(best));
        }
        i += 2;
      } else {
        result.push(filtered[i]);
        i += 1;
      }
    }
    while (result.length < GRID_SIZE) result.push(0);
    return result;
  }

  function move(dr, dc) {
    if (gameOver) return;
    const prev = grid.map((row) => row.slice());
    const size = dr !== 0 ? GRID_SIZE : GRID_SIZE;
    for (let i = 0; i < size; i++) {
      const line = getLine(dr, dc, i);
      const merged = mergeLine(line);
      setLine(dr, dc, i, merged);
    }
    let moved = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] !== prev[r][c]) moved = true;
      }
    }
    if (moved) {
      spawnTile();
      checkGameOver();
    }
  }

  function canMove() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) return true;
        const v = grid[r][c];
        if (r < GRID_SIZE - 1 && grid[r + 1][c] === v) return true;
        if (c < GRID_SIZE - 1 && grid[r][c + 1] === v) return true;
      }
    }
    return false;
  }

  function checkGameOver() {
    if (getEmptyCells().length > 0) return;
    if (!canMove()) {
      gameOver = true;
      overlayEl.classList.add('visible');
      messageEl.textContent = '小笨笨';
    }
  }

  function checkWin() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 2048) {
          if (!won) {
            won = true;
            overlayEl.classList.add('visible');
            messageEl.textContent = 'You Win!';
            continueBtn.style.display = 'inline-block';
          }
          return;
        }
      }
    }
  }

  function start() {
    initGrid();
    score = 0;
    gameOver = false;
    won = false;
    overlayEl.classList.remove('visible');
    spawnTile();
    spawnTile();
    render();
  }

  document.addEventListener('keydown', (e) => {
    if (gameOver && !overlayEl.classList.contains('visible')) return;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        move(-1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        move(1, 0);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        move(0, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        move(0, 1);
        break;
    }
    checkWin();
  });

  retryBtn.addEventListener('click', () => {
    continueBtn.style.display = 'none';
    start();
  });

  continueBtn.addEventListener('click', () => {
    overlayEl.classList.remove('visible');
    continueBtn.style.display = 'none';
  });
})();
