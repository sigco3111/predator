
import { useState, useCallback, useEffect, useRef } from 'react';
import type { SimulationState, Vector, GameState, ParticleState, PowerUpState, NebulaState, ThrusterParticle, ComboState, AbsorptionEffectParticle, GameHistoryEntry } from '../types';
import { createInitialParticle, updatePhysics } from '../services/simulationService';
import { MathUtils } from '../utils/math';
import { PHYSICS_CONFIG, GAMEPLAY_CONFIG } from '../constants';
import { PowerUpType } from '../types';

const PLAYER_INITIAL_MASS = 20;
const AI_PARTICLE_COUNT = 40; 
const SAFE_ZONE_RADIUS = 300; 

// Spawning constants
const SPAWN_INTERVAL = 2000; // ms for AI
const MAX_AI_PARTICLES = 80;
const MIN_AI_PARTICLES = 30;
const HISTORY_INTERVAL = 1000; // ms to record history

export const useSimulation = (
  gameState: GameState, 
  onGameOver: (finalMass: number, history: GameHistoryEntry[]) => void,
  inputDirectionRef: React.RefObject<Vector>
) => {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    particles: [],
    dustClouds: [],
    explosions: [],
    flashEffects: [],
    powerUps: [],
    nebulas: [],
    thrusterParticles: [],
    absorptionEffects: [],
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [comboState, setComboState] = useState<ComboState>({ count: 0, timerProgress: 0 });
  
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef({ ai: 0, powerUp: 0 });
  const comboTimeoutRef = useRef<number | null>(null);

  const gameHistoryRef = useRef<GameHistoryEntry[]>([]);
  const gameStartTimeRef = useRef<number>(0);
  const lastHistorySaveTimeRef = useRef<number>(0);

  const resetCombo = useCallback(() => {
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = null;
    setComboState({ count: 0, timerProgress: 0 });
  }, []);

  const startGame = useCallback(() => {
    resetCombo();
    const now = Date.now();
    gameStartTimeRef.current = now;
    lastHistorySaveTimeRef.current = 0;
    gameHistoryRef.current = [{ time: 0, mass: PLAYER_INITIAL_MASS }];
    
    setSimulationState(prevState => {
      const { width, height } = prevState;
      const playerStartX = width / 2;
      const playerStartY = height / 2;

      const playerParticle = createInitialParticle(
        playerStartX,
        playerStartY,
        {
            mass: PLAYER_INITIAL_MASS,
            isPlayer: true,
        }
      );
      playerParticle.baseColor = 'hsl(120, 80%, 60%)';

      const aiParticles = Array.from({ length: AI_PARTICLE_COUNT }, () => {
        let x, y, dist;
        do {
            x = Math.random() * width;
            y = Math.random() * height;
            dist = Math.hypot(x - playerStartX, y - playerStartY);
        } while (dist < SAFE_ZONE_RADIUS);

        const mass = MathUtils.randomInRange(2, PLAYER_INITIAL_MASS * 0.8);
        const isShrinker = Math.random() < 0.1; // 10% chance
          
        return createInitialParticle(x, y, { mass, vx: MathUtils.randomInRange(-2.5, 2.5), vy: MathUtils.randomInRange(-2.5, 2.5), isShrinker });
      });

      const nebulas: NebulaState[] = Array.from({length: GAMEPLAY_CONFIG.NEBULA.COUNT}, () => ({
          id: crypto.randomUUID(),
          x: Math.random() * width,
          y: Math.random() * height,
          radius: MathUtils.randomInRange(GAMEPLAY_CONFIG.NEBULA.MIN_RADIUS, GAMEPLAY_CONFIG.NEBULA.MAX_RADIUS),
          color: `hsla(${MathUtils.randomInRange(200, 280)}, 70%, 50%, 0.15)`
      }));

      lastSpawnTimeRef.current = { ai: now, powerUp: now };

      return {
        width: width,
        height: height,
        particles: [playerParticle, ...aiParticles],
        dustClouds: [],
        explosions: [],
        flashEffects: [],
        powerUps: [],
        nebulas: nebulas,
        thrusterParticles: [],
        absorptionEffects: [],
      };
    });
  }, [resetCombo]);

  const animate = useCallback((time: number) => {
    if (gameState !== 'Playing') {
        previousTimeRef.current = null;
        return;
    }

    if (previousTimeRef.current !== null) {
      const deltaTime = time - previousTimeRef.current;
      accumulatorRef.current += deltaTime;

      const fixedDeltaTime = PHYSICS_CONFIG.PERFORMANCE.PHYSICS_INTERVAL;
      
      const stepsToRun = Math.floor(accumulatorRef.current / fixedDeltaTime);
      if (stepsToRun > 0) {
          accumulatorRef.current -= stepsToRun * fixedDeltaTime;

          setSimulationState(currentState => {
              let nextState = currentState;
              let totalAbsorbed = 0;

              for (let i = 0; i < stepsToRun; i++) {
                  const playerIndex = nextState.particles.findIndex(p => p.isPlayer);
                  if (playerIndex === -1) {
                      break; 
                  }
                  const playerInStep = nextState.particles[playerIndex];

                  const playerWithControls = { ...playerInStep };
                  const inputDirection = inputDirectionRef.current;
                  
                  if (inputDirection) {
                      playerWithControls.vx *= GAMEPLAY_CONFIG.PLAYER_CONTROL.DAMPING_FACTOR;
                      playerWithControls.vy *= GAMEPLAY_CONFIG.PLAYER_CONTROL.DAMPING_FACTOR;

                      if (inputDirection.x !== 0 || inputDirection.y !== 0) {
                          const thrustX = inputDirection.x * GAMEPLAY_CONFIG.PLAYER_CONTROL.THRUST_FORCE;
                          const thrustY = inputDirection.y * GAMEPLAY_CONFIG.PLAYER_CONTROL.THRUST_FORCE;
                          const accelerationX = thrustX / playerWithControls.mass;
                          const accelerationY = thrustY / playerWithControls.mass;
                          const timeStep = fixedDeltaTime / 1000;
                          playerWithControls.vx += accelerationX * timeStep;
                          playerWithControls.vy += accelerationY * timeStep;
                      }
                  }
                  
                  const particlesWithPlayerMove = [...nextState.particles];
                  particlesWithPlayerMove[playerIndex] = playerWithControls;
                  
                  const stateWithPlayerMove = { ...nextState, particles: particlesWithPlayerMove };

                  const { newState: stateAfterPhysics, gameOver, playerAbsorbedCount, comboBroken } = updatePhysics(stateWithPlayerMove, fixedDeltaTime / 1000);
                  
                  nextState = stateAfterPhysics;
                  if(comboBroken) {
                    resetCombo();
                  }
                  totalAbsorbed += playerAbsorbedCount;
                  
                  if (gameOver) {
                      const finalHistory = [...gameHistoryRef.current, { time: Date.now() - gameStartTimeRef.current, mass: playerInStep.mass }];
                      onGameOver(playerInStep.mass, finalHistory);
                      resetCombo();
                      break;
                  }
                  
                  const updatedPlayer = nextState.particles.find(p => p.isPlayer);
                  if (!updatedPlayer) {
                      break;
                  }

                  const now = Date.now();
                  const gameTime = now - gameStartTimeRef.current;
                  if (gameTime - lastHistorySaveTimeRef.current > HISTORY_INTERVAL) {
                      gameHistoryRef.current.push({ time: gameTime, mass: updatedPlayer.mass });
                      lastHistorySaveTimeRef.current = gameTime;
                  }
                  
                  let newParticles: ParticleState[] = [];
                  const currentAiCount = nextState.particles.length - 1;
                  if ((now - lastSpawnTimeRef.current.ai > SPAWN_INTERVAL || currentAiCount < MIN_AI_PARTICLES) && currentAiCount < MAX_AI_PARTICLES) {
                      lastSpawnTimeRef.current.ai = now;
                      const spawnCount = MathUtils.randomIntInRange(1, 3);
                      for(let j = 0; j < spawnCount; j++) {
                          // NEW BALANCED SPAWN LOGIC
                          const { AI_SPAWN } = GAMEPLAY_CONFIG;
                          const playerMass = updatedPlayer.mass;

                          const isFood = Math.random() < 0.75;
                          let newMass: number;

                          if (isFood) {
                              const foodMassRatio = MathUtils.randomInRange(0.1, 0.6);
                              newMass = playerMass * foodMassRatio;
                          } else {
                              // Threat mass scaling becomes less extreme as player grows
                              const scalingProgress = MathUtils.clamp(
                                  (playerMass - AI_SPAWN.SCALE_START_MASS) / (PHYSICS_CONFIG.BLACK_HOLE.MASS_THRESHOLD - AI_SPAWN.SCALE_START_MASS),
                                  0, 
                                  1
                              );
                              
                              const currentMaxRatio = AI_SPAWN.MAX_THREAT_MASS_RATIO - 
                                  (AI_SPAWN.MAX_THREAT_MASS_RATIO - AI_SPAWN.MIN_SCALED_THREAT_MASS_RATIO) * scalingProgress;

                              const threatMassRatio = MathUtils.randomInRange(1.05, currentMaxRatio);
                              newMass = playerMass * threatMassRatio;
                          }
                          
                          const maxAllowedMass = playerMass * AI_SPAWN.MAX_SPAWN_MASS_CAP_RATIO;
                          newMass = MathUtils.clamp(newMass, PHYSICS_CONFIG.MIN_MASS, maxAllowedMass);
                          
                          const isShrinker = Math.random() < 0.15; // 15% chance for new spawns to be shrinkers

                          const edge = Math.floor(Math.random() * 4);
                          let x, y, vx, vy;
                          const buffer = 50;
                          if (edge === 0) { x = Math.random() * nextState.width; y = -buffer; vx = MathUtils.randomInRange(-3.75, 3.75); vy = MathUtils.randomInRange(2.5, 6.25); } 
                          else if (edge === 1) { x = nextState.width + buffer; y = Math.random() * nextState.height; vx = MathUtils.randomInRange(-6.25, -2.5); vy = MathUtils.randomInRange(-3.75, 3.75); } 
                          else if (edge === 2) { x = Math.random() * nextState.width; y = nextState.height + buffer; vx = MathUtils.randomInRange(-3.75, 3.75); vy = MathUtils.randomInRange(-6.25, -2.5); } 
                          else { x = -buffer; y = Math.random() * nextState.height; vx = MathUtils.randomInRange(2.5, 6.25); vy = MathUtils.randomInRange(-3.75, 3.75); }
                          newParticles.push(createInitialParticle(x, y, { mass: newMass, vx, vy, isShrinker }));
                      }
                  }

                  let newPowerUps: PowerUpState[] = [];
                  if (now - lastSpawnTimeRef.current.powerUp > GAMEPLAY_CONFIG.POWERUP.SPAWN_INTERVAL && nextState.powerUps.length < GAMEPLAY_CONFIG.POWERUP.MAX_COUNT) {
                      lastSpawnTimeRef.current.powerUp = now;
                      const type = PowerUpType.Shield;
                      newPowerUps.push({
                          id: crypto.randomUUID(),
                          x: Math.random() * nextState.width,
                          y: Math.random() * nextState.height,
                          radius: GAMEPLAY_CONFIG.POWERUP.SHIELD_RADIUS,
                          type: type,
                          creationTime: now,
                      });
                  }
                  
                  let newThrusterParticles: ThrusterParticle[] = [];
                  const playerSpeed = Math.hypot(updatedPlayer.vx, updatedPlayer.vy);
                  if (playerSpeed > GAMEPLAY_CONFIG.THRUSTER.MIN_VELOCITY_THRESHOLD) {
                      const angle = Math.atan2(updatedPlayer.vy, updatedPlayer.vx);
                      const offset = updatedPlayer.radius * GAMEPLAY_CONFIG.THRUSTER.OFFSET;
                      const thrusterX = updatedPlayer.x - offset * Math.cos(angle);
                      const thrusterY = updatedPlayer.y - offset * Math.sin(angle);
                      
                      newThrusterParticles.push({
                          id: crypto.randomUUID(),
                          x: thrusterX + MathUtils.randomInRange(-5, 5),
                          y: thrusterY + MathUtils.randomInRange(-5, 5),
                          radius: MathUtils.randomInRange(1, 3),
                          creationTime: now,
                          lifetime: GAMEPLAY_CONFIG.THRUSTER.LIFETIME,
                      });
                  }

                  nextState = {
                      ...nextState,
                      particles: [...nextState.particles, ...newParticles],
                      powerUps: [...nextState.powerUps.filter(p => now - p.creationTime < GAMEPLAY_CONFIG.POWERUP.LIFETIME), ...newPowerUps],
                      thrusterParticles: [...nextState.thrusterParticles.filter(t => now - t.creationTime < t.lifetime), ...newThrusterParticles],
                  };
              }

              if (totalAbsorbed > 0) {
                const now = Date.now();
                if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
                
                setComboState(prev => ({ ...prev, count: prev.count + totalAbsorbed }));

                comboTimeoutRef.current = window.setTimeout(() => {
                    resetCombo();
                }, GAMEPLAY_CONFIG.COMBO.DURATION);
              }
              return nextState;
          });
      }
    }
    
    // Update combo timer progress
    if (comboTimeoutRef.current) {
        setComboState(prev => ({...prev, timerProgress: 1})); // Reset progress on new combo
    }

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, onGameOver, inputDirectionRef, resetCombo]);

  // Combo timer progress animation
  useEffect(() => {
    let timerId: number;
    if (comboState.count > 0) {
        const startTime = Date.now();
        const duration = GAMEPLAY_CONFIG.COMBO.DURATION;
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.max(0, 1 - elapsed / duration);
            setComboState(prev => ({ ...prev, timerProgress: progress }));
            if (progress > 0) {
                timerId = requestAnimationFrame(tick);
            }
        };
        timerId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(timerId);
  }, [comboState.count]);

  useEffect(() => {
    const handleResize = () => {
      setSimulationState(s => ({ ...s, width: window.innerWidth, height: window.innerHeight }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (gameState === 'Playing') {
      previousTimeRef.current = performance.now();
      accumulatorRef.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      if(gameState !== 'Paused') {
        resetCombo();
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (comboTimeoutRef.current) {
          clearTimeout(comboTimeoutRef.current);
      }
    };
  }, [gameState, animate, resetCombo]);

  return {
    simulationState,
    startGame,
    comboState,
  };
};