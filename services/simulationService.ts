
import type { SimulationState, ParticleState, DustCloudState, ExplosionState, Vector, PowerUpState, AbsorptionEffectParticle } from '../types';
import { PHYSICS_CONFIG, GAMEPLAY_CONFIG, RENDER_CONFIG } from '../constants';
import { ColorUtils, MathUtils } from '../utils/math';
import { PowerUpType } from '../types';
import { spatialGrid } from './spatialGridService';

// --- PARTICLE CREATION & STATE UPDATE ---

export const createInitialParticle = (
    x: number, y: number,
    data: { mass: number; vx?: number; vy?: number; radius?: number; isPlayer?: boolean, isShrinker?: boolean }
): ParticleState => {
    const mass = data.mass;
    const radius = data.radius ?? Math.sqrt(mass) * 2 + 1;
    const particle: Omit<ParticleState, 'id' | 'trail'> = {
        x, y, mass, radius,
        vx: data.vx ?? 0,
        vy: data.vy ?? 0,
        temperature: 0,
        baseColor: ColorUtils.generateRandomColor(),
        isBlackHole: false,
        isTransitioningToBlackHole: false,
        isStar: false,
        isMolten: false,
        isGaseous: false,
        illumination: { intensity: 0, direction: { x: 0, y: 0 } },
        blackHoleState: null,
        isPlayer: data.isPlayer ?? false,
        hasShield: false,
        isShrinker: data.isShrinker ?? false,
        wanderAngle: Math.random() * Math.PI * 2,
    };
    return { ...updateParticleDerivedState(particle), id: crypto.randomUUID(), trail: [] };
};

const updateParticleDerivedState = <T extends Omit<ParticleState, 'id' | 'trail'>>(particle: T): T => {
    const area = Math.PI * particle.radius * particle.radius;
    const density = particle.mass / area;
    const gravityEffect = particle.mass * particle.mass / particle.radius;
    const temperature = 100 + density * 50 + gravityEffect * 2;
    const isStar = temperature > PHYSICS_CONFIG.FUSION_THRESHOLD;
    
    let isTransitioningToBlackHole = particle.isTransitioningToBlackHole;
    let blackHoleState = particle.blackHoleState;

    if (isStar && particle.mass > PHYSICS_CONFIG.BLACK_HOLE.MASS_THRESHOLD && !particle.isBlackHole && !isTransitioningToBlackHole) {
        isTransitioningToBlackHole = true;
        blackHoleState = {
            collapseStartTime: Date.now() + PHYSICS_CONFIG.BLACK_HOLE.TRANSITION_DELAY,
            originalStarRadius: particle.radius,
        };
    }

    const newRadius = Math.sqrt(particle.mass) * 2 + 1;

    return {
        ...particle,
        radius: newRadius,
        temperature,
        isStar,
        isMolten: temperature > PHYSICS_CONFIG.MELTING_THRESHOLD,
        isGaseous: particle.radius >= 40 && particle.mass < 15,
        isTransitioningToBlackHole,
        blackHoleState,
    };
};

// --- PHYSICS UPDATE PIPELINE ---

export const updatePhysics = (state: SimulationState, dt: number): { newState: SimulationState, gameOver: boolean, playerAbsorbedCount: number, comboBroken: boolean } => {
    // 0. Build Spatial Grid for optimization
    spatialGrid.build(state.particles, state.width, state.height);

    // 1. Run integration substeps
    let stateAfterIntegration = state;
    for (let i = 0; i < PHYSICS_CONFIG.PHYSICS_SUBSTEPS; i++) {
        const subDt = dt / PHYSICS_CONFIG.PHYSICS_SUBSTEPS;
        stateAfterIntegration = integrate(stateAfterIntegration, subDt);
    }

    // 2. Handle collisions
    const collisionResult = handleCollisions(stateAfterIntegration);
    const stateAfterCollisions = {
        ...stateAfterIntegration,
        particles: collisionResult.particles,
        explosions: [...state.explosions, ...collisionResult.newExplosions],
        dustClouds: collisionResult.dustClouds,
        powerUps: collisionResult.powerUps,
        absorptionEffects: [...state.absorptionEffects, ...collisionResult.newAbsorptionEffects],
    };

    // 3. Update individual particle states (trails, black holes)
    const particlesWithUpdatedState = stateAfterCollisions.particles.map(p => 
        updateParticleState(p, stateAfterCollisions.width, stateAfterCollisions.height)
    );
    const stateWithUpdatedParticles = {
        ...stateAfterCollisions,
        particles: particlesWithUpdatedState,
    };

    // 4. Update effects (dust cloud lifetime, explosions, etc.)
    const finalState = updateEffects(stateWithUpdatedParticles, dt);
    
    return { newState: finalState, gameOver: collisionResult.gameOver, playerAbsorbedCount: collisionResult.playerAbsorbedCount, comboBroken: collisionResult.comboBroken };
};

