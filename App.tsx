
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSimulation } from './hooks/useSimulation';
import GravityCanvas from './components/GravityCanvas';
import type { GameState, ParticleState, Vector, ComboState, GameHistoryEntry } from './types';
import DirectionalPad from './components/DirectionalPad';
import { HelpCircle } from 'lucide-react';

const MainMenu: React.FC<{onStart: () => void, onOpenHelp: () => void}> = ({ onStart, onOpenHelp }) => (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center text-center z-30 p-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-shadow-lg">포식자</h1>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
            `WASD` 또는 `화살표 키`로 조종하세요. 모바일에서는 화면의 방향키를 사용하세요.
            당신보다 작은 개체를 흡수하여 성장하고, 더 큰 개체는 피하세요. 세상에서 가장 거대한 존재가 되어보세요!
        </p>
        <div className="flex items-center gap-4">
            <button 
                onClick={onStart} 
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg text-xl md:text-2xl transition-transform transform hover:scale-105 shadow-lg"
            >
                게임 시작
            </button>
            <button onClick={onOpenHelp} title="도움말" className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <HelpCircle size={32}/>
            </button>
        </div>
    </div>
);

const GameHistoryChart: React.FC<{ history: GameHistoryEntry[] }> = ({ history }) => {
  const CHART_WIDTH = 400;
  const CHART_HEIGHT = 120;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 30;
  const PADDING_X = 40;

  if (history.length < 2) return null;

  const maxMass = Math.max(...history.map(p => p.mass), 50);
  const maxTime = history[history.length - 1].time;

  const getX = (time: number) => PADDING_X + (time / maxTime) * (CHART_WIDTH - PADDING_X * 2);
  const getY = (mass: number) => (CHART_HEIGHT - PADDING_BOTTOM) - (mass / maxMass) * (CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM);

  const pathData = history.map((point, i) => {
    const x = getX(point.time);
    const y = getY(point.mass);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [history]);

  const yTicks = 4;
  const xTicks = Math.min(5, Math.floor(maxTime / 10000));

  return (
    <svg width={CHART_WIDTH} height={CHART_HEIGHT} className="bg-black/20 rounded-lg">
      <style>{`
        @keyframes draw-line { to { stroke-dashoffset: 0; } }
        .animate-draw {
          stroke-dasharray: ${pathLength};
          stroke-dashoffset: ${pathLength};
          animation: draw-line 2s 0.2s ease-out forwards;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s 1.5s ease-out forwards; }
      `}</style>

      <defs>
        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(120, 80%, 70%)" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="hsl(120, 80%, 70%)" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const mass = (maxMass / yTicks) * i;
        const y = getY(mass);
        return (
          <g key={`h-grid-${i}`}>
            <line x1={PADDING_X} y1={y} x2={CHART_WIDTH - PADDING_X} y2={y} className="stroke-white/10" strokeWidth="1"/>
            <text x={PADDING_X - 8} y={y + 4} className="text-xs fill-white/50 text-right" textAnchor="end">{Math.round(mass)}</text>
          </g>
        );
      })}

      {Array.from({ length: xTicks + 1 }).map((_, i) => {
        const time = (maxTime / xTicks) * i;
        const x = getX(time);
        return (
          <g key={`v-grid-${i}`}>
            <line x1={x} y1={PADDING_TOP} x2={x} y2={CHART_HEIGHT - PADDING_BOTTOM} className="stroke-white/10" strokeWidth="1"/>
            <text x={x} y={CHART_HEIGHT - PADDING_BOTTOM + 15} className="text-xs fill-white/50" textAnchor="middle">{`${(time / 1000).toFixed(0)}s`}</text>
          </g>
        );
      })}
      
      <text x={PADDING_X / 2 - 10} y={CHART_HEIGHT / 2} className="text-xs fill-white/50" transform={`rotate(-90, ${PADDING_X / 2 - 10}, ${CHART_HEIGHT / 2})`}>질량</text>

      <path
        className="animate-fade-in opacity-0"
        d={`${pathData} L ${getX(maxTime)} ${CHART_HEIGHT - PADDING_BOTTOM} L ${PADDING_X} ${CHART_HEIGHT - PADDING_BOTTOM} Z`}
        fill="url(#area-gradient)"
      />
      
      <path
        ref={pathRef}
        className="animate-draw"
        d={pathData}
        fill="none"
        stroke="hsl(120, 80%, 70%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};


