
import React from 'react';
import type { SimulationSettings } from '../types';
import { UIIconButton, UIMainButton } from './Buttons';
import { RefreshCw, Zap, Thermometer, Sigma, Milestone, Plus, Bot, SlidersHorizontal } from 'lucide-react';

interface SimulationUIProps {
  settings: SimulationSettings;
  onSettingsChange: (newSettings: Partial<SimulationSettings>) => void;
  objectCount: number;
  simulationSpeed: number;
  targetSimulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  onRestart: () => void;
  onAddMass: () => void;
  onAddRandomMasses: () => void;
}

const SimulationUI: React.FC<SimulationUIProps> = ({
  settings,
  onSettingsChange,
  objectCount,
  simulationSpeed,
  targetSimulationSpeed,
  onSpeedChange,
  onRestart,
  onAddMass,
  onAddRandomMasses
}) => {
  return (
    <div className="flex flex-col gap-3 pointer-events-auto">
      <div className="flex items-center gap-2 flex-wrap bg-black/30 backdrop-blur-sm p-2 rounded-lg border border-white/10">
        <UIMainButton onClick={onRestart} tooltip="시뮬레이션 재시작 (R)">
            <RefreshCw size={16} />
        </UIMainButton>
        <div className="w-px h-6 bg-white/20"></div>
        <UIMainButton onClick={onAddMass} tooltip="사용자 지정 물체 추가">
            <Plus size={16} /> 질량
        </UIMainButton>
        <UIMainButton onClick={onAddRandomMasses} tooltip="무작위 물체 추가">
            <Bot size={16} /> 무작위
        </UIMainButton>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap bg-black/30 backdrop-blur-sm p-2 rounded-lg border border-white/10">
        <UIIconButton 
            active={settings.showWarp} 
            onClick={() => onSettingsChange({ showWarp: !settings.showWarp })}
            tooltip="공간 왜곡 보기 전환">
            <Zap size={16} />
        </UIIconButton>
        <UIIconButton
            active={settings.showTemperature}
            onClick={() => onSettingsChange({ showTemperature: !settings.showTemperature })}
            tooltip="온도 보기 전환">
            <Thermometer size={16} />
        </UIIconButton>
         <UIIconButton
            active={settings.showTrails}
            onClick={() => onSettingsChange({ showTrails: !settings.showTrails })}
            tooltip="궤적 보기 전환">
            <Milestone size={16} />
        </UIIconButton>
        <UIIconButton
            active={settings.showMass}
            onClick={() => onSettingsChange({ showMass: !settings.showMass })}
            tooltip="질량 표시 전환">
            <Sigma size={16} />
        </UIIconButton>
      </div>

      <div className="flex flex-col gap-2 bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 text-sm text-white/80">
            <SlidersHorizontal size={14} />
            <label htmlFor="simulationSpeed">시뮬레이션 속도</label>
        </div>
        <div className="flex items-center gap-2">
            <input
                type="range"
                id="simulationSpeed"
                min="0.1"
                max="5"
                step="0.1"
                value={targetSimulationSpeed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="w-32 accent-blue-500"
            />
            <span className={`text-sm font-mono w-16 text-right ${Math.abs(simulationSpeed - targetSimulationSpeed) > 0.05 ? 'text-yellow-400' : 'text-white/70'}`}>
                {simulationSpeed.toFixed(1)}x
            </span>
        </div>
      </div>

       <div className="text-sm text-white/70 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
        물체 수: <span className="font-semibold text-white">{objectCount}</span>
      </div>
    </div>
  );
};

export default SimulationUI;
