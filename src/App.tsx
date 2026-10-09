import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VehicleType,
  WeatherType,
  RoadZone,
  VehicleInstance,
  DetectionRecord,
  ANPRProcessingState,
  PlateInfo,
} from './types/traffic';
import { Header } from './components/Header';
import { RoadCanvas } from './components/RoadCanvas';
import { ControlPanel } from './components/ControlPanel';
import { CameraScanner } from './components/CameraScanner';
import { ANPRInspector } from './components/ANPRInspector';
import { DetectionLogTable } from './components/DetectionLogTable';
import { AnalyticsStats } from './components/AnalyticsStats';
import { PenaltyGuideModal } from './components/PenaltyGuideModal';
import { generateKoreanPlate } from './utils/plateGenerator';
import { calculatePenalty } from './utils/penaltyCalculator';
import {
  playCameraShutterSound,
  playRadarBeepSound,
  playViolationSound,
  setSoundEnabled,
  isSoundEnabled,
} from './utils/audio';

const ROAD_ZONES: RoadZone[] = [
  {
    id: 'school',
    name: '어린이보호구역 (스쿨존)',
    speedLimit: 30,
    category: 'school',
    description: '초등학교 및 유치원 정문 반경 300m, 가중처벌 적용 구역',
    isSchoolZone: true,
  },
  {
    id: 'city',
    name: '도심 안전속도 5030',
    speedLimit: 50,
    category: 'city',
    description: '도시지역 일반도로 기본제한속도',
  },
  {
    id: 'arterial',
    name: '도시고속화도로 (간선)',
    speedLimit: 80,
    category: 'expressway',
    description: '올림픽대로, 강변북로, 번영로 등 주요 간선도로',
  },
  {
    id: 'highway',
    name: '일반 고속국도',
    speedLimit: 100,
    category: 'highway',
    description: '경부·호남선 등 왕복 4차로 이상 일반 고속도로',
  },
  {
    id: 'express',
    name: '고속국도 최고제한구역',
    speedLimit: 110,
    category: 'highway',
    description: '서해안·중부내륙고속도로 등 최고한도 지정구역',
  },
];

const CAR_COLORS = [
  '#ffffff', // 화이트
  '#0f172a', // 미드나이트 블랙
  '#64748b', // 메탈릭 그레이
  '#1e40af', // 로열 블루
  '#b91c1c', // 루비 레드
  '#047857', // 포레스트 그린
  '#e2e8f0', // 세라믹 실버
];