const GameOverScreen: React.FC<{ score: number, history: GameHistoryEntry[], onRestart: () => void }> = ({ score, history, onRestart }) => (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center z-30 p-4">
        <h2 className="text-5xl md:text-6xl font-bold text-red-500 mb-4">게임 오버</h2>
        <p className="text-2xl md:text-3xl text-white/90 mb-2">최종 질량: <span className="font-bold text-yellow-400">{score.toFixed(1)}</span></p>
        
        {history.length > 1 && (
            <div className="mb-6 mt-2">
                <p className="text-lg text-white/80 mb-2">질량 변화 기록</p>
                <GameHistoryChart history={history} />
            </div>
        )}

        <button 
            onClick={onRestart}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-xl md:text-2xl transition-colors"
        >
            다시 시작
        </button>
    </div>
);


const PauseMenu: React.FC<{ onResume: () => void, onRestart: () => void, onOpenHelp: () => void }> = ({ onResume, onRestart, onOpenHelp }) => (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center z-30 p-4">
        <h2 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-8">일시정지</h2>
        <div className="flex flex-col gap-4">
            <button 
                onClick={onResume}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg text-xl md:text-2xl transition-colors w-64"
            >
                계속하기
            </button>
            <button 
                onClick={onRestart}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-xl md:text-2xl transition-colors w-64"
            >
                다시 시작
            </button>
             <button 
                onClick={onOpenHelp}
                className="bg-gray-700/50 hover:bg-gray-600/50 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors w-64 mt-4"
            >
                도움말
            </button>
        </div>
    </div>
);

const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
      }, [onClose]);

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div 
                className="bg-gray-900/90 border border-gray-700 rounded-lg shadow-2xl p-6 w-full max-w-2xl text-white max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-bold text-cyan-400">도움말</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="space-y-6 text-base text-white/90">
                    <div>
                        <h3 className="text-xl font-semibold text-yellow-400 mb-2">목표</h3>
                        <p>당신보다 작은 개체를 흡수하여 성장하세요. 세상에서 가장 거대한 존재가 되는 것이 목표입니다.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-yellow-400 mb-2">조작법</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li><span className="font-semibold">키보드:</span> `WASD` 또는 `화살표 키`</li>
                            <li><span className="font-semibold">모바일:</span> 화면의 방향 패드</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-yellow-400 mb-2">기본 규칙</h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li><span className="font-bold text-green-400">자신 (밝은 초록색):</span> 당신의 개체입니다.</li>
                            <li><span className="font-bold text-cyan-400">먹이 (청록색):</span> 당신보다 질량이 작은 개체입니다. 흡수하여 성장할 수 있습니다.</li>
                            <li><span className="font-bold text-red-500">위협 (붉은색):</span> 당신보다 질량이 큰 개체입니다. 부딪히면 게임이 종료되니 피해야 합니다.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-yellow-400 mb-2">특수 요소</h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li><span className="font-bold" style={{color: 'hsl(300, 80%, 70%)'}}>축소기 (마젠타색 마름모):</span> 매우 위험합니다! 부딪히면 당신의 질량이 절반으로 줄어듭니다. 크기와 상관없이 모든 개체를 공격합니다.</li>
                            <li><span className="font-bold text-teal-300">보호막 (빛나는 아이템):</span> 획득 시, 위협적인 개체와의 충돌을 1회 방어해주는 보호막이 생깁니다.</li>
                            <li><span className="font-bold text-purple-400">성운 (보라색 안개):</span> 이 구역에 들어가면 모든 개체의 이동 속도가 느려집니다. 전략적으로 활용하세요.</li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold text-yellow-400 mb-2">콤보 시스템</h3>
                        <p>짧은 시간 안에 연속으로 개체를 흡수하면 콤보가 발동됩니다. 콤보가 높을수록 흡수 시 더 많은 질량 보너스를 얻습니다!</p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-8 rounded-lg text-lg transition-colors">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

const GameHUD: React.FC<{mass: number, objectCount: number}> = ({ mass, objectCount }) => {
    if (mass === 0) return null;
    return (
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm p-3 rounded-lg border border-white/20 text-white/90 text-right z-20 pointer-events-none">
            <p className="text-lg font-semibold">현재 질량: <span className="font-mono text-green-400">{mass.toFixed(1)}</span></p>
            <p className="text-sm text-white/70">주변 개체: <span className="font-mono">{objectCount > 0 ? objectCount - 1 : 0}</span></p>
        </div>
    );
};

