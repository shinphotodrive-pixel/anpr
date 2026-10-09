import React from 'react';
import { PlateInfo, PlateType } from '../types/traffic';

interface Props {
  plate: PlateInfo;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LicensePlateBadge: React.FC<Props> = ({ plate, size = 'md', className = '' }) => {
  const { number, type } = plate;

  // Size specific classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 border',
    md: 'text-sm px-3 py-1 border-[1.5px]',
    lg: 'text-lg px-4 py-1.5 border-2 tracking-wider'
  }[size];

  // Korean Plate styling by type
  if (type === 'ev') {
    // Electric Vehicle: Blue reflective plate with EV emblem on left
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold font-mono rounded bg-gradient-to-r from-sky-200 via-sky-100 to-sky-200 text-sky-950 border-sky-400 shadow-xs select-none ${sizeClasses} ${className}`}
        style={{ letterSpacing: '0.08em' }}
      >
        <span className="text-[10px] text-sky-700 bg-sky-300/60 px-1 py-0.2 rounded font-sans font-bold">
          EV
        </span>
        <span>{number}</span>
      </div>
    );
  }

  if (type === 'commercial') {
    // Commercial: Yellow / Warm Amber plate
    return (
      <div
        className={`inline-flex items-center gap-1 font-bold font-mono rounded bg-amber-300 text-neutral-900 border-amber-600 shadow-xs select-none ${sizeClasses} ${className}`}
        style={{ letterSpacing: '0.06em' }}
      >
        <span>{number}</span>
      </div>
    );
  }

  if (type === 'emergency') {
    // Emergency vehicle: Distinct clean plate with subtle official red edge indicator
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold font-mono rounded bg-white text-neutral-950 border-neutral-800 shadow-xs select-none ${sizeClasses} ${className}`}
        style={{ letterSpacing: '0.08em' }}
      >
        <span className="w-1.5 h-3 bg-red-600 rounded-xs"></span>
        <span>{number}</span>
      </div>
    );
  }

  // Standard Korean License Plate: Clean white background with black border
  return (
    <div
      className={`inline-flex items-center gap-1 font-bold font-mono rounded bg-white text-neutral-900 border-neutral-800 shadow-xs select-none ${sizeClasses} ${className}`}
      style={{ letterSpacing: '0.08em' }}
    >
      <span>{number}</span>
    </div>
  );
};
