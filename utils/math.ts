
import { Vector } from '../types';

export class MathUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  static randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  static randomIntInRange(min: number, max: number): number {
    return Math.floor(this.randomInRange(min, max + 1));
  }

  static vectorMagnitude(v: Vector): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  static getWrappedDistance(delta: number, dimension: number): number {
    const halfDimension = dimension * 0.5;
    if (Math.abs(delta) > halfDimension) {
      return delta > 0 ? delta - dimension : delta + dimension;
    }
    return delta;
  }
}

export class ColorUtils {
    static hslToString(h: number, s: number, l: number): string {
        return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
    }

    static hslaToString(h: number, s: number, l: number, a: number): string {
        return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
    }

    static generateRandomColor(): string {
        const hue = Math.random() * 360;
        const saturation = MathUtils.randomInRange(60, 90);
        const lightness = MathUtils.randomInRange(50, 80);
        return this.hslToString(hue, saturation, lightness);
    }

    static getTemperatureColor(temperature: number, maxTemp = 10000): string {
        const normalizedTemp = MathUtils.clamp(temperature / maxTemp, 0, 1);
        if (normalizedTemp < 0.25) {
            const hue = 240 - (normalizedTemp * 4) * 60; // Blue to Cyan
            return this.hslToString(hue, 80, 40);
        } else if (normalizedTemp < 0.5) {
            const hue = 180 - ((normalizedTemp - 0.25) * 4) * 120; // Cyan to Yellow
            return this.hslToString(hue, 90, 60);
        } else if (normalizedTemp < 0.75) {
            const hue = 60 - ((normalizedTemp - 0.5) * 4) * 30; // Yellow to Orange
            return this.hslToString(hue, 100, 70);
        } else {
            const lightness = 70 + ((normalizedTemp - 0.75) * 4) * 30; // Orange to White
            return this.hslToString(15, 100, lightness);
        }
    }
    
    static getContrastColor(hslColor: string): string {
        const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
            const lightness = parseInt(match[3], 10);
            return lightness > 60 ? 'black' : 'white';
        }
        return 'white';
    }
}