const ComboUI: React.FC<{ combo: ComboState }> = ({ combo }) => {
  if (combo.count < 2) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-24 flex flex-col items-center gap-2 z-20 pointer-events-none">
      <p className="text-4xl font-bold text-white text-shadow-lg animate-ping-once" style={{textShadow: '0 0 10px #ff8c00, 0 0 20px #ff8c00'}}>
        {combo.count}x 콤보!
      </p>
      <div className="w-48 h-2 bg-black/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" 
          style={{ width: `${combo.timerProgress * 100}%`, transition: 'width 100ms linear' }}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MainMenu');
  const [finalScore, setFinalScore] = useState(0);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const inputDirectionRef = useRef<Vector>({ x: 0, y: 0 });
  const keyboardDirectionRef = useRef<Vector>({ x: 0, y: 0 });
  const joystickDirectionRef = useRef<Vector>({ x: 0, y: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const combineInputs = useCallback(() => {
    const joyX = joystickDirectionRef.current.x;
    const joyY = joystickDirectionRef.current.y;
    const keyX = keyboardDirectionRef.current.x;
    const keyY = keyboardDirectionRef.current.y;

    if (joyX !== 0 || joyY !== 0) {
        inputDirectionRef.current = { x: joyX, y: joyY };
    } else {
        inputDirectionRef.current = { x: keyX, y: keyY };
    }
  }, []);

  useEffect(() => {
    const updateKeyboardDirection = () => {
        let x = 0;
        let y = 0;
        if (keysPressed.current['w'] || keysPressed.current['ArrowUp']) y -= 1;
        if (keysPressed.current['s'] || keysPressed.current['ArrowDown']) y += 1;
        if (keysPressed.current['a'] || keysPressed.current['ArrowLeft']) x -= 1;
        if (keysPressed.current['d'] || keysPressed.current['ArrowRight']) x += 1;
        
        const magnitude = Math.hypot(x, y);
        if (magnitude > 0) {
            x /= magnitude;
            y /= magnitude;
        }
        keyboardDirectionRef.current = { x, y };
        combineInputs();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (isHelpOpen) {
                setIsHelpOpen(false);
            } else {
                setGameState(current => current === 'Playing' ? 'Paused' : (current === 'Paused' ? 'Playing' : current));
            }
        }
        if (keysPressed.current[e.key]) return;
        keysPressed.current[e.key] = true;
        updateKeyboardDirection();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        delete keysPressed.current[e.key];
        updateKeyboardDirection();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [combineInputs, isHelpOpen]);

  const handleGameOver = useCallback((score: number, history: GameHistoryEntry[]) => {
    setFinalScore(score);
    setGameHistory(history);
    setGameState('GameOver');
  }, []);

  const {
    simulationState,
    startGame,
    comboState,
  } = useSimulation(gameState, handleGameOver, inputDirectionRef);

  const handleStart = useCallback(() => {
    startGame();
    setGameHistory([]);
    setGameState('Playing');
  }, [startGame]);
  
  const handleJoystickMove = (dir: Vector) => {
    joystickDirectionRef.current = dir;
    combineInputs();
  };
  
  const handleResume = () => {
    setGameState('Playing');
  };

  const handleOpenHelp = () => {
    setIsHelpOpen(true);
  };

  const handleCloseHelp = () => {
    setIsHelpOpen(false);
  };

  const playerParticle = useMemo(() => 
    (gameState === 'Playing' || gameState === 'Paused') ? simulationState.particles.find(p => p.isPlayer) : null,
    [gameState, simulationState.particles]
  );

  return (
    <div 
      className="relative w-screen h-screen bg-black text-white font-['Inter'] select-none overflow-hidden"
    >
      <GravityCanvas
        simulationState={simulationState}
        settings={{ showWarp: false, showTemperature: false, showTrails: true, showMass: false, showVectors: false }}
        onClick={() => {}}
        playerParticle={playerParticle}
      />

      {isHelpOpen && <HelpModal onClose={handleCloseHelp} />}
      {gameState === 'MainMenu' && <MainMenu onStart={handleStart} onOpenHelp={handleOpenHelp} />}
      {gameState === 'GameOver' && <GameOverScreen score={finalScore} history={gameHistory} onRestart={handleStart} />}
      {gameState === 'Paused' && <PauseMenu onResume={handleResume} onRestart={handleStart} onOpenHelp={handleOpenHelp} />}
      {gameState === 'Playing' && <DirectionalPad onMove={handleJoystickMove} />}
      
      {(gameState === 'Playing' || gameState === 'Paused') && playerParticle && (
        <GameHUD mass={playerParticle.mass} objectCount={simulationState.particles.length} />
      )}
      {gameState === 'Playing' && <ComboUI combo={comboState} />}
      
      {playerParticle && (gameState === 'Playing' || gameState === 'Paused') && (
          <div 
            className={`absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-[width,height,opacity,border-color] duration-200 ease-out 
              ${playerParticle.hasShield 
                ? 'border-2 border-cyan-400 animate-pulse-shield' 
                : 'border-2 border-green-400'
              }`}
            style={{ 
              width: playerParticle.radius * 2 + 10,
              height: playerParticle.radius * 2 + 10,
              left: playerParticle.x, 
              top: playerParticle.y,
              opacity: playerParticle.hasShield ? 1 : 0.6,
              borderColor: playerParticle.hasShield ? '#22d3ee' : '#4ade80',
            }}
          />
      )}
    </div>
  );
};

export default App;