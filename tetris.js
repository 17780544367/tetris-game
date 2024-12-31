// 定义方块大小（像素）
const BLOCK_SIZE = 30;
// 游戏区域宽度（方块数）
const GRID_WIDTH = 10;
// 游戏区域高度（方块数）
const GRID_HEIGHT = 20;

class Tetris {
    constructor() {
        // 获取主游戏画布元素
        this.canvas = document.getElementById('gameCanvas');  // getElementById: 通过ID获取HTML元素
        // 获取2D渲染上下文，用于在画布上绘图
        this.ctx = this.canvas.getContext('2d');  // getContext('2d'): 获取2D绘图上下文
        // 设置主画布宽度 = 方块大小 * 游戏区域宽度
        this.canvas.width = BLOCK_SIZE * GRID_WIDTH;
        // 设置主画布高度 = 方块大小 * 游戏区域高度
        this.canvas.height = BLOCK_SIZE * GRID_HEIGHT;
        
        // 获取预览画布元素（用于显示下一个方块）
        this.nextCanvas = document.getElementById('nextCanvas');
        // 获取预览画布的2D渲染上下文
        this.nextCtx = this.nextCanvas.getContext('2d');
        // 设置预览画布的宽度（4个方块大小）
        this.nextCanvas.width = BLOCK_SIZE * 4;
        // 设置预览画布的高度（4个方块大小）
        this.nextCanvas.height = BLOCK_SIZE * 4;
        
        // 创建游戏网格数组：使用二维数组表示游戏区域
        // Array(GRID_HEIGHT).fill(): 创建指定长度的数组并填充undefined
        // .map(): 将每个元素映射为一个新的数组，表示每一行
        this.grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
        // 初始化游戏分数
        this.score = 0;
        // 游戏结束标志
        this.gameOver = false;
        
        // 定义所有可能的方块形状：1表示有方块，0表示空白
        this.shapes = [
            [[1,1,1,1]],           // I形方块：一行四个
            [[1,1],[1,1]],         // O形方块：2x2方形
            [[1,1,1],[0,1,0]],     // T形方块
            [[1,1,1],[1,0,0]],     // L形方块
            [[1,1,1],[0,0,1]],     // J形方块
            [[1,1,0],[0,1,1]],     // S形方块
            [[0,1,1],[1,1,0]]      // Z形方块
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
        
        // 添加时间控制相关变量
        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 500; // 下落间隔时间（毫秒）
        
        // 添加按键状态追踪
        this.keyStates = {
            left: false,
            right: false,
            down: false
        };
        this.keyRepeatDelay = 100; // 按键重复延迟
        this.lastKeyTime = {
            left: 0,
            right: 0,
            down: 0
        };
        
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
            
            const currentTime = performance.now();
            
            switch(event.key) {
                case 'ArrowLeft':
                    if (!this.keyStates.left || currentTime - this.lastKeyTime.left > this.keyRepeatDelay) {
                        this.move(-1, 0);
                        this.keyStates.left = true;
                        this.lastKeyTime.left = currentTime;
                    }
                    break;
                case 'ArrowRight':
                    if (!this.keyStates.right || currentTime - this.lastKeyTime.right > this.keyRepeatDelay) {
                        this.move(1, 0);
                        this.keyStates.right = true;
                        this.lastKeyTime.right = currentTime;
                    }
                    break;
                case 'ArrowDown':
                    if (!this.keyStates.down || currentTime - this.lastKeyTime.down > this.keyRepeatDelay) {
                        this.move(0, 1);
                        this.keyStates.down = true;
                        this.lastKeyTime.down = currentTime;
                    }
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                    this.keyStates.left = false;
                    break;
                case 'ArrowRight':
                    this.keyStates.right = false;
                    break;
                case 'ArrowDown':
                    this.keyStates.down = false;
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
        // 只在必要时清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 使用离屏canvas来绘制网格
        if (!this.offscreenCanvas) {
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = this.canvas.width;
            this.offscreenCanvas.height = this.canvas.height;
            this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        }
        
        this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格中的方块
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x]) {
                    this.drawBlock(this.offscreenCtx, x, y, this.grid[y][x]);
                }
            }
        }
        
        // 将离屏canvas的内容复制到主canvas
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        
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
        
        // 优化下一个方块的绘制
        this.drawNextPiece();
    }

    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
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

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            if (!this.move(0, 1)) {
                this.mergePiece();
            }
            this.dropCounter = 0;
        }

        this.draw();

        if (!this.gameOver) {
            requestAnimationFrame(time => this.gameLoop(time));
        } else {
            this.drawGameOver();
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
    }
}

// 初始化游戏
window.onload = () => {
    const game = new Tetris();
}; 
