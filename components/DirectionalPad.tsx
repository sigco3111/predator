
import React, { useState, useEffect, useCallback } from 'react';
import type { Vector } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DirectionalPadProps {
    onMove: (direction: Vector) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const DirectionalPad: React.FC<DirectionalPadProps> = ({ onMove }) => {
    const [pressed, setPressed] = useState<Record<Direction, boolean>>({
        up: false,
        down: false,
        left: false,
        right: false,
    });

    useEffect(() => {
        let x = 0;
        let y = 0;

        if (pressed.up) y -= 1;
        if (pressed.down) y += 1;
        if (pressed.left) x -= 1;
        if (pressed.right) x += 1;

        const magnitude = Math.hypot(x, y);
        if (magnitude > 0) {
            onMove({ x: x / magnitude, y: y / magnitude });
        } else {
            onMove({ x: 0, y: 0 });
        }
    }, [pressed, onMove]);

    const handlePress = useCallback((dir: Direction, isPressed: boolean) => {
        setPressed(p => ({ ...p, [dir]: isPressed }));
    }, []);

    const DPadButton: React.FC<{ direction: Direction, className?: string, children: React.ReactNode }> = ({ direction, className, children }) => {
        const handleInteractionStart = (e: React.TouchEvent | React.MouseEvent) => {
            e.preventDefault();
            handlePress(direction, true);
        };
        const handleInteractionEnd = (e: React.TouchEvent | React.MouseEvent) => {
            e.preventDefault();
            handlePress(direction, false);
        };

        return (
            <div
                className={`flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-md transition-colors ${pressed[direction] ? 'bg-white/30' : 'hover:bg-white/20'} ${className}`}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onContextMenu={(e) => e.preventDefault()}
            >
                {children}
            </div>
        );
    };

    return (
        <div className="fixed bottom-8 left-8 z-50 grid grid-cols-3 grid-rows-3 gap-1 w-48 h-48 select-none">
            <div className="col-start-2 row-start-1">
                <DPadButton direction="up">
                    <ArrowUp size={32} className="text-white/80" />
                </DPadButton>
            </div>
            <div className="col-start-1 row-start-2">
                <DPadButton direction="left">
                    <ArrowLeft size={32} className="text-white/80" />
                </DPadButton>
            </div>
            <div className="col-start-3 row-start-2">
                <DPadButton direction="right">
                    <ArrowRight size={32} className="text-white/80" />
                </DPadButton>
            </div>
            <div className="col-start-2 row-start-3">
                <DPadButton direction="down">
                    <ArrowDown size={32} className="text-white/80" />
                </DPadButton>
            </div>
        </div>
    );
};

export default DirectionalPad;
