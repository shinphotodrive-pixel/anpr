import { EnforcementStatus, PenaltyDetails } from '../types/traffic';

/**
 * Korean Road Traffic Act (도로교통법) Speed Enforcement Penalty Calculator
 */
export function calculatePenalty(
  speed: number,
  speedLimit: number,
  isSchoolZone: boolean,
  isEmergency: boolean
): PenaltyDetails {
  const overSpeed = speed - speedLimit;

  // Emergency vehicles on duty are legally exempt under Traffic Act Article 30
  if (isEmergency) {
    return {
      status: 'emergency_exempt',
      overSpeed: Math.max(0, overSpeed),
      fineWon: 0,
      penaltyWon: 0,
      demeritPoints: 0,
      legalNotice: '도로교통법 제30조(긴급자동차의 특례)에 따라 속도제한 적용 면제',
      isCriminal: false
    };
  }

  // Normal speed (no violation)
  if (overSpeed <= 0) {
    return {
      status: 'normal',
      overSpeed: 0,
      fineWon: 0,
      penaltyWon: 0,
      demeritPoints: 0,
      legalNotice: '규정 속도 준수 주행 (적발 대상 아님)',
      isCriminal: false
    };
  }

  // School Zone Weighted Penalties (어린이보호구역 가중처벌: 08:00~20:00 기준)
  if (isSchoolZone) {
    if (overSpeed <= 20) {
      return {
        status: 'speeding',
        overSpeed,
        fineWon: 70000,
        penaltyWon: 60000,
        demeritPoints: 15,
        legalNotice: '어린이보호구역 가중처벌: 20km/h 이하 초과 (과태료 7만원 / 벌점 15점)',
        isCriminal: false
      };
    } else if (overSpeed <= 40) {
      return {
        status: 'speeding',
        overSpeed,
        fineWon: 100000,
        penaltyWon: 90000,
        demeritPoints: 30,
        legalNotice: '어린이보호구역 가중처벌: 20~40km/h 초과 (과태료 10만원 / 벌점 30점)',
        isCriminal: false
      };
    } else if (overSpeed <= 60) {
      return {
        status: 'speeding',
        overSpeed,
        fineWon: 130000,
        penaltyWon: 120000,
        demeritPoints: 60,
        legalNotice: '어린이보호구역 가중처벌: 40~60km/h 초과 (과태료 13만원 / 벌점 60점)',
        isCriminal: false
      };
    } else {
      return {
        status: 'extreme_speeding',
        overSpeed,
        fineWon: 160000,
        penaltyWon: 150000,
        demeritPoints: 120,
        legalNotice: '어린이보호구역 60km/h 초과 초과속: 과태료 16만원 및 면허취소 수준 벌점 120점',
        isCriminal: overSpeed > 80
      };
    }
  }

  // Standard Road / Expressway Speeding Penalties (일반도로 및 고속도로)
  if (overSpeed <= 20) {
    return {
      status: 'speeding',
      overSpeed,
      fineWon: 40000,
      penaltyWon: 30000,
      demeritPoints: 0,
      legalNotice: '도로교통법 제160조: 20km/h 이하 초과 (과태료 4만원, 자진납부 시 3.2만원 / 벌점 0점)',
      isCriminal: false
    };
  } else if (overSpeed <= 40) {
    return {
      status: 'speeding',
      overSpeed,
      fineWon: 70000,
      penaltyWon: 60000,
      demeritPoints: 15,
      legalNotice: '도로교통법 제160조: 20~40km/h 초과 (과태료 7만원 / 범칙금 6만원 / 벌점 15점)',
      isCriminal: false
    };
  } else if (overSpeed <= 60) {
    return {
      status: 'speeding',
      overSpeed,
      fineWon: 100000,
      penaltyWon: 90000,
      demeritPoints: 30,
      legalNotice: '도로교통법 제160조: 40~60km/h 초과 (과태료 10만원 / 범칙금 9만원 / 벌점 30점)',
      isCriminal: false
    };
  } else if (overSpeed <= 80) {
    return {
      status: 'speeding',
      overSpeed,
      fineWon: 130000,
      penaltyWon: 120000,
      demeritPoints: 60,
      legalNotice: '도로교통법 제160조: 60~80km/h 초과 (과태료 13만원 / 벌점 60점, 60일 면허정지 해당)',
      isCriminal: false
    };
  } else if (overSpeed <= 100) {
    // 80 km/h 초과: 형사입건 대상
    return {
      status: 'extreme_speeding',
      overSpeed,
      fineWon: 0,
      penaltyWon: 0,
      demeritPoints: 80,
      legalNotice: '도로교통법 제151조의2 제1항: 80km/h 초과 형사처벌 대상 (30만원 이하 벌금·구류 / 벌점 80점)',
      isCriminal: true
    };
  } else {
    // 100 km/h 초과: 중대 형사입건 대상
    return {
      status: 'extreme_speeding',
      overSpeed,
      fineWon: 0,
      penaltyWon: 0,
      demeritPoints: 100,
      legalNotice: '도로교통법 제151조의2 제2항: 100km/h 초과 중대위반 (100만원 이하 벌금·구류 / 벌점 100점)',
      isCriminal: true
    };
  }
}
