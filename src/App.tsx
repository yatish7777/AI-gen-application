import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Trophy, 
  Gamepad2, 
  Music as MusicIcon,
  RefreshCw,
  Terminal
} from 'lucide-react';

// --- Types & Constants ---

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  color: string;
}

const DUMMY_TRACKS: Track[] = [
  { id: '1', title: 'Cyber Pulse', artist: 'AI Voyager', duration: 184, color: 'text-cyan-400' },
  { id: '2', title: 'Neon Grids', artist: 'Bit Runner', duration: 212, color: 'text-pink-500' },
  { id: '3', title: 'Glitch Dreams', artist: 'Syntho', duration: 156, color: 'text-purple-400' },
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 150;

// --- Components ---

const SnakeGame = ({ onScoreChange, highScore, onScoreUpdate }: { onScoreChange: (score: number) => void, highScore: number, onScoreUpdate: (score: number) => void }) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  // Safely notify parent of score changes outside the moveSnake/render cycle
  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  useEffect(() => {
    if (isGameOver) {
      onScoreUpdate(score);
    }
  }, [isGameOver, score, onScoreUpdate]);

  const generateFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'arrowdown':
        case 's': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'arrowleft':
        case 'a': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'arrowright':
        case 'd': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  const tick = useCallback((timestamp: number) => {
    const speed = Math.max(80, BASE_SPEED - (Math.floor(score / 50) * 10));
    if (timestamp - lastUpdateRef.current > speed) {
      moveSnake();
      lastUpdateRef.current = timestamp;
    }
    gameLoopRef.current = requestAnimationFrame(tick);
  }, [moveSnake, score]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(tick);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [tick]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  return (
    <div className="relative">
      <div 
        className="grid bg-[#000] border-2 border-glitch-border shadow-[0_0_40px_rgba(255,95,31,0.2)]"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          width: 'min(70vh, 480px)',
          aspectRatio: '1/1'
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isSnake = snake.some(s => s.x === x && s.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isFood = food.x === x && food.y === y;

          return (
            <div 
              key={i} 
              className={`w-full h-full border-[0.5px] border-white/5 ${
                isHead ? 'snake-head z-10' : 
                isSnake ? 'snake-body' : 
                isFood ? 'food-glitch' : 
                ''
              }`}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md z-20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
            <h2 className="text-6xl font-black italic tracking-tighter glitch-text mb-4">SEGMENTATION_FAULT</h2>
            <p className="text-xl font-mono text-glitch-blue mb-8 tracking-[0.5em] font-bold">VAL_{score.toString().padStart(5, '0')}</p>
            <button 
              onClick={resetGame}
              className="px-10 py-4 bg-glitch-orange text-black font-black uppercase tracking-[0.3em] hover:bg-white transition-all active:scale-95 skew-x-[-12deg]"
            >
              RUN_EXEC /REBOOT
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [gameScore, setGameScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentTrack = DUMMY_TRACKS[currentTrackIndex];

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setProgress(p => (p + 1) % currentTrack.duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration]);

  const handleScoreUpdate = useCallback((score: number) => {
    setHighScore(prev => Math.max(prev, score));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex flex-col border border-glitch-border selection:bg-glitch-blue selection:text-black">
      <div className="crt-overlay" />
      
      {/* Header */}
      <header className="h-[60px] flex items-center justify-between px-8 bg-black border-b border-glitch-border shrink-0 z-10">
        <div className="text-lg font-black tracking-[8px] glitch-text skew-x-[-10deg]">SYSTEM.NEURAL_NET.01</div>
        <div className="text-[10px] text-glitch-dim flex items-center gap-4 font-bold tracking-[0.2em]">
          DATA_STREAM: <span className="text-glitch-blue animate-pulse whitespace-nowrap">STABLE_CONNECTION</span>
          <div className="w-3 h-[2px] bg-glitch-orange shadow-[0_0_8px_#FF5F1F]" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex bg-glitch-border gap-[1px]">
        {/* Left Sidebar - Playlist */}
        <aside className="w-[260px] bg-glitch-bg p-8 flex flex-col gap-8 z-10">
          <span className="section-label">INPUT_POOL</span>
          <div className="flex flex-col gap-4">
            {DUMMY_TRACKS.map((track, idx) => (
              <div 
                key={track.id}
                onClick={() => {
                  setCurrentTrackIndex(idx);
                  setProgress(0);
                }}
                className={`p-4 transition-all cursor-pointer border-l-2 skew-x-[-5deg] ${
                  currentTrackIndex === idx 
                    ? 'bg-glitch-orange/10 border-glitch-orange text-glitch-orange shadow-[0_0_15px_rgba(255,95,31,0.1)]' 
                    : 'bg-white/5 border-transparent text-glitch-dim hover:bg-white/10'
                }`}
              >
                <div className="text-[12px] font-black mb-1 truncate tracking-tighter uppercase">{track.title}</div>
                <div className="text-[9px] opacity-70 tracking-widest">SOURCE: {track.artist}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center - Game Area */}
        <section className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none font-pixel text-8xl text-white">010110</div>
          <SnakeGame 
            onScoreChange={setGameScore} 
            highScore={highScore} 
            onScoreUpdate={handleScoreUpdate}
          />
        </section>

        {/* Right Sidebar - Stats */}
        <aside className="w-[280px] bg-glitch-bg p-8 border-l border-glitch-border flex flex-col z-10">
          <span className="section-label">VITAL_SIGNS</span>
          
          <div className="bg-glitch-panel border border-glitch-border p-6 mb-6 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-glitch-orange" />
            <div className="text-[10px] mb-3 text-glitch-dim font-black tracking-[0.3em] uppercase">CURR_METRIC</div>
            <div className="stat-value">{gameScore.toString().padStart(6, '0')}</div>
          </div>

          <div className="bg-glitch-panel border border-glitch-border p-6 mb-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-glitch-blue" />
            <div className="text-[10px] mb-3 text-glitch-dim font-black tracking-[0.3em] uppercase">MAX_RECORDED</div>
            <div className="stat-value !text-glitch-blue">{highScore.toString().padStart(6, '0')}</div>
          </div>

          <span className="section-label">INPUT_MAP</span>
          <div className="grid grid-cols-3 gap-2 font-pixel text-glitch-orange">
            <div className="col-start-2 border border-glitch-border p-3 text-center text-lg bg-white/5 shadow-inner">W</div>
            <div className="col-start-1 border border-glitch-border p-3 text-center text-lg bg-white/5">A</div>
            <div className="col-start-2 border border-glitch-border p-3 text-center text-lg bg-white/5">S</div>
            <div className="col-start-3 border border-glitch-border p-3 text-center text-lg bg-white/5">D</div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-glitch-border text-[9px] text-glitch-dim flex justify-between font-black tracking-widest">
            <span>CORE_OS</span>
            <span className="text-glitch-orange">ENIGMA_AI.EXE</span>
          </div>
        </aside>
      </main>

      {/* Footer - Music Player Bar */}
      <footer className="h-[100px] bg-black border-t-4 border-glitch-orange shrink-0 grid grid-cols-[300px_1fr_300px] items-center px-8 relative overflow-hidden z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-glitch-orange flex items-center justify-center shrink-0 skew-x-[-10deg]">
            <MusicIcon size={28} className="text-black" />
          </div>
          <div className="min-w-0">
            <div className="text-[16px] font-black truncate tracking-tighter uppercase text-glitch-orange italic">{currentTrack.title}</div>
            <div className="text-[10px] text-glitch-dim truncate uppercase tracking-[0.3em] font-bold">SIG_{currentTrack.artist}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-12">
            <button 
              onClick={() => {
                setCurrentTrackIndex(prev => (prev - 1 + DUMMY_TRACKS.length) % DUMMY_TRACKS.length);
                setProgress(0);
              }}
              className="text-glitch-blue hover:text-white transition-colors"
            >
              <SkipBack size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 bg-glitch-blue text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:bg-white transition-all active:scale-90 skew-x-[15deg]"
            >
              <div className="skew-x-[-15deg]">
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
              </div>
            </button>
            <button 
              onClick={() => {
                setCurrentTrackIndex(prev => (prev + 1) % DUMMY_TRACKS.length);
                setProgress(0);
              }}
              className="text-glitch-blue hover:text-white transition-colors"
            >
              <SkipForward size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 text-xs font-mono font-black text-glitch-dim">
           <span className="stat-value !text-lg">{formatTime(progress)}</span>
           <span className="opacity-30">/</span>
           <span className="stat-value !text-lg !text-glitch-dim opacity-50">{formatTime(currentTrack.duration)}</span>
        </div>

        <div className="absolute top-0 left-0 w-full h-[6px] bg-glitch-border overflow-hidden">
          <motion.div 
            className="h-full bg-white shadow-[0_0_15px_#fff]"
            animate={{ width: `${(progress / currentTrack.duration) * 100}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
      </footer>
    </div>
  );
}
