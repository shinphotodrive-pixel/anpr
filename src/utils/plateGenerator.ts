import { PlateInfo, PlateType, VehicleType } from '../types/traffic';

// Valid Korean license plate Hangul characters by category
// Non-commercial private cars:
const PRIVATE_HANGUL = [
  '가', '나', '다', '라', '마',
  '거', '너', '더', '러', '머', '버', '서', '어', '저',
  '고', '노', '도', '로', '모', '보', '소', '오', '조',
  '구', '누', '두', '루', '무', '부', '수', '우', '주'
];

// Commercial transport:
const COMMERCIAL_HANGUL = ['바', '사', '아', '자']; // 택시, 버스
const DELIVERY_HANGUL = ['배']; // 택배

// Rental cars:
const RENTAL_HANGUL = ['하', '허', '호'];

// Regions for commercial plates
const KOREAN_REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

export function generateKoreanPlate(type: VehicleType): PlateInfo {
  if (type === 'emergency') {
    const is119 = Math.random() > 0.5;
    const prefix = is119 ? '998' : '999';
    const char = is119 ? '구' : '경';
    const suffix = is119 ? '119' + Math.floor(Math.random() * 9 + 1) : '112' + Math.floor(Math.random() * 9 + 1);
    return {
      number: `${prefix}${char} ${suffix}`,
      type: 'emergency',
      vehicleCategoryText: is119 ? '긴급 구급자동차' : '긴급 순찰자동차'
    };
  }

  if (type === 'bus') {
    const region = KOREAN_REGIONS[Math.floor(Math.random() * KOREAN_REGIONS.length)];
    const num1 = Math.floor(Math.random() * 30) + 70; // 70-99
    const char = COMMERCIAL_HANGUL[Math.floor(Math.random() * COMMERCIAL_HANGUL.length)];
    const num2 = Math.floor(Math.random() * 9000) + 1000;
    return {
      number: `${region} ${num1}${char} ${num2}`,
      type: 'commercial',
      ownerRegion: region,
      vehicleCategoryText: '노선 및 시외 승합버스'
    };
  }

  if (type === 'truck') {
    const isCommercial = Math.random() > 0.5;
    if (isCommercial) {
      const region = KOREAN_REGIONS[Math.floor(Math.random() * KOREAN_REGIONS.length)];
      const num1 = Math.floor(Math.random() * 15) + 80; // 80-97
      const char = Math.random() > 0.4 ? DELIVERY_HANGUL[0] : COMMERCIAL_HANGUL[Math.floor(Math.random() * COMMERCIAL_HANGUL.length)];
      const num2 = Math.floor(Math.random() * 9000) + 1000;
      return {
        number: `${region} ${num1}${char} ${num2}`,
        type: 'commercial',
        ownerRegion: region,
        vehicleCategoryText: char === '배' ? '영업용 배송화물' : '영업용 일반화물'
      };
    } else {
      const num1 = Math.floor(Math.random() * 15) + 80;
      const char = PRIVATE_HANGUL[Math.floor(Math.random() * PRIVATE_HANGUL.length)];
      const num2 = Math.floor(Math.random() * 9000) + 1000;
      return {
        number: `${num1}${char} ${num2}`,
        type: 'standard',
        vehicleCategoryText: '자가용 소형 화물'
      };
    }
  }

  if (type === 'ev') {
    // Electric vehicle blue plate
    const isThreeDigit = Math.random() > 0.3;
    const num1 = isThreeDigit 
      ? Math.floor(Math.random() * 900) + 100 
      : Math.floor(Math.random() * 90) + 10;
    const char = Math.random() > 0.8 
      ? RENTAL_HANGUL[Math.floor(Math.random() * RENTAL_HANGUL.length)]
      : PRIVATE_HANGUL[Math.floor(Math.random() * PRIVATE_HANGUL.length)];
    const num2 = Math.floor(Math.random() * 9000) + 1000;
    return {
      number: `${num1}${char} ${num2}`,
      type: 'ev',
      vehicleCategoryText: '친환경 순수전기 승용차'
    };
  }

  // Sedan or SUV: modern 8-digit (or older 7-digit)
  const isEightDigit = Math.random() > 0.25;
  const num1 = isEightDigit 
    ? Math.floor(Math.random() * 900) + 100 // 100 ~ 999
    : Math.floor(Math.random() * 90) + 10; // 10 ~ 99
  const char = Math.random() > 0.85
    ? RENTAL_HANGUL[Math.floor(Math.random() * RENTAL_HANGUL.length)]
    : PRIVATE_HANGUL[Math.floor(Math.random() * PRIVATE_HANGUL.length)];
  const num2 = Math.floor(Math.random() * 9000) + 1000;

  return {
    number: `${num1}${char} ${num2}`,
    type: 'standard',
    vehicleCategoryText: type === 'suv' ? '일반 레저용 SUV' : '일반 자가용 승용차'
  };
}
