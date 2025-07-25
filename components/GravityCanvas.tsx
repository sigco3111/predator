
import React, { useRef, useEffect } from 'react';
import type { SimulationState, ParticleState, DustCloudState, ExplosionState, FlashEffectState, SimulationSettings, NebulaState, PowerUpState, ThrusterParticle, AbsorptionEffectParticle } from '../types';
import { RENDER_CONFIG, PHYSICS_CONFIG, GAMEPLAY_CONFIG } from '../constants';
import { ColorUtils } from '../utils/math';
import { PowerUpType } from '../types';

interface GravityCanvasProps {
  simulationState: SimulationState;
  settings: SimulationSettings;
  onClick: (x: number, y: number) => void;
  playerParticle: ParticleState | null;
}

interface Star { x: number; y: number; radius: number; opacity: number; layer: number; }

const GravityCanvas: React.FC<GravityCanvasProps> = ({ simulationState, settings, onClick, playerParticle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundStarsRef = useRef<Star[]>([]);
  const { particles, dustClouds, explosions, flashEffects, nebulas, powerUps, thrusterParticles, absorptionEffects, width, height } = simulationState;

  // Initialize background stars
  useEffect(() => {
    if (backgroundStarsRef.current.length === 0 || width !== backgroundStarsRef.current[0]?.x * -1) { // Re-init on resize
        const stars: Star[] = [];
        const starCount = Math.floor((width * height) / 8000); // Dynamic star count
        for (let i = 0; i < starCount; i++) {
            const layer = Math.random();
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.2,
                opacity: Math.random() * 0.5 + 0.1,
                layer: layer < 0.6 ? 1 : (layer < 0.9 ? 2 : 3)
            });
        }
        backgroundStarsRef.current = stars;
    }
  }, [width, height]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- DRAWING FUNCTIONS ---

    const drawBackground = () => {
        ctx.fillStyle = RENDER_CONFIG.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        const playerVelX = playerParticle?.vx ?? 0;
        const playerVelY = playerParticle?.vy ?? 0;

        backgroundStarsRef.current.forEach(star => {
            const parallaxX = (playerVelX / 100) * star.layer;
            const parallaxY = (playerVelY / 100) * star.layer;
            star.x -= parallaxX;
            star.y -= parallaxY;
            
            if(star.x < 0) star.x += width;
            if(star.x > width) star.x -= width;
            if(star.y < 0) star.y += height;
            if(star.y > height) star.y -= height;
            
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
        });
        ctx.restore();
    };
    
    const drawNebula = (nebula: NebulaState) => {
         const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
         const baseColor = nebula.color.replace('hsla(', '').replace(')', '').split(',');
         gradient.addColorStop(0, `hsla(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${parseFloat(baseColor[3]) * 0.5})`);
         gradient.addColorStop(1, `hsla(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0)`);
         ctx.fillStyle = gradient;
         ctx.beginPath();
         ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
         ctx.fill();
    };
    
    const drawPowerUp = (powerUp: PowerUpState) => {
        const now = Date.now();
        const age = now - powerUp.creationTime;
        const lifetime = GAMEPLAY_CONFIG.POWERUP.LIFETIME;
        const pulse = Math.sin(now / 200) * 0.15 + 0.85;
        const alpha = age > lifetime - 2000 ? Math.max(0, 1 - (age - (lifetime - 2000)) / 2000) : 1.0;

        ctx.save();
        ctx.globalAlpha = alpha;

        const color = RENDER_CONFIG.COLORS.SHIELD_POWERUP;
        const glowColor = color.replace('hsl', 'hsla').replace(')', ', 0.3)');
        
        const glowRadius = powerUp.radius * 2.0 * pulse;
        const glowGradient = ctx.createRadialGradient(powerUp.x, powerUp.y, 0, powerUp.x, powerUp.y, glowRadius);
        glowGradient.addColorStop(0.3, glowColor);
        glowGradient.addColorStop(1, color.replace('hsl', 'hsla').replace(')', ', 0)'));
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawThrusterParticle = (p: ThrusterParticle) => {
        const age = Date.now() - p.creationTime;
        const progress = age / p.lifetime;
        if (progress >= 1) return;
        
        const alpha = (1 - progress) * 0.9;
        ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
    };
    
    const drawAbsorptionEffect = (p: AbsorptionEffectParticle) => {
        const age = Date.now() - p.creationTime;
        const progress = age / p.lifetime;
        if (progress >= 1) return;
        
        const alpha = (1 - progress) * 0.8;
        ctx.fillStyle = ColorUtils.hslaToString(
            parseInt(p.color.match(/(\d+)/)?.[0] || '200'), 80, 70, alpha
        );
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1-progress), 0, Math.PI * 2);
        ctx.fill();
    };

    const drawTrail = (p: ParticleState) => {
        if (p.trail.length < 2) return;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < p.trail.length; i++) {
            const currentPoint = p.trail[i];
            const prevPoint = p.trail[i-1];
            const alpha = (i / p.trail.length) * PHYSICS_CONFIG.TRAILS.ALPHA_MAX * 0.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = p.radius / 8 + 0.5;
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
        }
    };

    const drawParticle = (p: ParticleState) => {
        ctx.save();
        
        let particleColor = p.baseColor;
        if (p.isShrinker) {
            particleColor = 'hsl(300, 80%, 70%)'; // Magenta for shrinkers
        } else if (playerParticle && !p.isPlayer) {
            if (p.mass < playerParticle.mass) {
                particleColor = 'hsl(190, 80%, 70%)'; // Edible
            } else {
                particleColor = 'hsl(0, 90%, 60%)'; // Threat
            }
        } else if (p.isPlayer) {
            particleColor = 'hsl(120, 80%, 70%)'; // Player
        }
        
        ctx.fillStyle = particleColor;
        
        if (p.isShrinker) {
            const radius = p.radius;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - radius); // Top
            ctx.lineTo(p.x + radius, p.y); // Right
            ctx.lineTo(p.x, p.y + radius); // Bottom
            ctx.lineTo(p.x - radius, p.y); // Left
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (p.isPlayer && p.hasShield) {
            drawShield(p);
        }
        
        ctx.restore();
    };
    
    const drawShield = (p: ParticleState) => {
        const shieldRadius = p.radius + 6;
        const gradient = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, shieldRadius);
        gradient.addColorStop(0, 'hsla(180, 100%, 80%, 0)');
        gradient.addColorStop(0.8, 'hsla(180, 100%, 80%, 0.3)');
        gradient.addColorStop(1, 'hsla(180, 100%, 90%, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, shieldRadius, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawExplosion = (exp: ExplosionState) => {
        const elapsed = Date.now() - exp.startTime;
        const progress = elapsed / exp.duration;
        if (progress >= 1) return;
        
        const radius = exp.intensity * (exp.isShockwave ? Math.pow(progress, 0.5) * 3 : (1 + progress * 2));
        const alpha = 1 - progress;
        
        const baseColor = exp.color ?? RENDER_CONFIG.COLORS.EXPLOSION_COLOR;

        const withAlpha = (color: string, newAlpha: number): string => {
            const clampedAlpha = Math.max(0, Math.min(1, newAlpha));
            if (color.startsWith('rgba')) {
                return color.replace(/, ?\d*\.?\d+\)$/, `, ${clampedAlpha})`);
            }
            if (color.startsWith('rgb')) {
                return color.replace('rgb', 'rgba').replace(')', `, ${clampedAlpha})`);
            }
            if (color.startsWith('hsla')) {
                return color.replace(/, ?\d*\.?\d+\)$/, `, ${clampedAlpha})`);
            }
            if (color.startsWith('hsl')) {
                return color.replace('hsl', 'hsla').replace(')', `, ${clampedAlpha})`);
            }
            return color;
        };
        
        ctx.strokeStyle = withAlpha(baseColor, alpha * 0.9);
        ctx.lineWidth = 3 + (exp.intensity / 50);
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        if (exp.isShockwave) {
             const innerRadius = radius * 0.8;
             const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, innerRadius);
             gradient.addColorStop(0, withAlpha(baseColor, alpha * 0.5));
             gradient.addColorStop(1, withAlpha(baseColor, 0));
             ctx.fillStyle = gradient;
             ctx.beginPath();
             ctx.arc(exp.x, exp.y, innerRadius, 0, Math.PI * 2);
             ctx.fill();
        }
    };

    const drawFlash = (flash: FlashEffectState) => {
        const elapsed = Date.now() - flash.startTime;
        const progress = elapsed / flash.duration;
        if (progress >= 1) return;
        const alpha = Math.sin(progress * Math.PI); // fade in and out
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.fillRect(0, 0, width, height);
    }

    // --- RENDER ORDER ---
    ctx.clearRect(0, 0, width, height);
    
    drawBackground();
    nebulas.forEach(drawNebula);
    thrusterParticles.forEach(drawThrusterParticle);
    absorptionEffects.forEach(drawAbsorptionEffect);
    powerUps.forEach(drawPowerUp);
    
    if (settings.showTrails) {
        particles.forEach(drawTrail);
    }
    particles.forEach(drawParticle);

    explosions.forEach(drawExplosion);
    flashEffects.forEach(drawFlash);

  }, [simulationState, settings, playerParticle, width, height]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      onClick(event.clientX - rect.left, event.clientY - rect.top);
    }
  };

  return <canvas ref={canvasRef} width={width} height={height} className="absolute top-0 left-0 w-full h-full" onClick={handleCanvasClick} />;
};

export default GravityCanvas;
