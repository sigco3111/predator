
export interface Vector {
  x: number;
  y: number;
}

export enum PowerUpType {
  Shield = 'shield',
}

export interface PowerUpState {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
  creationTime: number;
}

export interface NebulaState {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface ThrusterParticle {
    id:string;
    x: number;
    y: number;
    radius: number;
    creationTime: number;
    lifetime: number;
}

export interface AbsorptionEffectParticle {
  id:string;
  x: number; y: number;
  vx: number; vy: number;
  creationTime: number;
  lifetime: number;
  color: string;
  radius: number;
}

export interface ParticleState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  temperature: number;
  baseColor: string;
  trail: Vector[];
  isBlackHole: boolean;
  isTransitioningToBlackHole: boolean;
  isStar: boolean;
  isMolten: boolean;
  isGaseous: boolean;
  illumination: {
    intensity: number;
    direction: Vector;
  };
  blackHoleState: BlackHoleState | null;
  isPlayer?: boolean;
  hasShield: boolean;
  isShrinker: boolean;
  wanderAngle: number;
}

export type GameState = 'MainMenu' | 'Playing' | 'GameOver' | 'Paused';

export interface ComboState {
  count: number;
  timerProgress: number; // 0 to 1
}

export interface BlackHoleState {
    collapseStartTime: number;
    originalStarRadius: number;
}

export interface DustCloudState {
  id: string;
  x: number;
  y: number;
  mass: number;
  initialMass: number;
  radius: number;
  initialRadius: number;
  creationTime: number;
}

export interface ExplosionState {
  id:string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  intensity: number;
  isShockwave: boolean;
  color?: string;
}

export interface FlashEffectState {
    id: string;
    x: number;
    y: number;
    startTime: number;
    duration: number;
}

export interface SimulationState {
  particles: ParticleState[];
  dustClouds: DustCloudState[];
  explosions: ExplosionState[];
  flashEffects: FlashEffectState[];
  powerUps: PowerUpState[];
  nebulas: NebulaState[];
  thrusterParticles: ThrusterParticle[];
  absorptionEffects: AbsorptionEffectParticle[];
  width: number;
  height: number;
}

export interface SimulationSettings {
  showWarp: boolean;
  showTemperature: boolean;
  showTrails: boolean;
  showVectors: boolean;
  showMass: boolean;
}

export interface GameHistoryEntry {
  time: number; // in milliseconds from game start
  mass: number;
}

export interface AddMassData {
    mass: number;
    radius: number;
    vx: number;
    vy: number;
    x: number;
    y: number;
}