// --- CORE PHYSICS ---

const integrate = (state: SimulationState, dt: number): SimulationState => {
    const forces = calculateAllForces(state);

    const particlesAfterForces = state.particles.map((p, i) => {
        const ax = forces[i].x / p.mass;
        const ay = forces[i].y / p.mass;
        let vx = p.vx + ax * dt;
        let vy = p.vy + ay * dt;
        
        // Nebula Drag
        for (const nebula of state.nebulas) {
            const distSq = (p.x - nebula.x)**2 + (p.y - nebula.y)**2;
            if (distSq < nebula.radius**2) {
                vx *= GAMEPLAY_CONFIG.NEBULA.DRAG_FACTOR;
                vy *= GAMEPLAY_CONFIG.NEBULA.DRAG_FACTOR;
                break;
            }
        }
        
        let x = p.x + vx * dt;
        let y = p.y + vy * dt;

        // World wrapping
        if (x < 0) x += state.width;
        if (x > state.width) x -= state.width;
        if (y < 0) y += state.height;
        if (y > state.height) y -= state.height;

        let newWanderAngle = p.wanderAngle;
        if (!p.isPlayer) {
            // Update wander angle with random jitter to make movement less predictable
            const jitter = GAMEPLAY_CONFIG.GENERAL_AI.WANDER_JITTER;
            newWanderAngle += (Math.random() - 0.5) * 2 * jitter * dt;
        }

        return { ...p, x, y, vx, vy, wanderAngle: newWanderAngle };
    });
    
    const { updatedParticles, updatedDustClouds } = accreteMassFromDust(particlesAfterForces, state.dustClouds, dt);

    return { ...state, particles: updatedParticles, dustClouds: updatedDustClouds };
};