export default function App() {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<'simulation' | 'camera' | 'inspector' | 'logs' | 'guide'>('simulation');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Simulation Parameters
  const [currentZone, setCurrentZone] = useState<RoadZone>(ROAD_ZONES[2]); // 80km/h default
  const [speed, setSpeed] = useState<number>(75);
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [lane, setLane] = useState<1 | 2>(1);
  const [customPlate, setCustomPlate] = useState<string>('');
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);

  // Road Simulation Active State
  const [vehicles, setVehicles] = useState<VehicleInstance[]>([]);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // ANPR Pipeline & Records
  const [latestRecord, setLatestRecord] = useState<DetectionRecord | null>(null);
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [anprState, setAnprState] = useState<ANPRProcessingState>({
    isProcessing: false,
    currentStep: 1,
    activeRecord: null,
  });

  const carIdCounterRef = useRef(0);
  const autoIntervalRef = useRef<number | null>(null);

  // Toggle Sound handler
  const handleToggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
  };

  // Reset simulation handler
  const handleReset = () => {
    setVehicles([]);
    setRecords([]);
    setLatestRecord(null);
    setIsAutoRunning(false);
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }
  };

  // Trigger ANPR Step-by-Step Processing
  const runANPRPipeline = useCallback((record: DetectionRecord) => {
    setAnprState({
      isProcessing: true,
      currentStep: 1,
      activeRecord: record,
    });

    const stepTimer1 = setTimeout(() => {
      setAnprState((prev) => ({ ...prev, currentStep: 2 }));
    }, 180);

    const stepTimer2 = setTimeout(() => {
      setAnprState((prev) => ({ ...prev, currentStep: 3 }));
    }, 360);

    const stepTimer3 = setTimeout(() => {
      setAnprState((prev) => ({ ...prev, currentStep: 4, isProcessing: false }));
    }, 540);

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
    };
  }, []);

  // Handle Detection Trigger when vehicle hits camera gantry (X = 72%)
  const handleVehicleDetection = useCallback(
    (vehicle: VehicleInstance) => {
      // 1. Camera Flash
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 140);

      // 2. Audio SFX
      playCameraShutterSound();
      playRadarBeepSound();

      // 3. Penalty Calculation
      const isSpeeding = vehicle.speed > currentZone.speedLimit;
      const penalty = calculatePenalty(
        Math.round(vehicle.speed),
        currentZone.speedLimit,
        !!currentZone.isSchoolZone,
        vehicle.isEmergency
      );

      if (isSpeeding && !vehicle.isEmergency) {
        setTimeout(() => playViolationSound(), 120);
      }

      // 4. Character Confidence Scores Generation
      const plateChars = vehicle.plate.number.replace(/\s+/g, '').split('');
      const characterScores = plateChars.map((char) => ({
        char,
        confidence: 96.5 + Math.random() * 3.4, // 96.5% ~ 99.9%
      }));
      const overallConfidence =
        characterScores.reduce((acc, c) => acc + c.confidence, 0) / characterScores.length;

      // 5. Build Record
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);

      const record: DetectionRecord = {
        id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: timeStr,
        carId: vehicle.id,
        plate: vehicle.plate,
        vehicleType: vehicle.type,
        vehicleColor: vehicle.color,
        measuredSpeed: Math.round(vehicle.speed),
        speedLimit: currentZone.speedLimit,
        lane: vehicle.lane,
        zoneName: currentZone.name,
        isSchoolZone: !!currentZone.isSchoolZone,
        weather,
        penalty,
        confidenceScore: overallConfidence,
        characterScores,
      };

      setLatestRecord(record);
      setRecords((prev) => [record, ...prev.slice(0, 99)]);
      runANPRPipeline(record);
    },
    [currentZone, weather, runANPRPipeline]
  );

  // Spawn a Vehicle
  const spawnVehicle = useCallback(
    (options?: {
      targetSpeed?: number;
      type?: VehicleType;
      targetLane?: 1 | 2;
      plateText?: string;
    }) => {
      carIdCounterRef.current++;
      const vType = options?.type || vehicleType;
      const vLane = options?.targetLane || lane;
      const vSpeed = options?.targetSpeed || speed;

      // Plate generation or custom
      let plateInfo = generateKoreanPlate(vType);
      if (options?.plateText && options.plateText.trim()) {
        plateInfo = {
          ...plateInfo,
          number: options.plateText.trim(),
        };
      } else if (customPlate.trim()) {
        plateInfo = {
          ...plateInfo,
          number: customPlate.trim(),
        };
      }

      const randomColor =
        vType === 'bus'
          ? '#eab308'
          : vType === 'emergency'
          ? '#ffffff'
          : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];

      const newVehicle: VehicleInstance = {
        id: `veh-${carIdCounterRef.current}-${Date.now()}`,
        type: vType,
        color: randomColor,
        plate: plateInfo,
        speed: vSpeed,
        lane: vLane,
        xPosition: -12, // start off-screen on left
        targetSpeed: vSpeed,
        isEmergency: vType === 'emergency',
        spawnTime: Date.now(),
        detected: false,
      };

      setVehicles((prev) => [...prev, newVehicle]);
    },
    [vehicleType, lane, speed, customPlate]
  );

  // Send camera recognized plate to the road simulator
  const handleSendCameraPlateToSimulator = (plate: PlateInfo, typeHint?: VehicleType) => {
    setCustomPlate(plate.number);
    if (typeHint) {
      setVehicleType(typeHint);
    }
    // Spawn vehicle with this recognized plate on the road
    spawnVehicle({
      plateText: plate.number,
      type: typeHint || (plate.type === 'ev' ? 'ev' : plate.type === 'commercial' ? 'bus' : 'sedan'),
      targetSpeed: speed,
    });
    // Smooth scroll up to Road Simulation section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Continuous Animation Loop for smooth vehicle motion
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const updateMotion = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setVehicles((prevVehicles) => {
        if (prevVehicles.length === 0) return prevVehicles;

        const updated: VehicleInstance[] = [];

        for (const v of prevVehicles) {
          // Speed conversion: 100km/h traverses the 100% road width in ~2.2 seconds
          // velocity (% per second) = v.speed * 0.45
          const speedFactor = 0.45;
          const nextX = v.xPosition + v.speed * speedFactor * delta;

          // Camera sensor trigger position: around 72%
          if (nextX >= 72 && !v.detected) {
            v.detected = true;
            handleVehicleDetection(v);
          }

          // Remove vehicle once completely exited past right edge (> 112%)
          if (nextX <= 114) {
            updated.push({
              ...v,
              xPosition: nextX,
            });
          }
        }

        return updated;
      });

      animId = requestAnimationFrame(updateMotion);
    };

    animId = requestAnimationFrame(updateMotion);
    return () => cancelAnimationFrame(animId);
  }, [handleVehicleDetection]);

  // Auto Traffic Generator Toggle
  const toggleAutoMode = () => {
    const nextRunning = !isAutoRunning;
    setIsAutoRunning(nextRunning);

    if (nextRunning) {
      // Spawn immediately
      spawnRandomTraffic();
      // Set interval
      autoIntervalRef.current = window.setInterval(spawnRandomTraffic, 2800);
    } else {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    }
  };

  // Auto random traffic spawner
  const spawnRandomTraffic = () => {
    const limit = currentZone.speedLimit;
    const rand = Math.random();

    let randomSpeed: number;
    let type: VehicleType = 'sedan';

    if (rand < 0.05) {
      // Emergency vehicle (5% chance)
      type = 'emergency';
      randomSpeed = limit + Math.floor(Math.random() * 35) + 10;
    } else if (rand < 0.20) {
      // EV (15% chance)
      type = 'ev';
      randomSpeed = Math.random() > 0.4 ? limit - Math.floor(Math.random() * 15) : limit + Math.floor(Math.random() * 25);
    } else if (rand < 0.35) {
      // Truck or Bus (15% chance)
      type = Math.random() > 0.5 ? 'truck' : 'bus';
      randomSpeed = Math.max(30, limit - Math.floor(Math.random() * 18));
    } else if (rand < 0.70) {
      // Normal private sedan / SUV compliant speed
      type = Math.random() > 0.4 ? 'sedan' : 'suv';
      randomSpeed = limit - Math.floor(Math.random() * 12);
    } else if (rand < 0.92) {
      // Regular speeding (+5 to +35 km/h)
      type = Math.random() > 0.5 ? 'sedan' : 'suv';
      randomSpeed = limit + Math.floor(Math.random() * 35) + 3;
    } else {
      // Extreme Speeding (+45 to +75 km/h)
      type = 'sedan';
      randomSpeed = limit + Math.floor(Math.random() * 30) + 45;
    }

    const randomLane: 1 | 2 = Math.random() > 0.45 ? 1 : 2;

    spawnVehicle({
      targetSpeed: Math.max(30, Math.min(180, randomSpeed)),
      type,
      targetLane: randomLane,
    });
  };

  // Spawn an initial demo vehicle on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      spawnVehicle({
        targetSpeed: 88,
        type: 'sedan',
        targetLane: 1,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [spawnVehicle]);

  // Clean up auto interval on unmount
  useEffect(() => {
    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        onResetSimulation={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Top Telemetry Strip */}
        <AnalyticsStats records={records} />

        {/* Section 2: Road Simulation Stage (Interactive Canvas & Overhead Gantry) */}
        <div className="space-y-4">
          <RoadCanvas
            vehicles={vehicles}
            roadZone={currentZone}
            weather={weather}
            isFlashing={isFlashing}
          />

          {/* Interactive Simulation Controls */}
          <ControlPanel
            roadZones={ROAD_ZONES}
            currentZone={currentZone}
            onSelectZone={(z) => {
              setCurrentZone(z);
              setSpeed(Math.min(180, Math.max(30, z.speedLimit - 5)));
            }}
            speed={speed}
            onSpeedChange={setSpeed}
            vehicleType={vehicleType}
            onVehicleTypeChange={setVehicleType}
            weather={weather}
            onWeatherChange={setWeather}
            lane={lane}
            onLaneChange={setLane}
            customPlate={customPlate}
            onCustomPlateChange={setCustomPlate}
            isAutoRunning={isAutoRunning}
            onToggleAuto={toggleAutoMode}
            onSpawnCar={() => spawnVehicle()}
          />
        </div>

        {/* Section 3: Smartphone Camera & Photo ANPR Scanner */}
        <div id="camera-section">
          <CameraScanner onSendToSimulator={handleSendCameraPlateToSimulator} />
        </div>

        {/* Section 4: ANPR Deep Dive Pipeline (Computer Vision Stages) */}
        <div id="inspector-section">
          <ANPRInspector anprState={anprState} latestRecord={latestRecord} />
        </div>

        {/* Section 4: Real-time Enforcement Log & History Table */}
        <div id="logs-section" className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              실시간 도로 단속 대장
            </h3>
            <span className="text-xs text-slate-500">
              누적 기록: <span className="font-mono font-bold tabular-nums text-slate-800">{records.length}</span>건
            </span>
          </div>

          <DetectionLogTable
            records={records}
            onClearRecords={() => setRecords([])}
            onSelectRecord={(rec) => {
              setLatestRecord(rec);
              // scroll to inspector
              const el = document.getElementById('inspector-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      </main>

      {/* South Korean Traffic Act Penalty Guide Modal */}
      <PenaltyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <span>스마트 과속 단속 및 ANPR 컴퓨터 비전 시뮬레이터</span>
          <span className="mx-2">·</span>
          <span>대한민국 도로교통법 제17조 및 제160조 단속 기준 적용</span>
        </div>
      </footer>
    </div>
  );
}
