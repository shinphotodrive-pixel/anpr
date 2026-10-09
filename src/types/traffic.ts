export type VehicleType = 'sedan' | 'suv' | 'ev' | 'truck' | 'bus' | 'emergency';

export type PlateType = 'standard' | 'ev' | 'commercial' | 'emergency';

export interface PlateInfo {
  number: string; // e.g. "123가 4567"
  type: PlateType;
  ownerRegion?: string;
  vehicleCategoryText: string;
}

export type WeatherType = 'clear' | 'night' | 'rain';

export interface RoadZone {
  id: string;
  name: string;
  speedLimit: number;
  category: 'school' | 'city' | 'expressway' | 'highway';
  description: string;
  isSchoolZone?: boolean;
}

export interface VehicleInstance {
  id: string;
  type: VehicleType;
  color: string;
  plate: PlateInfo;
  speed: number;
  lane: 1 | 2; // 1: 1차선 (상단/추월), 2: 2차선 (하단/주행)
  xPosition: number; // percentage or px
  targetSpeed: number;
  isEmergency: boolean;
  spawnTime: number;
  detected: boolean;
}

export type EnforcementStatus = 'normal' | 'speeding' | 'extreme_speeding' | 'emergency_exempt';

export interface PenaltyDetails {
  status: EnforcementStatus;
  overSpeed: number; // km/h over limit
  fineWon: number; // 과태료 (원)
  penaltyWon: number; // 범칙금 (원)
  demeritPoints: number; // 벌점
  legalNotice: string; // 도로교통법 조항 안내
  isCriminal: boolean; // 형사입건 대상 여부
}

export interface DetectionRecord {
  id: string;
  timestamp: string;
  carId: string;
  plate: PlateInfo;
  vehicleType: VehicleType;
  vehicleColor: string;
  measuredSpeed: number;
  speedLimit: number;
  lane: number;
  zoneName: string;
  isSchoolZone: boolean;
  weather: WeatherType;
  penalty: PenaltyDetails;
  confidenceScore: number; // e.g. 98.7%
  characterScores: { char: string; confidence: number }[];
}

export interface ANPRProcessingState {
  isProcessing: boolean;
  currentStep: number; // 1: 획득, 2: 영역추출, 3: 문자분할, 4: OCR인식
  activeRecord: DetectionRecord | null;
}
