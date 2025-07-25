
export const PHYSICS_CONFIG = {
  G: 250,
  MELTING_THRESHOLD: 1000,
  FUSION_THRESHOLD: 5000,
  MIN_MASS: 1,
  MAX_MASS: 50,
  INITIAL_PARTICLE_COUNT: { MIN: 50, MAX: 100 },
  COLLISION: {
    DESTRUCTIVE_VELOCITY_THRESHOLD: 200,
    CAPTURE_VELOCITY_THRESHOLD: 250,
    GRAVITATIONAL_CAPTURE_FACTOR: 1.15,
    EXTREME_MASS_RATIO: 10,
    FRAGMENT_COUNT: 3,
    FRAGMENT_MASS_RATIO: 0.2,
    FRAGMENT_SPEED_RATIO: 0.33,
  },
  DUST_CLOUD: {
    LIFETIME: 30000,
    MASS_RATIO: 0.15,
    ACCRETION_RATE: 0.5,
  },
  BLACK_HOLE: {
    MASS_THRESHOLD: 1000,
    TRANSITION_DELAY: 3000,
    RADIUS_RATIO: 0.1,
    GRAVITY_MULTIPLIER: 3.0,
    ABSORPTION_RANGE: 2.5,
    COLLAPSE_ANIMATION_DURATION: 2000,
    FLASH_DURATION: 500,
  },
  PERFORMANCE: {
    PARTICLE_COUNT_THRESHOLD: 500,
    CLEANUP_THRESHOLD: 500,
    EMERGENCY_CLEANUP_DELAY: 5000,
    MIN_SIMULATION_SPEED: 0.1,
    FRAME_TIME_THRESHOLD: 50, // ms
    FRAME_HISTORY_SIZE: 30,
    PHYSICS_INTERVAL: 16.67, // ~60fps
  },
  TRAILS: {
    MAX_LENGTH: 120,
    MAX_AGE: 6000,
    EDGE_THRESHOLD: 50,
    ALPHA_MAX: 0.6,
  },
  PHYSICS_SUBSTEPS: 5,
  FORCE_SOFTENING_FACTOR: 3,
};

export const GAMEPLAY_CONFIG = {
    POWERUP: {
        SHIELD_RADIUS: 12,
        SPAWN_INTERVAL: 10000, // 10 seconds
        MAX_COUNT: 4,
        LIFETIME: 15000, // 15 seconds
    },
    NEBULA: {
        COUNT: 3,
        MIN_RADIUS: 150,
        MAX_RADIUS: 300,
        DRAG_FACTOR: 0.985, // slows down particles inside
    },
    THRUSTER: {
        LIFETIME: 350, // ms
        OFFSET: 1.2, // how far behind the player particles spawn
        MIN_VELOCITY_THRESHOLD: 20,
    },
    PLAYER_CONTROL: {
        THRUST_FORCE: 40000, // unit: mass * pixels / sec^2
        DAMPING_FACTOR: 0.985, // unitless, per physics step
    },
    COMBO: {
        DURATION: 3000, // ms to get next absorption
        MASS_BONUS_FACTOR: 0.05, // 5% bonus mass per combo level
    },
    GENERAL_AI: {
        DETECTION_RADIUS: 350,
        ENGAGEMENT_RADIUS: 200, // AI will chase more aggressively within this radius.
        FLEE_FORCE: 2500,
        CHASE_FORCE: 2500,
        WANDER_FORCE: 625,
        WANDER_JITTER: 10, // Radians per second of random angle change for wander.
        PATROL_FORCE: 875, // Guides idle AI back to the center.
        SHRINKER_CHASE_MULTIPLIER: 1.5,
    },
    AI_SPAWN: {
        SCALE_START_MASS: 100, // Player mass at which threat scaling begins.
        MAX_THREAT_MASS_RATIO: 1.7, // Initial maximum mass ratio for new threats (e.g., 1.7x player mass).
        MIN_SCALED_THREAT_MASS_RATIO: 1.2, // The maximum mass ratio for threats when player is at max size (makes late game fairer).
        MAX_SPAWN_MASS_CAP_RATIO: 1.5, // An absolute cap on any new particle's mass relative to the player's mass.
    },
}

export const RENDER_CONFIG = {
  EFFECTS: {
    ILLUMINATION_RANGE_MULTIPLIER: 8,
    GRID_SIZE: 50,
  },
  COLORS: {
    BACKGROUND: '#000000',
    DEFAULT_PARTICLE: 'hsl(200, 70%, 60%)',
    EXPLOSION_COLOR: 'rgba(255, 200, 100, 0.8)',
    FLASH_COLOR: 'rgba(255, 255, 255, 0.9)',
    SHIELD_POWERUP: 'hsl(180, 100%, 70%)',
  },
  TEXT: {
    FONT_FAMILY: 'Inter, sans-serif',
    FONT_SIZE_BASE: 14,
  },
};