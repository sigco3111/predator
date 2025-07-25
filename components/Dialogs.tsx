
import React, { useState, useEffect } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md text-white"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">{props.label}</label>
        <input 
            {...props}
            className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className}`}
        />
    </div>
);

const DialogButtons: React.FC<{ onCancel: () => void; onConfirm: () => void; confirmText?: string }> = ({ onCancel, onConfirm, confirmText = "확인" }) => (
    <div className="flex justify-end gap-4 mt-6">
        <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">취소</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition-colors font-semibold">{confirmText}</button>
    </div>
);


interface AddMassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { mass: number, radius: number, vx: number, vy: number }) => void;
}

export const AddMassDialog: React.FC<AddMassDialogProps> = ({ isOpen, onClose, onConfirm }) => {
    const [mass, setMass] = useState('10');
    const [radius, setRadius] = useState('15');
    const [speed, setSpeed] = useState('10');
    const [direction, setDirection] = useState('0');

    const handleConfirm = () => {
        const massVal = parseFloat(mass);
        const radiusVal = parseFloat(radius);
        const speedVal = parseFloat(speed);
        const dirVal = parseFloat(direction);

        if (isNaN(massVal) || isNaN(radiusVal) || isNaN(speedVal) || isNaN(dirVal)) {
            alert("모든 필드에 유효한 숫자를 입력하세요.");
            return;
        }

        const directionRadians = (dirVal * Math.PI) / 180;
        const vx = speedVal * Math.cos(directionRadians);
        const vy = speedVal * Math.sin(directionRadians);

        onConfirm({ mass: massVal, radius: radiusVal, vx, vy });
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="새 물체 추가">
            <InputField label="질량 (1-50)" type="number" value={mass} onChange={e => setMass(e.target.value)} min="1" max="50" />
            <InputField label="크기 (반지름, 1-150)" type="number" value={radius} onChange={e => setRadius(e.target.value)} min="1" max="150" />
            <InputField label="초기 속도" type="number" value={speed} onChange={e => setSpeed(e.target.value)} />
            <InputField label="초기 방향 (각도)" type="number" value={direction} onChange={e => setDirection(e.target.value)} />
            <DialogButtons onCancel={onClose} onConfirm={handleConfirm} />
        </Dialog>
    );
};

interface AddRandomMassesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (count: number) => void;
}

export const AddRandomMassesDialog: React.FC<AddRandomMassesDialogProps> = ({ isOpen, onClose, onConfirm }) => {
    const [count, setCount] = useState('10');

    const handleConfirm = () => {
        const countVal = parseInt(count, 10);
        if (isNaN(countVal) || countVal < 1 || countVal > 100) {
            alert("1에서 100 사이의 숫자를 입력하세요.");
            return;
        }
        onConfirm(countVal);
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="무작위 물체 추가">
            <InputField label="물체 수 (1-100)" type="number" value={count} onChange={e => setCount(e.target.value)} min="1" max="100" />
            <DialogButtons onCancel={onClose} onConfirm={handleConfirm} />
        </Dialog>
    );
};
