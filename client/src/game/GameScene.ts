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
  private stack: Array<{ graphics: Phaser.GameObjects.Graphics; width: number }> = [];
  private baseWidth: number = 300;
  private blockHeight: number = 60;
  private currentY: number = 0;
  private moveTween: Phaser.Tweens.Tween | null = null;
  private isDropping: boolean = false;
  private isGameActive: boolean = false; // FIX: Track if game is still running
  private maxLevels: number = 6;
  private currentLevel: number = 0;
  private blockWidths: number[] = []; // Track widths for discount calculation

  // Colors
  private readonly COLOR_PRIMARY = 0x002A54; // Hilton Blue
  private readonly COLOR_ACCENT = 0x9D8848;  // Gold
  private readonly COLOR_WINDOW = 0xFFFDD0;  // Cream/Light Yellow
  private readonly COLOR_SHADOW = 0x00000020; // Shadow

  constructor() {
    super("GameScene");
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
    this.blockWidths = [];
    this.isGameActive = false;
    this.isDropping = false;
    this.baseWidth = 300;
    this.currentBlock = null;
    if (this.moveTween) this.moveTween.stop();
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
    this.stack.push({ graphics: baseBlock, width: this.baseWidth });
    this.blockWidths.push(this.baseWidth);

    // Start first block
    this.isGameActive = true;
    this.spawnNextBlock();

    // Input listeners (Keyboard)
    this.input.keyboard?.on("keydown-SPACE", () => this.dropBlock());
    this.input.keyboard?.on("keydown-ENTER", () => this.dropBlock());
    this.input.on("pointerdown", () => this.dropBlock());
  }

  // Exposed method for external triggers (Gestures)
  public triggerDrop() {
    if (this.isGameActive) {
      this.dropBlock();
    }
  }

  private createBlock(x: number, y: number, width: number, color: number): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    
    // FIX: Add subtle shadow below the block
    graphics.fillStyle(this.COLOR_SHADOW, 0.3);
    graphics.fillRect(-width / 2 - 2, this.blockHeight / 2 + 2, width + 4, 4);
    
    // Draw building block with slight depth effect
    graphics.fillStyle(color, 1);
    graphics.fillRect(-width / 2, -this.blockHeight / 2, width, this.blockHeight);
    
    // Add lighter top edge for depth
    graphics.fillStyle(0xffffff, 0.15);
    graphics.fillRect(-width / 2, -this.blockHeight / 2, width, 3);
    
    // Draw windows
    graphics.fillStyle(this.COLOR_WINDOW, 0.6);
    const windowSize = 10;
    const gap = 20;
    const numWindows = Math.floor((width - 20) / gap);
    const startX = -((numWindows * gap) / 2) + windowSize / 2;
    
    for (let i = 0; i < numWindows; i++) {
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
    if (!this.isGameActive) return;

    if (this.currentLevel >= this.maxLevels) {
      this.finishGame(true);
      return;
    }

    this.currentLevel++;
    this.currentY -= this.blockHeight;
    this.isDropping = false;

    // Last block width determines new block width
    const prevBlockData = this.stack[this.stack.length - 1];
    const currentWidth = prevBlockData.width;

    this.currentBlock = this.createBlock(0, 100, currentWidth, this.COLOR_ACCENT);
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
    if (this.isDropping || !this.currentBlock || !this.isGameActive) return;
    
    this.isDropping = true;
    if (this.moveTween) this.moveTween.stop();

    // Animate drop with smooth easing
    this.tweens.add({
      targets: this.currentBlock,
      y: this.currentY,
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        if (this.isGameActive) {
          this.checkStack();
        }
      }
    });
  }

  private checkStack() {
    if (!this.currentBlock || !this.isGameActive) return;

    const prevBlockData = this.stack[this.stack.length - 1];
    const prevBlock = prevBlockData.graphics;
    const prevX = prevBlock.x;
    const currX = this.currentBlock.x;
    const prevWidth = prevBlockData.width;

    const diff = currX - prevX;
    const absDiff = Math.abs(diff);

    // Perfect Drop Tolerance
    if (absDiff <= this.config.tolerance) {
      this.currentBlock.x = prevX; // Snap to center
      this.stack.push({ graphics: this.currentBlock, width: prevWidth });
      this.blockWidths.push(prevWidth);
      this.currentBlock.setDepth(this.currentLevel);
      this.spawnNextBlock();
      // Perfect match effect
      this.cameras.main.shake(100, 0.005);
      return;
    }

    // Missed completely
    if (absDiff >= prevWidth) {
      this.isGameActive = false; // FIX: Stop processing input
      this.tweens.add({
        targets: this.currentBlock,
        y: this.scale.height + 100,
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
    this.currentBlock.setDepth(this.currentLevel);
    
    this.stack.push({ graphics: this.currentBlock, width: newWidth });
    this.blockWidths.push(newWidth);
    
    this.spawnNextBlock();
  }

  private createDebris(x: number, y: number, width: number) {
    const debris = this.createBlock(x, y, width, 0xff6b6b);
    this.tweens.add({
      targets: debris,
      y: this.scale.height + 100,
      angle: Phaser.Math.Between(-30, 30),
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => debris.destroy()
    });
  }

  private finishGame(win: boolean) {
    this.isGameActive = false; // FIX: Stop all processing

    // Calculate discount based on:
    // 1. Number of blocks placed (currentLevel)
    // 2. Average width retained (accuracy)
    const avgWidthRatio = this.blockWidths.length > 1
      ? this.blockWidths.slice(1).reduce((a, b) => a + b, 0) / (this.blockWidths.length - 1) / this.baseWidth
      : 1;

    const levelRatio = this.currentLevel / this.maxLevels;
    
    // FIX: Improved discount calculation formula
    // - Win: Higher base discount (up to 50%)
    // - Loss: Lower discount based on progress and accuracy
    let discount: number;
    
    if (win) {
      // Perfect win: 50% base, reduced if not perfectly centered (width ratio)
      discount = Math.floor(avgWidthRatio * 50);
      // Ensure minimum 30% for winning
      discount = Math.max(30, Math.min(50, discount));
    } else {
      // Loss: Based on progress and accuracy
      // Formula: (blocks/6) * (avg_width_ratio) * 20
      const progressBonus = levelRatio * 20;
      const accuracyBonus = avgWidthRatio * 10;
      discount = Math.floor(progressBonus + accuracyBonus);
      discount = Math.max(0, Math.min(30, discount)); // Cap at 30% for losses
    }

    const stats = {
      score: Math.floor(avgWidthRatio * 100),
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
