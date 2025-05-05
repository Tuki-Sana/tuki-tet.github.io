class Tetris {
  static SHAPES = [
    [[1,1,1,1]], [[1,1,1],[0,1,0]], [[1,1,1],[1,0,0]],
    [[1,1,1],[0,0,1]], [[1,1],[1,1]], [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]]
  ];

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = 30;
    this.board = Array(20).fill().map(() => Array(10).fill(0));
    this.score = 0;
    this.highScore = Number(localStorage.getItem('tetrisHighScore')) || 0;
    this.currentPiece = null;
    this.nextPiece = this.generateRandomPiece();
    this.gameLoop = null;
    this.gameOver = false;
    this.dropInterval = 1000;
    this.updateHighScoreDisplay();
  }

  generateRandomPiece() {
    const shape = Tetris.SHAPES[Math.floor(Math.random() * Tetris.SHAPES.length)];
    return { shape, x: 0, y: 0 };
  }

  createNewPiece() {
    this.currentPiece = {
      shape: this.nextPiece.shape,
      x: Math.floor(this.board[0].length/2) - Math.floor(this.nextPiece.shape[0].length/2),
      y: 0
    };

    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.handleGameOver();
      return;
    }

    this.nextPiece = this.generateRandomPiece();
    this.drawNextPiece();
  }

  drawNextPiece() {
    const canvas = document.getElementById('next-piece');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shape = this.nextPiece.shape;
    const gridSize = 25;
    const offsetX = (canvas.width - shape[0].length * gridSize) / 2;
    const offsetY = (canvas.height - shape.length * gridSize) / 2;

    shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = '#f00';
          ctx.fillRect(offsetX + x * gridSize, offsetY + y * gridSize, gridSize - 1, gridSize - 1);
        }
      });
    });
  }

  checkCollision(newX, newY, shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          if (boardX < 0 || boardX >= 10 || boardY >= 20) return true;
          if (boardY >= 0 && this.board[boardY][boardX]) return true;
        }
      }
    }
    return false;
  }

  movePiece(dx, dy) {
    if (this.gameOver) return false;
    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;
    if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      return true;
    }
    return false;
  }

  rotatePiece() {
    if (this.gameOver) return;
    const shape = this.currentPiece.shape;
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, newShape)) {
      this.currentPiece.shape = newShape;
    }
  }

  lockPiece() {
    let gameOver = false;
    const { x, y, shape } = this.currentPiece;

    shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value) {
          const boardY = y + dy;
          if (boardY < 0) gameOver = true;
          if (boardY >= 0 && boardY < 20) this.board[boardY][x + dx] = 1;
        }
      });
    });

    if (gameOver) {
      this.handleGameOver();
      return false;
    }

    this.clearLines();
    this.createNewPiece();
    return true;
  }

  clearLines() {
    let linesCleared = 0;
    for (let row = this.board.length - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(10).fill(0));
        linesCleared++;
        row++;
      }
    }
    if (linesCleared > 0) {
      this.addScore(linesCleared);
    }
  }

  addScore(linesCleared) {
    let points = 0;
    switch(linesCleared) {
      case 1: points = 100; break;
      case 2: points = 300; break;
      case 3: points = 500; break;
      case 4: points = 800; break;
    }
    this.score += points;
    document.getElementById('score').textContent = this.score;
    this.updateHighScore();
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('tetrisHighScore', this.highScore);
      document.getElementById('high-score').textContent = this.highScore;
    }
  }

  updateHighScoreDisplay() {
    document.getElementById('high-score').textContent = this.highScore;
  }

  handleGameOver() {
    this.gameOver = true;
    clearInterval(this.gameLoop);
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score').textContent = this.score;
    this.updateHighScore();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.ctx.fillStyle = '#000';
          this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        }
      });
    });

    if (this.currentPiece && !this.gameOver) {
      this.ctx.fillStyle = '#f00';
      this.currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            this.ctx.fillRect(
              (this.currentPiece.x + x) * this.gridSize,
              (this.currentPiece.y + y) * this.gridSize,
              this.gridSize - 1, this.gridSize - 1
            );
          }
        });
      });
    }
  }

  startGameLoop() {
    this.gameLoop = setInterval(() => {
      if (!this.movePiece(0, 1)) {
        if (!this.lockPiece()) {
          this.handleGameOver();
        }
      }
      this.draw();
    }, this.dropInterval);
  }

  start() {
    this.createNewPiece();
    this.startGameLoop();
  }
}

// ゲーム初期化
const canvas = document.getElementById('game');
const tetris = new Tetris(canvas);
tetris.start();
tetris.drawNextPiece();

// キーボード操作
document.addEventListener('keydown', (e) => {
  if (tetris.gameOver) return;
  switch(e.key) {
    case 'ArrowLeft': tetris.movePiece(-1, 0); break;
    case 'ArrowRight': tetris.movePiece(1, 0); break;
    case 'ArrowDown': tetris.movePiece(0, 1); break;
    case 'ArrowUp': tetris.rotatePiece(); break;
  }
  tetris.draw();
});