const calculateAllForces = (state: SimulationState): Vector[] => {
    const forces: Vector[] = state.particles.map(() => ({ x: 0, y: 0 }));
    const { particles, width, height } = state;
    
    // --- AI Forces ---
    const { 
        DETECTION_RADIUS, 
        ENGAGEMENT_RADIUS, 
        FLEE_FORCE, 
        CHASE_FORCE, 
        WANDER_FORCE, 
        PATROL_FORCE, 
        SHRINKER_CHASE_MULTIPLIER,
    } = GAMEPLAY_CONFIG.GENERAL_AI;
    const engagementRadiusSq = ENGAGEMENT_RADIUS * ENGAGEMENT_RADIUS;

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (p1.isPlayer) continue;

        let nearestThreat: { p: ParticleState, distSq: number } | null = null;
        let nearestFood: { p: ParticleState, distSq: number } | null = null;

        const nearbyParticles = spatialGrid.query(p1.x, p1.y, DETECTION_RADIUS);

        for (const p2 of nearbyParticles) {
            if (p1.id === p2.id) continue;

            const wrappedDx = MathUtils.getWrappedDistance(p2.x - p1.x, width);
            const wrappedDy = MathUtils.getWrappedDistance(p2.y - p1.y, height);
            const distSq = wrappedDx * wrappedDx + wrappedDy * wrappedDy;
            
            if (p1.isShrinker) {
                if (!p2.isShrinker) { // Shrinkers hunt non-shrinkers
                    if (nearestFood === null || distSq < nearestFood.distSq) {
                        nearestFood = { p: p2, distSq };
                    }
                }
            } else {
                // Normal particles' logic
                if (p2.mass > p1.mass || p2.isShrinker) { // Threats
                    if (nearestThreat === null || distSq < nearestThreat.distSq) {
                        nearestThreat = { p: p2, distSq };
                    }
                } else if (p2.mass < p1.mass) { // Food
                    if (nearestFood === null || distSq < nearestFood.distSq) {
                        nearestFood = { p: p2, distSq };
                    }
                }
            }
        }

        let aiForceX = 0;
        let aiForceY = 0;
        let hasPrimaryAction = false;

        // Priority 1: Flee from immediate threats.
        if (nearestThreat && nearestThreat.distSq < engagementRadiusSq) {
            const target = nearestThreat;
            const targetDx = MathUtils.getWrappedDistance(target.p.x - p1.x, width);
            const targetDy = MathUtils.getWrappedDistance(target.p.y - p1.y, height);
            const dist = Math.sqrt(target.distSq);
            if (dist > 1) {
                // Apply a constant force away from the threat
                aiForceX -= FLEE_FORCE * (targetDx / dist);
                aiForceY -= FLEE_FORCE * (targetDy / dist);
            }
            hasPrimaryAction = true;
        } 
        // Priority 2: Chase any detected food.
        else if (nearestFood) {
            const target = nearestFood;
            let currentChaseForce = CHASE_FORCE;
            if (p1.isShrinker) {
                currentChaseForce *= SHRINKER_CHASE_MULTIPLIER;
            }
            // Aggressive chase within engagement radius
            if (target.distSq < engagementRadiusSq) {
                currentChaseForce *= 1.5;
            }

            const targetDx = MathUtils.getWrappedDistance(target.p.x - p1.x, width);
            const targetDy = MathUtils.getWrappedDistance(target.p.y - p1.y, height);
            const dist = Math.sqrt(target.distSq);
            if (dist > 1) {
                 // Apply a constant force towards the food, making AI relentless
                aiForceX += currentChaseForce * (targetDx / dist);
                aiForceY += currentChaseForce * (targetDy / dist);
            }
            hasPrimaryAction = true;
        }

        // Priority 3: Idle behavior (Patrol & Wander).
        if (!hasPrimaryAction) {
            // Patrol force to prevent getting stuck in corners
            const patrolDx = width / 2 - p1.x;
            const patrolDy = height / 2 - p1.y;
            const patrolDist = Math.hypot(patrolDx, patrolDy);
            if (patrolDist > width * 0.1) { 
                 aiForceX += (patrolDx / patrolDist) * PATROL_FORCE;
                 aiForceY += (patrolDy / patrolDist) * PATROL_FORCE;
            }

            // Wander force using the particle's own angle, preventing synchronized movement.
            const wanderAngle = p1.wanderAngle;
            aiForceX += WANDER_FORCE * Math.cos(wanderAngle);
            aiForceY += WANDER_FORCE * Math.sin(wanderAngle);
        }
        
        forces[i].x += aiForceX;
        forces[i].y += aiForceY;
    }

    return forces;
};


// --- PARTICLE & EFFECT UPDATES ---
export const updateParticleState = (p: ParticleState, width: number, height: number): ParticleState => {
    let newParticleData: Partial<ParticleState> = {};
    let newTrail = [...p.trail];

    const didWrap = newTrail.length > 0 && Math.hypot(p.x - newTrail[newTrail.length - 1].x, p.y - newTrail[newTrail.length - 1].y) > width * 0.5;
    
    if (didWrap) {
        newTrail = [];
    } else {
        const {EDGE_THRESHOLD} = PHYSICS_CONFIG.TRAILS;
        if (p.x > EDGE_THRESHOLD && p.x < width - EDGE_THRESHOLD && p.y > EDGE_THRESHOLD && p.y < height - EDGE_THRESHOLD) {
             newTrail = [...newTrail, { x: p.x, y: p.y }];
        }
    }
    
    if (newTrail.length > PHYSICS_CONFIG.TRAILS.MAX_LENGTH) {
        newTrail = newTrail.slice(1);
    }
    newParticleData.trail = newTrail;
    
    if (p.isTransitioningToBlackHole && p.blackHoleState && Date.now() >= p.blackHoleState.collapseStartTime) {
        newParticleData.isBlackHole = true;
        newParticleData.isTransitioningToBlackHole = false;
        newParticleData.radius = p.blackHoleState.originalStarRadius * PHYSICS_CONFIG.BLACK_HOLE.RADIUS_RATIO;
    }
    
    return { ...p, ...newParticleData };
};

