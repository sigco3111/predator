
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
  tooltip?: string;
}

const baseClasses = "relative group flex items-center justify-center h-9 px-3 rounded-md border text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500";
const activeClasses = "bg-blue-500/20 border-blue-500 text-white";
const inactiveClasses = "bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30";

export const UIMainButton: React.FC<ButtonProps> = ({ children, onClick, className, tooltip, ...props }) => {
    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${inactiveClasses} gap-2 ${className}`}
            {...props}
        >
            {children}
            {tooltip && <Tooltip>{tooltip}</Tooltip>}
        </button>
    );
};

export const UIIconButton: React.FC<ButtonProps> = ({ children, active, onClick, className, tooltip, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} w-9 ${active ? activeClasses : inactiveClasses} ${className}`}
      {...props}
    >
      {children}
      {tooltip && <Tooltip>{tooltip}</Tooltip>}
    </button>
  );
};

const Tooltip: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black border border-white/20 text-white/90 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {children}
    </span>
);
