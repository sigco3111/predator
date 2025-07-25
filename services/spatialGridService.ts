import type { ParticleState } from '../types';

const GRID_CELL_SIZE = 350; // AI 탐지 반경과 일치시켜 AI 탐색에 최적화
let grid: Map<string, ParticleState[]>;
let worldWidth: number;
let worldHeight: number;

const getKey = (x: number, y: number): string => {
    return `${Math.floor(x / GRID_CELL_SIZE)},${Math.floor(y / GRID_CELL_SIZE)}`;
};

export const spatialGrid = {
    /**
     * 새 프레임을 위해 공간 그리드를 구축합니다. 프레임당 한 번 호출해야 합니다.
     * @param particles - 모든 파티클의 배열
     */
    build: (particles: ParticleState[], width: number, height: number): void => {
        grid = new Map<string, ParticleState[]>();
        worldWidth = width;
        worldHeight = height;
        for (const p of particles) {
            const key = getKey(p.x, p.y);
            if (!grid.has(key)) {
                grid.set(key, []);
            }
            grid.get(key)!.push(p);
        }
    },
    
    /**
     * 한 지점 주변의 특정 반경 내에 있는 파티클들을 그리드에서 쿼리합니다.
     * @param x - 쿼리할 중심의 x 좌표
     * @param y - 쿼리할 중심의 y 좌표
     * @param radius - 쿼리할 반경
     * @returns 근처 파티클들의 배열
     */
    query(x: number, y: number, radius: number): ParticleState[] {
        if (!grid) return [];
        
        const results: ParticleState[] = [];
        const checkedCells = new Set<string>();

        const minCol = Math.floor((x - radius) / GRID_CELL_SIZE);
        const maxCol = Math.floor((x + radius) / GRID_CELL_SIZE);
        const minRow = Math.floor((y - radius) / GRID_CELL_SIZE);
        const maxRow = Math.floor((y + radius) / GRID_CELL_SIZE);

        for (let col = minCol; col <= maxCol; col++) {
            for (let row = minRow; row <= maxRow; row++) {
                const key = `${col},${row}`;
                if(checkedCells.has(key)) continue;

                if (grid.has(key)) {
                    results.push(...grid.get(key)!);
                }
                checkedCells.add(key);
            }
        }
        return results;
    },
};