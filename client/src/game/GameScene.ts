import Phaser from "phaser";

export interface GameConfig {
  moveSpeed: number;
  tolerance: number;
  onGameOver: (stats: { score: number; parts: number; discount: number }) => void;
  onWin: (stats: { score: number; parts: number; discount: number }) => void;
}

export class GameScene extends Phaser.Scene {
  private config: GameConfig;
  private currentBlock: Phaser.GameObjects.Graphics | null = null;
  private stack: Phaser.GameObjects.Graphics[] = [];
  private baseWidth: number = 300;
  private blockHeight: number = 60;
  private currentY: number = 0;
  private moveTween: Phaser.Tweens.Tween | null = null;
  private isDropping: boolean = false;
  private score: number = 100; // Starting width percentage
  private discount: number = 0;
  private maxLevels: number = 6;
  private currentLevel: number = 0;

  // Colors
  private readonly COLOR_PRIMARY = 0x002A54; // Hilton Blue
  private readonly COLOR_ACCENT = 0x9D8848;  // Gold
  private readonly COLOR_WINDOW = 0xFFFDD0;  // Cream/Light Yellow

  constructor() {
    super("GameScene");
    // Default config placeholder, overridden in init
    this.config = {
      moveSpeed: 5,
      tolerance: 10,
      onGameOver: () => {},
      onWin: () => {},
    };
  }

  init(data: GameConfig) {
    this.config = data;
    this.currentLevel = 0;
    this.stack = [];
    this.score = 100;
    this.discount = 0;
    this.baseWidth = 300;
  }

  create() {
    const { width, height } = this.scale;
    
    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xe6f3ff, 0xe6f3ff, 0xffffff, 0xffffff, 1);
    bg.fillRect(0, 0, width, height);

    // Initial Base Block
    this.currentY = height - 100;
    const baseBlock = this.createBlock(width / 2, this.currentY, this.baseWidth, this.COLOR_PRIMARY);
    this.stack.push(baseBlock);

    // Start first block
    this.spawnNextBlock();

    // Input listeners (Keyboard)
    this.input.keyboard?.on("keydown-SPACE", () => this.dropBlock());
    this.input.keyboard?.on("keydown-ENTER", () => this.dropBlock());
    this.input.on("pointerdown", () => this.dropBlock());
  }

  // Exposed method for external triggers (Gestures)
  public triggerDrop() {
    this.dropBlock();
  }

  private createBlock(x: number, y: number, width: number, color: number): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    
    // Draw building block
    graphics.fillStyle(color, 1);
    // Draw from center
    graphics.fillRect(-width / 2, -this.blockHeight / 2, width, this.blockHeight);
    
    // Draw windows
    graphics.fillStyle(this.COLOR_WINDOW, 0.6);
    const windowSize = 10;
    const gap = 20;
    const numWindows = Math.floor((width - 20) / gap);
    const startX = -((numWindows * gap) / 2) + windowSize/2;
    
    for(let i = 0; i < numWindows; i++) {
        graphics.fillRect(startX + (i * gap), -5, windowSize, 15);
    }

    // Border
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(-width / 2, -this.blockHeight / 2, width, this.blockHeight);

    graphics.x = x;
    graphics.y = y;

    return graphics;
  }

  private spawnNextBlock() {
    if (this.currentLevel >= this.maxLevels) {
      this.finishGame(true);
      return;
    }

    this.currentLevel++;
    this.currentY -= this.blockHeight;
    this.isDropping = false;

    // Last block width determines new block width
    const prevBlock = this.stack[this.stack.length - 1];
    // Need to store width in data because graphics objects don't track dynamic drawing width easily
    const currentWidth = prevBlock.getData('width') || this.baseWidth;

    this.currentBlock = this.createBlock(0, 100, currentWidth, this.COLOR_ACCENT);
    this.currentBlock.setData('width', currentWidth);
    this.currentBlock.y = 100; // Spawn at top

    // Create oscillating tween
    const { width } = this.scale;
    const travelDist = (width - currentWidth) / 2;
    
    this.currentBlock.x = width / 2 - travelDist; // Start left

    this.moveTween = this.tweens.add({
      targets: this.currentBlock,
      x: width / 2 + travelDist,
      duration: 15000 / (this.config.moveSpeed * 10), // Speed factor
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private dropBlock() {
    if (this.isDropping || !this.currentBlock) return;
    
    this.isDropping = true;
    if (this.moveTween) this.moveTween.stop();

    // Animate drop
    this.tweens.add({
      targets: this.currentBlock,
      y: this.currentY,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.checkStack();
      }
    });
  }

  private checkStack() {
    if (!this.currentBlock) return;

    const prevBlock = this.stack[this.stack.length - 1];
    const prevX = prevBlock.x;
    const currX = this.currentBlock.x;
    const prevWidth = prevBlock.getData('width');

    const diff = currX - prevX;
    const absDiff = Math.abs(diff);

    // Perfect Drop Tolerance
    if (absDiff <= this.config.tolerance) {
      this.currentBlock.x = prevX; // Snap to center
      this.stack.push(this.currentBlock);
      this.spawnNextBlock();
      // Perfect match effect
      this.cameras.main.shake(100, 0.005);
      return;
    }

    // Missed completely
    if (absDiff >= prevWidth) {
      this.currentBlock.y += 500; // Fall off screen
      this.tweens.add({
        targets: this.currentBlock,
        alpha: 0,
        duration: 300,
        onComplete: () => this.finishGame(false)
      });
      return;
    }

    // Partial Overlap - Trim the block
    const newWidth = prevWidth - absDiff;
    const overlapCenter = prevX + (diff / 2);

    // Create debris for the falling part
    const fallingWidth = absDiff;
    const fallingX = diff > 0 
      ? currX + (newWidth / 2) + (fallingWidth / 2) 
      : currX - (newWidth / 2) - (fallingWidth / 2);
    
    this.createDebris(fallingX, this.currentY, fallingWidth);

    // Replace current block with trimmed block
    this.currentBlock.destroy();
    this.currentBlock = this.createBlock(overlapCenter, this.currentY, newWidth, this.COLOR_ACCENT);
    this.currentBlock.setData('width', newWidth);
    
    this.stack.push(this.currentBlock);

    // Update global score/discount
    const percentRetained = newWidth / this.baseWidth;
    this.score = Math.floor(percentRetained * 100);
    
    this.spawnNextBlock();
  }

  private createDebris(x: number, y: number, width: number) {
    const debris = this.createBlock(x, y, width, 0xff0000);
    this.tweens.add({
      targets: debris,
      y: this.scale.height + 100,
      angle: 45,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => debris.destroy()
    });
  }

  private finishGame(win: boolean) {
    // Calculate final discount (max 50% for 6 levels)
    // Formula: (Current Width / Base Width) * (Levels Completed / Max Levels) * 50
    const finalBlock = this.stack[this.stack.length - 1];
    const finalWidth = finalBlock ? finalBlock.getData('width') : 0;
    
    const widthRatio = finalWidth / this.baseWidth;
    const levelRatio = this.currentLevel / this.maxLevels;
    
    // If lost, penalty
    const discount = win 
        ? Math.floor(widthRatio * 50) 
        : Math.floor(widthRatio * levelRatio * 20);

    const stats = {
      score: Math.floor(widthRatio * 100),
      parts: this.currentLevel,
      discount: discount
    };

    if (win) {
      this.config.onWin(stats);
    } else {
      this.config.onGameOver(stats);
    }
  }
}
