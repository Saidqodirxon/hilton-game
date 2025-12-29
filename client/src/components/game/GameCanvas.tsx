import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Phaser from 'phaser';
import { GameScene, GameConfig } from '@/game/GameScene';

interface GameCanvasProps {
  config: GameConfig;
}

export interface GameCanvasRef {
  triggerDrop: () => void;
}

const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(({ config }, ref) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    triggerDrop: () => {
      if (sceneRef.current) {
        sceneRef.current.triggerDrop();
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Game
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 400,
      height: 600,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [GameScene]
    };

    const game = new Phaser.Game(phaserConfig);
    gameRef.current = game;

    // Wait for scene to be ready to pass config
    game.events.once('ready', () => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      sceneRef.current = scene;
      scene.scene.restart(config);
    });

    return () => {
      game.destroy(true);
    };
  }, []); // Only init once on mount

  // Update config when props change (re-start game if necessary or update params)
  useEffect(() => {
    if (sceneRef.current && gameRef.current?.isRunning) {
        // If the game is already running, we might want to restart with new settings
        // But usually we just pass config on initial start. 
        // For simplicity, we'll let the parent handle restarts by unmounting/mounting or key change
    }
  }, [config]);

  return (
    <div 
      ref={containerRef} 
      id="game-container"
      className="w-full h-full max-w-[400px] max-h-[600px] mx-auto overflow-hidden rounded-xl shadow-2xl bg-white/50 backdrop-blur"
    />
  );
});

GameCanvas.displayName = 'GameCanvas';
export default GameCanvas;
