import React, { useState } from 'react';
import { VehicleType, WeatherType, RoadZone } from '../types/traffic';
import { Play, Square, Car, ShieldAlert, CloudRain, Moon, Sun, Sliders } from 'lucide-react';

interface Props {
  roadZones: RoadZone[];
  currentZone: RoadZone;
  onSelectZone: (zone: RoadZone) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  vehicleType: VehicleType;
  onVehicleTypeChange: (type: VehicleType) => void;
  weather: WeatherType;
  onWeatherChange: (weather: WeatherType) => void;
  lane: 1 | 2;
  onLaneChange: (lane: 1 | 2) => void;
  customPlate: string;
  onCustomPlateChange: (plate: string) => void;
  isAutoRunning: boolean;
  onToggleAuto: () => void;
  onSpawnCar: () => void;
}

export const ControlPanel: React.FC<Props> = ({
  roadZones,
  currentZone,
  onSelectZone,
  speed,
  onSpeedChange,
  vehicleType,
  onVehicleTypeChange,
  weather,
  onWeatherChange,
  lane,
  onLaneChange,
  customPlate,
  onCustomPlateChange,
  isAutoRunning,
  onToggleAuto,
  onSpawnCar,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isSpeeding = speed > currentZone.speedLimit;
  const overSpeed = speed - currentZone.speedLimit;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
      {/* Top Row: Zone Selector & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            도로 구간 및 법정 제한속도 선택
          </label>
          <div className="flex flex-wrap gap-1.5">
            {roadZones.map((zone) => {
              const isSelected = currentZone.id === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => onSelectZone(zone)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? zone.isSchoolZone
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {zone.isSchoolZone && <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />}
                  <span>{zone.name}</span>
                  <span className="font-mono opacity-80">({zone.speedLimit}km/h)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Simulation Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSpawnCar}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>차량 1대 통과</span>
          </button>

          <button
            onClick={onToggleAuto}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              isAutoRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isAutoRunning ? (
              <>
                <Square className="w-4 h-4" />
                <span>자동 주행 정지</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>연속 자동 주행</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle Row: Speed Control Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800">
            차량 진입 속도 조절
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-lg font-bold tabular-nums px-2 py-0.5 rounded ${
                isSpeeding
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {speed} km/h
            </span>
            <span className="text-xs text-slate-500">
              {isSpeeding ? (
                <span className="text-red-600 font-medium">+{overSpeed}km/h 과속 초과!</span>
              ) : (
                <span className="text-emerald-700">규정 속도 준수</span>
              )}
            </span>
          </div>
        </div>

        <input
          type="range"
          min="30"
          max="180"
          step="1"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>30 km/h</span>
          <span className="text-slate-600">제한속도 기준: {currentZone.speedLimit} km/h</span>
          <span>180 km/h</span>
        </div>
      </div>

      {/* Parameter Control Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Vehicle Type */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 mb-1.5">차량 유형</span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'sedan', label: '승용차' },
              { id: 'suv', label: 'SUV' },
              { id: 'ev', label: '전기차(EV)' },
              { id: 'truck', label: '화물트럭' },
              { id: 'bus', label: '버스' },
              { id: 'emergency', label: '119긴급' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onVehicleTypeChange(item.id as VehicleType)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
                  vehicleType === item.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lane Selection */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 mb-1.5">주행 차로</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onLaneChange(1)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                lane === 1
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1차로 (추월 차로)
            </button>
            <button
              onClick={() => onLaneChange(2)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                lane === 2
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2차로 (주행 차로)
            </button>
          </div>
        </div>

        {/* Weather Conditions */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 mb-1.5">환경 및 조도</span>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onWeatherChange('clear')}
              className={`p-1.5 text-xs font-medium rounded-md flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                weather === 'clear'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>맑음(주간)</span>
            </button>
            <button
              onClick={() => onWeatherChange('night')}
              className={`p-1.5 text-xs font-medium rounded-md flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                weather === 'night'
                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>야간(IR)</span>
            </button>
            <button
              onClick={() => onWeatherChange('rain')}
              className={`p-1.5 text-xs font-medium rounded-md flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                weather === 'rain'
                  ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-cyan-600" />
              <span>우천(반사)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced / Custom Plate Input Expandable */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer font-medium"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>사용자 지정 번호판 직접 입력 {showAdvanced ? '접기 ▲' : '열기 ▼'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs text-slate-600 whitespace-nowrap">테스트 번호판 지정:</span>
            <input
              type="text"
              placeholder="예: 123가 4567 또는 비워두면 자동생성"
              value={customPlate}
              onChange={(e) => onCustomPlateChange(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono focus:outline-blue-500"
            />
            {customPlate && (
              <button
                onClick={() => onCustomPlateChange('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                지우기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