const accreteMassFromDust = (particles: ParticleState[], dustClouds: DustCloudState[], dt: number) => {
    if (dustClouds.length === 0) {
        return { updatedParticles: particles, updatedDustClouds: dustClouds };
    }
    
    const massGains: Map<string, number> = new Map();
    const newDustClouds = dustClouds.map(cloud => {
        let newCloud = { ...cloud };
        for (const particle of particles) {
            const dist = Math.hypot(particle.x - newCloud.x, particle.y - newCloud.y);
            if (dist < newCloud.radius) {
                const massToTransfer = Math.min(
                    newCloud.mass,
                    PHYSICS_CONFIG.DUST_CLOUD.ACCRETION_RATE * particle.mass * dt
                );
                if (massToTransfer > 0) {
                    newCloud.mass -= massToTransfer;
                    massGains.set(particle.id, (massGains.get(particle.id) || 0) + massToTransfer);
                }
            }
        }
        return newCloud;
    });

    const updatedParticles = particles.map(p => {
        const gain = massGains.get(p.id);
        if (gain) {
            return updateParticleDerivedState({ ...p, mass: p.mass + gain });
        }
        return p;
    });
    
    return { updatedParticles, updatedDustClouds: newDustClouds.filter(c => c.mass > 0.1) };
};

const updateEffects = (state: SimulationState, dt: number): SimulationState => {
    const now = Date.now();
    const dustClouds = state.dustClouds.filter(c => now - c.creationTime < PHYSICS_CONFIG.DUST_CLOUD.LIFETIME && c.mass > 0.1);
    const explosions = state.explosions.filter(e => now - e.startTime < e.duration);
    let flashEffects = state.flashEffects.filter(f => now - f.startTime < f.duration);
    
    const absorptionEffects = state.absorptionEffects.map(p => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
    })).filter(p => now - p.creationTime < p.lifetime);

    const newFlashes = state.particles
        .filter(p => 
            p.isTransitioningToBlackHole && 
            p.blackHoleState && 
            !state.flashEffects.some(f => f.id === p.id) &&
            now > p.blackHoleState.collapseStartTime - PHYSICS_CONFIG.BLACK_HOLE.FLASH_DURATION
        )
        .map(p => ({
            id: p.id,
            x: p.x,
            y: p.y,
            startTime: now,
            duration: PHYSICS_CONFIG.BLACK_HOLE.FLASH_DURATION,
        }));

    if (newFlashes.length > 0) {
        flashEffects = [...flashEffects, ...newFlashes];
    }

    return { ...state, dustClouds, explosions, flashEffects, absorptionEffects };
};


// --- COLLISION HANDLING ---
interface CollisionResult {
    particles: ParticleState[];
    newExplosions: ExplosionState[];
    dustClouds: DustCloudState[];
    powerUps: PowerUpState[];
    gameOver: boolean;
    playerAbsorbedCount: number;
    newAbsorptionEffects: AbsorptionEffectParticle[];
    comboBroken: boolean;
}

