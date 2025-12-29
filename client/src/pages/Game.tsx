import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, RefreshCw, Trophy, Home, Hand } from 'lucide-react';
import { useSubmitScore, useScores } from '@/hooks/use-scores';
import GameCanvas, { GameCanvasRef } from '@/components/game/GameCanvas';
import { GestureController } from '@/components/game/GestureController';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Game State Types
type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER' | 'WIN';

interface GameResult {
  score: number;
  parts: number;
  discount: number;
}

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [playerName, setPlayerName] = useState("Guest");
  
  // Settings
  const [useGestures, setUseGestures] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy'|'normal'|'hard'>('normal');

  const gameRef = useRef<GameCanvasRef>(null);
  const submitScore = useSubmitScore();
  const { data: leaderboard } = useScores();

  const startGame = () => {
    setGameState('PLAYING');
  };

  const handleGameOver = (stats: GameResult) => {
    setGameResult(stats);
    setGameState('GAME_OVER');
  };

  const handleWin = (stats: GameResult) => {
    setGameResult(stats);
    setGameState('WIN');
    // Auto-submit score on win? Or prompt?
    submitScore.mutate({
      playerName,
      score: stats.score,
      discountEarned: stats.discount,
      partsStacked: stats.parts
    });
  };

  const handleDrop = () => {
    if (gameState === 'PLAYING' && gameRef.current) {
      gameRef.current.triggerDrop();
    }
  };

  const getDifficultyConfig = () => {
    switch(difficulty) {
      case 'easy': return { moveSpeed: 3, tolerance: 20 };
      case 'hard': return { moveSpeed: 8, tolerance: 5 };
      default: return { moveSpeed: 5, tolerance: 10 };
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans text-foreground overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#002A54]/5 rounded-full blur-3xl" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-[#9D8848]/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] w-full max-w-7xl gap-8 h-[90vh] items-center">
        
        {/* Left Column: Branding & Leaderboard */}
        <div className="hidden lg:flex flex-col gap-6 h-full justify-center">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold font-display text-primary tracking-tight">
              Hilton<br/>Stacker
            </h1>
            <p className="text-muted-foreground text-lg max-w-xs">
              Build your way to the top. Stack floors perfectly to earn up to 50% discount on your next stay.
            </p>
          </div>

          <Card className="p-6 bg-white/80 backdrop-blur border-none shadow-xl flex-1 max-h-[400px] overflow-hidden flex flex-col">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#9D8848]" /> Top Builders
            </h3>
            <div className="overflow-y-auto space-y-3 flex-1 pr-2">
              {leaderboard?.map((score, i) => (
                <div key={score.id} className="flex justify-between items-center p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-6">#{i+1}</span>
                    <span className="font-medium text-sm truncate max-w-[120px]">{score.playerName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{score.score}%</div>
                    <div className="text-xs text-[#9D8848] font-semibold">{score.discountEarned}% OFF</div>
                  </div>
                </div>
              ))}
              {!leaderboard?.length && (
                <div className="text-center text-muted-foreground py-8">No scores yet. Be the first!</div>
              )}
            </div>
          </Card>
        </div>

        {/* Center Column: Game Area */}
        <div className="relative w-full max-w-[400px] mx-auto h-[600px] lg:h-[700px] flex flex-col justify-center">
          {/* Game Canvas Wrapper */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-[8px] border-white bg-gradient-to-b from-[#e6f3ff] to-white">
            
            {/* The Actual Game Canvas */}
            <GameCanvas 
              ref={gameRef}
              config={{
                ...getDifficultyConfig(),
                onGameOver: handleGameOver,
                onWin: handleWin
              }} 
            />

            {/* Overlays */}
            <AnimatePresence>
              {gameState === 'MENU' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-display font-bold text-primary">Ready to Build?</h2>
                    <p className="text-muted-foreground">Stack 6 floors to win rewards.</p>
                  </div>

                  <div className="w-full space-y-4">
                    <Input 
                      placeholder="Enter Guest Name" 
                      className="text-center text-lg h-12 bg-white"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                    
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                         <Hand className="w-4 h-4 text-primary" />
                         <Label>Gesture Control</Label>
                      </div>
                      <Switch checked={useGestures} onCheckedChange={setUseGestures} />
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-14 text-xl font-bold bg-[#002A54] hover:bg-[#002A54]/90 text-white shadow-lg shadow-blue-900/20"
                    onClick={startGame}
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" /> Start Game
                  </Button>
                  
                  {/* Mobile Leaderboard Trigger */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="lg:hidden w-full">View Leaderboard</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Leaderboard</DialogTitle></DialogHeader>
                      <div className="max-h-[300px] overflow-y-auto">
                         {/* Same list as desktop */}
                         {leaderboard?.map((score, i) => (
                            <div key={score.id} className="flex justify-between items-center p-2 border-b">
                              <span>#{i+1} {score.playerName}</span>
                              <span>{score.score}%</span>
                            </div>
                         ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              )}

              {gameState === 'GAME_OVER' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center text-white"
                >
                  <h2 className="text-4xl font-display font-bold mb-2 text-red-500">Toppled!</h2>
                  <p className="text-gray-300 mb-8">The tower became unstable.</p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    <div className="bg-white/10 p-4 rounded-xl">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Floors</div>
                      <div className="text-3xl font-bold">{gameResult?.parts}/6</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Stability</div>
                      <div className="text-3xl font-bold">{gameResult?.score}%</div>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full">
                    <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white" onClick={() => setGameState('MENU')}>
                      <Home className="w-4 h-4 mr-2" /> Menu
                    </Button>
                    <Button className="flex-1 bg-[#9D8848] hover:bg-[#8c7940] text-white font-bold" onClick={startGame}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Retry
                    </Button>
                  </div>
                </motion.div>
              )}

              {gameState === 'WIN' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#002A54]/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center text-white"
                >
                  <Trophy className="w-20 h-20 text-[#9D8848] mb-6 drop-shadow-[0_0_15px_rgba(157,136,72,0.5)]" />
                  <h2 className="text-5xl font-display font-bold mb-2 text-white">Grand Opening!</h2>
                  <p className="text-blue-200 mb-8">You've successfully built the hotel.</p>
                  
                  <div className="bg-white/10 p-6 rounded-2xl w-full mb-8 border border-white/10">
                    <div className="text-sm text-blue-200 uppercase tracking-wider mb-1">Discount Earned</div>
                    <div className="text-6xl font-bold text-[#9D8848] font-display">{gameResult?.discount}%</div>
                    <div className="text-xs text-white/50 mt-2">Based on stack accuracy</div>
                  </div>

                  <div className="flex gap-4 w-full">
                    <Button variant="outline" className="flex-1 border-white/20 hover:bg-white/10 text-white" onClick={() => setGameState('MENU')}>
                      Menu
                    </Button>
                    <Button className="flex-1 bg-white text-[#002A54] hover:bg-blue-50 font-bold" onClick={startGame}>
                      Play Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Controls & Instructions */}
        <div className="hidden lg:flex flex-col gap-6 h-full justify-center">
          {/* Gesture Camera Feed */}
          {useGestures && (
             <Card className="p-4 bg-black border-none shadow-xl overflow-hidden flex flex-col items-center">
                <h3 className="text-white text-sm font-medium mb-3 w-full flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> Camera Feed
                </h3>
                <GestureController enabled={useGestures && gameState === 'PLAYING'} onDrop={handleDrop} />
                <p className="text-xs text-gray-500 mt-2">Make a <span className="text-white font-bold">fist</span> to drop block</p>
             </Card>
          )}

          <Card className="p-6 bg-white/80 backdrop-blur border-none shadow-xl">
             <h3 className="font-bold text-primary mb-4">How to Play</h3>
             <ul className="space-y-3 text-sm text-muted-foreground">
               <li className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#002A54] flex items-center justify-center font-bold text-xs shrink-0">1</div>
                 Blocks move left and right automatically.
               </li>
               <li className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#002A54] flex items-center justify-center font-bold text-xs shrink-0">2</div>
                 Press <span className="font-bold text-primary bg-neutral-100 px-1 rounded">SPACE</span> or <span className="font-bold text-primary bg-neutral-100 px-1 rounded">CLICK</span> to drop.
               </li>
               <li className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#002A54] flex items-center justify-center font-bold text-xs shrink-0">3</div>
                 Align perfectly to keep the tower wide.
               </li>
               <li className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#002A54] flex items-center justify-center font-bold text-xs shrink-0">4</div>
                 Reach level 6 to unlock your discount!
               </li>
             </ul>
             
             <div className="mt-6 pt-6 border-t">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm font-medium">Difficulty</span>
                 <span className="text-xs uppercase font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">{difficulty}</span>
               </div>
               <div className="flex gap-2">
                 <Button 
                   size="sm" 
                   variant={difficulty === 'easy' ? 'default' : 'outline'} 
                   className="flex-1 text-xs"
                   onClick={() => setDifficulty('easy')}
                   disabled={gameState === 'PLAYING'}
                  >
                   Easy
                 </Button>
                 <Button 
                   size="sm" 
                   variant={difficulty === 'normal' ? 'default' : 'outline'} 
                   className="flex-1 text-xs"
                   onClick={() => setDifficulty('normal')}
                   disabled={gameState === 'PLAYING'}
                  >
                   Normal
                 </Button>
                 <Button 
                   size="sm" 
                   variant={difficulty === 'hard' ? 'default' : 'outline'} 
                   className="flex-1 text-xs"
                   onClick={() => setDifficulty('hard')}
                   disabled={gameState === 'PLAYING'}
                  >
                   Hard
                 </Button>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
