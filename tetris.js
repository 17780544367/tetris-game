const BLOCK_SIZE = 30;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

class Tetris {
    constructor() {
        // 主游戏画布
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = BLOCK_SIZE * GRID_WIDTH;
        this.canvas.height = BLOCK_SIZE * GRID_HEIGHT;
        
        // 预览画布
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.nextCanvas.width = BLOCK_SIZE * 4;
        this.nextCanvas.height = BLOCK_SIZE * 4;
        
        // 游戏数据
        this.grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
        this.score = 0;
        this.gameOver = false;
        
        // 方块形状定义
        this.shapes = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[1,1,1],[0,1,0]], // T
            [[1,1,1],[1,0,0]], // L
            [[1,1,1],[0,0,1]], // J
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]]  // Z
        ];
        
        // 颜色定义
        this.colors = [
            '#00f0f0', // cyan
            '#f0f000', // yellow
            '#f000f0', // magenta
            '#f00000', // red
            '#00f000', // green
            '#0000f0'  // blue
        ];
        
        this.init();
    }
    
    init() {
        this.currentPiece = this.newPiece();
        this.nextPiece = this.newPiece();
        this.bindControls();
        this.gameLoop();
    }
    
    bindControls() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver) return;
            
            switch(event.key) {
                case 'ArrowLeft':
                    this.move(-1, 0);
                    break;
                case 'ArrowRight':
                    this.move(1, 0);
                    break;
                case 'ArrowDown':
                    this.move(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });
    }
    
    addTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const diffX = touchX - touchStartX;
            const diffY = touchY - touchStartY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 左右滑动
                if (diffX > 0) this.move(1, 0);
                else this.move(-1, 0);
            } else {
                // 下滑
                if (diffY > 0) this.move(0, 1);
                else this.rotate();
            }
            
            touchStartX = touchX;
            touchStartY = touchY;
        });
    }
    
    newPiece() {
        const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        return {
            shape: shape,
            x: Math.floor(GRID_WIDTH / 2) - Math.floor(shape[0].length / 2),
            y: 0,
            color: color
        };
    }

    move(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.validMove(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }

    validMove(shape, x, y) {
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j]) {
                    const newX = x + j;
                    const newY = y + i;
                    
                    if (newX < 0 || newX >= GRID_WIDTH || 
                        newY >= GRID_HEIGHT || 
                        (newY >= 0 && this.grid[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[row.length - 1 - i]));
            
        if (this.validMove(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
        }
    }

    hardDrop() {
        while (this.move(0, 1)) {}
        this.mergePiece();
    }

    mergePiece() {
        for (let i = 0; i < this.currentPiece.shape.length; i++) {
            for (let j = 0; j < this.currentPiece.shape[i].length; j++) {
                if (this.currentPiece.shape[i][j]) {
                    const y = this.currentPiece.y + i;
                    const x = this.currentPiece.x + j;
                    if (y >= 0) {
                        this.grid[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.newPiece();
        
        if (!this.validMove(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver = true;
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(GRID_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        this.score += linesCleared * 100;
        document.getElementById('score').textContent = this.score;
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格中的方块
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x]) {
                    this.drawBlock(this.ctx, x, y, this.grid[y][x]);
                }
            }
        }
        
        // 绘制当前方块
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawBlock(
                        this.ctx,
                        this.currentPiece.x + x,
                        this.currentPiece.y + y,
                        this.currentPiece.color
                    );
                }
            }
        }
        
        // 绘制下一个方块预览
        this.nextCtx.fillStyle = '#fff';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const offsetX = (4 - this.nextPiece.shape[0].length) * BLOCK_SIZE / 2;
        const offsetY = (4 - this.nextPiece.shape.length) * BLOCK_SIZE / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    this.drawBlock(
                        this.nextCtx,
                        x + offsetX / BLOCK_SIZE,
                        y + offsetY / BLOCK_SIZE,
                        this.nextPiece.color
                    );
                }
            }
        }
    }

    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    }

    gameLoop() {
        if (!this.gameOver) {
            this.draw();
            if (!this.move(0, 1)) {
                this.mergePiece();
            }
            setTimeout(() => this.gameLoop(), 500); // 控制下落速度
        } else {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
}

// 初始化游戏
window.onload = () => {
    const game = new Tetris();
}; 