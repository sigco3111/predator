
import React, { useState, useRef } from 'react';
import type { Vector } from '../types';

interface VirtualJoystickProps {
    onMove: (direction: Vector) => void;
}

const JOYSTICK_SIZE = 120;
const STICK_SIZE = 60;
const MAX_OFFSET = (JOYSTICK_SIZE - STICK_SIZE) / 2;

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
    const baseRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [stickPosition, setStickPosition] = useState<Vector>({ x: 0, y: 0 });
    const activeTouchId = useRef<number | null>(null);

    const moveStick = (touch: React.Touch) => {
        const base = baseRef.current;
        if (!base) return;

        const { left, top, width, height } = base.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const distance = Math.hypot(dx, dy);

        let finalX = dx;
        let finalY = dy;
        let inputX = dx / MAX_OFFSET;
        let inputY = dy / MAX_OFFSET;

        if (distance > MAX_OFFSET) {
            finalX = (dx / distance) * MAX_OFFSET;
            finalY = (dy / distance) * MAX_OFFSET;
            inputX = dx / distance;
            inputY = dy / distance;
        }

        setStickPosition({ x: finalX, y: finalY });
        const clampedX = Math.max(-1, Math.min(1, inputX));
        const clampedY = Math.max(-1, Math.min(1, inputY));
        onMove({ x: clampedX, y: clampedY });
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (activeTouchId.current === null) {
            const touch = e.changedTouches[0];
            if (touch) {
                activeTouchId.current = touch.identifier;
                setIsDragging(true);
                moveStick(touch);
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        e.preventDefault(); 
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === activeTouchId.current) {
                moveStick(touch);
                break;
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === activeTouchId.current) {
                activeTouchId.current = null;
                setIsDragging(false);
                setStickPosition({ x: 0, y: 0 });
                onMove({ x: 0, y: 0 });
                break;
            }
        }
    };
    
    return (
        <div 
            className="fixed bottom-8 left-8 z-50 select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <div 
                ref={baseRef}
                className="relative rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20"
                style={{ width: JOYSTICK_SIZE, height: JOYSTICK_SIZE }}
            >
                <div 
                    className="absolute rounded-full bg-white/30 border-2 border-white/40"
                    style={{
                        width: STICK_SIZE,
                        height: STICK_SIZE,
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${stickPosition.x}px, ${stickPosition.y}px)`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                />
            </div>
        </div>
    );
};

export default VirtualJoystick;