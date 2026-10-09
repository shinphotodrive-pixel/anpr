import React, { useRef, useEffect } from 'react';
import { VehicleInstance, WeatherType, RoadZone } from '../types/traffic';
import { Camera, Zap } from 'lucide-react';

interface Props {
  vehicles: VehicleInstance[];
  roadZone: RoadZone;
  weather: WeatherType;
  isFlashing: boolean;
  onCarClick?: (vehicle: VehicleInstance) => void;
}

export const RoadCanvas: React.FC<Props> = ({
  vehicles,
  roadZone,
  weather,
  isFlashing,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Weather style adjustments
  const isNight = weather === 'night';
  const isRain = weather === 'rain';

  // Asphalt background
  const asphaltBg = roadZone.isSchoolZone
    ? isNight
      ? 'bg-[#4a1c1d]'
      : 'bg-[#8c3538]'
    : isNight
    ? 'bg-[#181d24]'
    : 'bg-[#2b333e]';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-80 ${asphaltBg} rounded-xl overflow-hidden select-none border border-slate-700/50 shadow-inner transition-colors duration-500`}
    >
      {/* Rain animation overlay */}
      {isRain && (
        <div className="absolute inset-0 pointer-events-none z-10 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-300/10 via-transparent to-transparent">
          <div className="w-full h-full animate-pulse opacity-60 bg-[repeating-linear-gradient(105deg,transparent,transparent_20px,rgba(255,255,255,0.15)_20px,rgba(255,255,255,0.15)_21px)]" />
        </div>
      )}

      {/* Night ambient vignette */}
      {isNight && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-radial-[circle_at_75%_30%] from-blue-900/10 via-black/40 to-black/75" />
      )}

      {/* Road Markings: Pavement Speed Limit Painting */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-16 pointer-events-none opacity-30">
        <div className="w-14 h-14 rounded-full border-4 border-red-500/80 flex items-center justify-center font-bold text-white text-lg">
          {roadZone.speedLimit}
        </div>
        <div className="w-14 h-14 rounded-full border-4 border-red-500/80 flex items-center justify-center font-bold text-white text-lg">
          {roadZone.speedLimit}
        </div>
      </div>

      {/* School Zone Decal text if School Zone */}
      {roadZone.isSchoolZone && (
        <div className="absolute left-16 top-3 text-yellow-300/60 font-bold text-xs tracking-widest pointer-events-none flex items-center gap-2">
          <span>어린이보호구역</span>
          <span>·</span>
          <span>속도제한 {roadZone.speedLimit}km/h</span>
        </div>
      )}

      {/* Top Lane Boundary (Solid Yellow / White) */}
      <div className="absolute top-4 left-0 right-0 h-1 bg-yellow-400/80" />

      {/* Lane 1 (1차로 - 추월차로) and Lane 2 (2차로 - 주행차로) Divider (Dashed White Line) */}
      <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 flex items-center">
        <div className="w-full h-1 bg-[repeating-linear-gradient(90deg,#ffffff,#ffffff_32px,transparent_32px,transparent_64px)] opacity-80" />
      </div>

      {/* Bottom Lane Boundary (Solid White) */}
      <div className="absolute bottom-4 left-0 right-0 h-1 bg-slate-200/80" />

      {/* Loop Sensor inductive cut lines in asphalt (at X=72%) */}
      <div className="absolute right-[28%] top-5 bottom-5 w-12 border-x-2 border-dashed border-cyan-400/30 flex flex-col justify-around py-4 pointer-events-none">
        <div className="h-24 w-full border border-cyan-400/25 bg-cyan-400/5 rounded-xs" />
        <div className="h-24 w-full border border-cyan-400/25 bg-cyan-400/5 rounded-xs" />
      </div>

      {/* Overhead Gantry Structure (단속 카메라 갠트리 지지대) */}
      <div className="absolute right-[25%] top-0 bottom-0 w-8 pointer-events-none z-20 flex flex-col justify-between">
        {/* Overhead Truss bar */}
        <div className="absolute top-0 bottom-0 left-3 w-2.5 bg-slate-700 border-x border-slate-600 shadow-md">
          {/* Rivets / metal pattern */}
          <div className="w-full h-full opacity-20 bg-[repeating-linear-gradient(0deg,#fff,#fff_4px,transparent_4px,transparent_16px)]" />
        </div>

        {/* Lane 1 Camera Module */}
        <div className="absolute top-14 -left-3 bg-slate-900 border border-slate-600 rounded px-1.5 py-1 text-slate-200 shadow-lg flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-slate-400">CAM-1</span>
        </div>

        {/* Lane 2 Camera Module */}
        <div className="absolute bottom-16 -left-3 bg-slate-900 border border-slate-600 rounded px-1.5 py-1 text-slate-200 shadow-lg flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-slate-400">CAM-2</span>
        </div>

        {/* Doppler Radar Sensor Pod */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 bg-slate-950 border border-cyan-500/50 rounded px-1.5 py-1 shadow-lg flex items-center gap-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-mono font-bold text-cyan-300">RADAR</span>
        </div>
      </div>

      {/* Radar scanning cone projection on road */}
      <div
        className="absolute right-[23%] top-5 bottom-5 w-24 pointer-events-none z-10 opacity-30"
        style={{
          background: 'linear-gradient(90deg, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0) 100%)',
          clipPath: 'polygon(0 15%, 100% 0, 100% 100%, 0 85%)',
        }}
      />

      {/* Camera Flash Overlay */}
      <div
        className={`absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-150 ${
          isFlashing ? 'opacity-85' : 'opacity-0'
        }`}
      />

      {/* Dynamic Moving Vehicles */}
      {vehicles.map((v) => {
        // Lane Y position: Lane 1: ~18% to 42%, Lane 2: ~58% to 82%
        const topPosition = v.lane === 1 ? '22%' : '62%';
        const isSpeeding = v.speed > roadZone.speedLimit;

        return (
          <div
            key={v.id}
            className="absolute -translate-y-1/2 transition-all ease-linear z-15 pointer-events-auto cursor-pointer"
            style={{
              left: `${v.xPosition}%`,
              top: topPosition,
              transitionDuration: '50ms',
            }}
          >
            {/* Speed Badge above car */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap tabular-nums z-20"
              style={{
                backgroundColor: v.isEmergency
                  ? '#dc2626'
                  : isSpeeding
                  ? '#ef4444'
                  : '#0f172a',
                color: '#ffffff',
              }}
            >
              <span>{Math.round(v.speed)}</span>
              <span className="text-[9px] font-normal opacity-80">km/h</span>
            </div>

            {/* Night Headlight Cone */}
            {isNight && (
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 w-48 h-28 pointer-events-none opacity-45"
                style={{
                  background: 'radial-gradient(ellipse at left, rgba(254,240,138,0.7) 0%, rgba(254,240,138,0.15) 60%, transparent 80%)',
                  clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)',
                }}
              />
            )}

            {/* Vehicle Body Visuals */}
            <VehicleGraphic vehicle={v} />
          </div>
        );
      })}

      {/* Road Telemetry Legend / Status strip in top-right */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-3 text-xs bg-slate-900/80 backdrop-blur-xs text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
        <span className="text-slate-400">제한속도:</span>
        <span className="font-bold font-mono tabular-nums text-white">{roadZone.speedLimit} km/h</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">단속 구역:</span>
        <span className="text-cyan-400 font-medium">{roadZone.name}</span>
      </div>
    </div>
  );
};

// Sub-component: Realistic vehicle silhouette graphic
const VehicleGraphic: React.FC<{ vehicle: VehicleInstance }> = ({ vehicle }) => {
  const { type, color, isEmergency, plate } = vehicle;

  if (type === 'bus') {
    return (
      <div className="relative w-36 h-16 rounded-md bg-amber-500 border border-amber-600 shadow-md flex items-center overflow-hidden">
        {/* Windows */}
        <div className="absolute top-1 left-3 right-6 h-5 bg-sky-950/80 rounded-xs flex gap-1 p-0.5">
          <div className="flex-1 bg-sky-200/40 rounded-xs" />
          <div className="flex-1 bg-sky-200/40 rounded-xs" />
          <div className="flex-1 bg-sky-200/40 rounded-xs" />
          <div className="w-4 bg-sky-300/60 rounded-xs" />
        </div>
        {/* Wheels */}
        <div className="absolute -bottom-1 left-6 w-5 h-2.5 bg-neutral-900 rounded-b-xs" />
        <div className="absolute -bottom-1 right-8 w-5 h-2.5 bg-neutral-900 rounded-b-xs" />
        {/* Headlights */}
        <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-yellow-300 rounded-l-xs shadow-xs" />
        {/* Mini Rear Plate */}
        <div className="absolute left-1 bottom-2 bg-amber-300 text-neutral-900 text-[7px] font-mono font-bold px-1 rounded-xs border border-amber-600">
          {plate.number.slice(-4)}
        </div>
      </div>
    );
  }

  if (type === 'truck') {
    return (
      <div className="relative w-32 h-14 flex items-center">
        {/* Cargo Box */}
        <div className="w-20 h-13 bg-slate-300 border border-slate-400 rounded-l-xs flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-xs">
          LOGIS
        </div>
        {/* Cabin */}
        <div
          className="w-12 h-12 rounded-r-md border shadow-xs relative"
          style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.2)' }}
        >
          {/* Windshield */}
          <div className="absolute top-1 right-1 w-6 h-4 bg-sky-950/70 rounded-xs" />
          {/* Headlights */}
          <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-yellow-200 rounded-l-xs" />
        </div>
        {/* Wheels */}
        <div className="absolute -bottom-0.5 left-4 w-4 h-2 bg-neutral-900 rounded-b-xs" />
        <div className="absolute -bottom-0.5 right-4 w-4 h-2 bg-neutral-900 rounded-b-xs" />
      </div>
    );
  }

  if (isEmergency) {
    // 119 Ambulance or Patrol
    return (
      <div className="relative w-28 h-12 bg-white rounded-md border border-red-500 shadow-md flex items-center">
        {/* Flashing Beacon */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
          <div className="w-3 h-2 bg-red-600 rounded-xs animate-ping" />
          <div className="w-3 h-2 bg-blue-600 rounded-xs animate-pulse" />
        </div>
        {/* Stripe */}
        <div className="absolute left-0 right-0 h-2 bg-red-600 flex items-center justify-center text-[8px] font-bold text-white">
          119 긴급
        </div>
        {/* Windshield */}
        <div className="absolute top-1 right-3 w-6 h-3 bg-sky-950/70 rounded-xs" />
        {/* Headlight */}
        <div className="absolute right-0 top-2 bottom-2 w-1.5 bg-yellow-300 rounded-l-xs" />
        {/* Mini Rear Plate */}
        <div className="absolute left-1 bottom-1 bg-white text-neutral-900 text-[7px] font-mono font-bold px-0.5 rounded-xs border border-neutral-700">
          998
        </div>
      </div>
    );
  }

  // Sedan / SUV / EV
  const isEV = type === 'ev';
  const widthClass = type === 'suv' ? 'w-28 h-13' : 'w-26 h-12';

  return (
    <div
      className={`relative ${widthClass} rounded-lg shadow-md border flex items-center transition-transform`}
      style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.3)' }}
    >
      {/* EV Cyan side accent */}
      {isEV && (
        <div className="absolute inset-x-2 bottom-1 h-0.5 bg-sky-400 rounded-full shadow-[0_0_6px_#38bdf8]" />
      )}

      {/* Roof & Windows */}
      <div className="absolute top-1 left-5 right-5 h-4 bg-neutral-900/80 rounded-t-sm flex gap-1 p-0.5">
        <div className="flex-1 bg-sky-200/40 rounded-xs" />
        <div className="flex-1 bg-sky-200/40 rounded-xs" />
      </div>

      {/* Front Headlight */}
      <div className="absolute right-0 top-2 bottom-2 w-1.5 bg-amber-200 rounded-l-xs shadow-xs" />

      {/* Rear Tail Light */}
      <div className="absolute left-0 top-2 bottom-2 w-1 bg-red-600 rounded-r-xs" />

      {/* Mini License Plate on Rear Bumper */}
      <div className="absolute left-1 bottom-1 text-[7px] font-mono font-bold px-0.5 rounded-xs border leading-tight z-10"
        style={{
          backgroundColor: isEV ? '#bae6fd' : '#ffffff',
          color: '#0f172a',
          borderColor: isEV ? '#0284c7' : '#334155',
        }}
      >
        {plate.number.slice(-4)}
      </div>

      {/* Wheels */}
      <div className="absolute -bottom-1 left-4 w-4 h-2 bg-neutral-950 rounded-b-xs" />
      <div className="absolute -bottom-1 right-5 w-4 h-2 bg-neutral-950 rounded-b-xs" />
    </div>
  );
};