const handleCollisions = (state: SimulationState): CollisionResult => {
    let particles = [...state.particles];
    let newExplosions: ExplosionState[] = [];
    let dustClouds: DustCloudState[] = [...state.dustClouds];
    let powerUps = [...state.powerUps];
    let gameOver = false;
    let playerAbsorbedCount = 0;
    let newAbsorptionEffects: AbsorptionEffectParticle[] = [];
    let comboBroken = false;

    // --- Player vs PowerUps ---
    const playerIndex = particles.findIndex(p => p.isPlayer);
    if (playerIndex !== -1) {
        const player = particles[playerIndex];
        const collectedPowerUpIds = new Set<string>();
        let playerUpdates: Partial<ParticleState> = {};

        powerUps.forEach(powerUp => {
            const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y);
            if (dist < player.radius + powerUp.radius) {
                if (powerUp.type === PowerUpType.Shield && !player.hasShield) {
                    playerUpdates.hasShield = true;
                }
                collectedPowerUpIds.add(powerUp.id);
            }
        });

        if (Object.keys(playerUpdates).length > 0) {
            particles[playerIndex] = { ...player, ...playerUpdates };
        }
        if (collectedPowerUpIds.size > 0) {
            powerUps = powerUps.filter(p => !collectedPowerUpIds.has(p.id));
        }
    }

    // --- Particle vs Particle Collisions ---
    let changedInLoop = true;
    while (changedInLoop) {
        changedInLoop = false;
        if (gameOver) break;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];

                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

                if (dist < p1.radius + p2.radius) {
                    // --- Collision detected ---
                    const [larger, smaller] = p1.mass > p2.mass ? [p1, p2] : [p2, p1];
                    const largerIndex = particles.indexOf(larger);
                    const smallerIndex = particles.indexOf(smaller);

                    if (smaller.isPlayer) { // Player is smaller, collision is bad
                        if (smaller.hasShield) {
                            // Shield saves player, destroys other particle
                            particles[smallerIndex] = { ...smaller, hasShield: false };
                            particles.splice(largerIndex, 1);
                            newExplosions.push({
                                id: crypto.randomUUID(), x: smaller.x, y: smaller.y, startTime: Date.now(),
                                duration: 800, intensity: larger.mass * 1.2, isShockwave: true, color: RENDER_CONFIG.COLORS.SHIELD_POWERUP
                            });
                        } else {
                            // Game Over
                            gameOver = true;
                            newExplosions.push({
                                id: crypto.randomUUID(), x: smaller.x, y: smaller.y, startTime: Date.now(),
                                duration: 1500, intensity: Math.min(smaller.mass, 100) + 20, isShockwave: true,
                            });
                            particles.splice(smallerIndex, 1);
                        }
                    } else { // Player is larger or it's AI vs AI
                        if (smaller.isShrinker) {
                            const newMass = Math.max(PHYSICS_CONFIG.MIN_MASS, larger.mass / 2);
                            const newLarger = updateParticleDerivedState({ ...larger, mass: newMass });
                            
                            particles[largerIndex] = newLarger;
                            particles.splice(smallerIndex, 1);

                            newExplosions.push({
                                id: crypto.randomUUID(), x: larger.x, y: larger.y, startTime: Date.now(),
                                duration: 800, intensity: larger.radius * 1.5, isShockwave: true, color: 'hsl(300, 80%, 60%)'
                            });

                            if (larger.isPlayer) {
                                comboBroken = true;
                            }
                        } else {
                            const massBonus = (larger.isPlayer && smaller.mass > 0) ? 1 + (playerAbsorbedCount * GAMEPLAY_CONFIG.COMBO.MASS_BONUS_FACTOR) : 1;
                            const absorbedMass = smaller.mass * massBonus;
                            const totalMass = larger.mass + absorbedMass;
                            
                            const newMass = larger.isPlayer ? (larger.mass + absorbedMass * 0.1) : totalMass;

                            const newLarger = updateParticleDerivedState({
                                ...larger,
                                mass: newMass,
                                vx: (larger.vx * larger.mass + smaller.vx * smaller.mass) / totalMass,
                                vy: (larger.vy * larger.mass + smaller.vy * smaller.mass) / totalMass,
                                x: larger.isPlayer ? larger.x : (larger.x * larger.mass + smaller.x * smaller.mass) / totalMass,
                                y: larger.isPlayer ? larger.y : (larger.y * larger.mass + smaller.y * smaller.mass) / totalMass,
                            });
                            
                            particles[largerIndex] = newLarger;
                            particles.splice(smallerIndex, 1);

                            if (larger.isPlayer) {
                                playerAbsorbedCount++;
                                // Create absorption effect
                                const particleCount = Math.min(20, Math.ceil(smaller.radius));
                                for (let k = 0; k < particleCount; k++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = MathUtils.randomInRange(50, 150) + Math.hypot(smaller.vx, smaller.vy);
                                    newAbsorptionEffects.push({
                                        id: crypto.randomUUID(),
                                        x: smaller.x + Math.cos(angle) * smaller.radius,
                                        y: smaller.y + Math.sin(angle) * smaller.radius,
                                        vx: larger.vx + Math.cos(angle) * speed,
                                        vy: larger.vy + Math.sin(angle) * speed,
                                        creationTime: Date.now(),
                                        lifetime: 500,
                                        radius: MathUtils.randomInRange(1, 2.5),
                                        color: smaller.baseColor,
                                    });
                                }
                            }
                        }

                        changedInLoop = true;
                        break;
                    }
                }
            }
            if (changedInLoop) break;
        }
    }

    return { particles, newExplosions, dustClouds, powerUps, gameOver, playerAbsorbedCount, newAbsorptionEffects, comboBroken };
};