import React, { useEffect } from 'react';
import { X, BookOpen, ShieldAlert, Cpu, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PenaltyGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              도로교통법 과속 단속 기준 및 ANPR 기술 가이드
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-slate-700">
          {/* Section 1: South Korean Road Traffic Act Penalty Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>1. 도로교통법 제17조 및 제160조 과속 처벌 기준 (승용차 기준)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">초과 속도 구분</th>
                    <th className="py-2.5 px-3">일반도로 과태료</th>
                    <th className="py-2.5 px-3">스쿨존(08~20시) 과태료</th>
                    <th className="py-2.5 px-3">벌점</th>
                    <th className="py-2.5 px-3">법적 처분</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">20 km/h 이하</td>
                    <td className="py-2.5 px-3">40,000원</td>
                    <td className="py-2.5 px-3 text-amber-700 font-bold">70,000원</td>
                    <td className="py-2.5 px-3">0점 (스쿨존 15점)</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">사전납부 시 20% 감경</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">20 초과 ~ 40 이하</td>
                    <td className="py-2.5 px-3">70,000원</td>
                    <td className="py-2.5 px-3 text-amber-700 font-bold">100,000원</td>
                    <td className="py-2.5 px-3">15점 (스쿨존 30점)</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">범칙금 6만원 부과 가능</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">40 초과 ~ 60 이하</td>
                    <td className="py-2.5 px-3">100,000원</td>
                    <td className="py-2.5 px-3 text-amber-700 font-bold">130,000원</td>
                    <td className="py-2.5 px-3">30점 (스쿨존 60점)</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">범칙금 9만원 부과 가능</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">60 초과 ~ 80 이하</td>
                    <td className="py-2.5 px-3">130,000원</td>
                    <td className="py-2.5 px-3 text-amber-700 font-bold">160,000원</td>
                    <td className="py-2.5 px-3 text-red-600 font-bold">60점 (스쿨존 120점)</td>
                    <td className="py-2.5 px-3 font-sans text-red-600 font-medium">60일 면허정지 / 면허취소</td>
                  </tr>
                  <tr className="bg-rose-50/70">
                    <td className="py-2.5 px-3 font-sans font-bold text-rose-900">80 km/h 초과 (초과속)</td>
                    <td className="py-2.5 px-3 text-rose-900 font-bold" colSpan={2}>
                      형사처벌 (과태료 아님)
                    </td>
                    <td className="py-2.5 px-3 text-rose-900 font-bold">80점</td>
                    <td className="py-2.5 px-3 font-sans text-rose-900 font-semibold">
                      30만원 이하 벌금 또는 구류
                    </td>
                  </tr>
                  <tr className="bg-rose-100/60">
                    <td className="py-2.5 px-3 font-sans font-bold text-rose-900">100 km/h 초과 (초초과속)</td>
                    <td className="py-2.5 px-3 text-rose-900 font-bold" colSpan={2}>
                      중대 형사처벌 (과태료 아님)
                    </td>
                    <td className="py-2.5 px-3 text-rose-900 font-bold">100점</td>
                    <td className="py-2.5 px-3 font-sans text-rose-900 font-semibold">
                      100만원 이하 벌금 또는 구류 (3회 적발 시 1년 이하 징역 및 취소)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: ANPR Technology Principles */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>2. ANPR(차량 번호판 자동 인식) 핵심 컴퓨터 비전 파이프라인</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-xs text-blue-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>트리거 및 고속 영상 획득</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  노면 루프 센서(인덕티브 루프) 또는 24GHz 도플러 레이더가 접근 차량의 속도를 측정하고, 지정된 트리거 라인 진입 순간 카메라의 고속 전자 셔터(1/2000s) 및 스트로보 플래시를 동조 발광시켜 잔상 없는 선명한 정지 화상을 캡처합니다.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-xs text-blue-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>번호판 영역(ROI) 검출</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  전체 차량 영상에서 Sobel/Canny 필터를 활용한 수직 에지 강조, 가우시안 블러, 모폴로지 팽창·침식을 적용한 후 한국 표준 번호판 규격(가로:세로 4.7:1 또는 2:1 비율)에 부합하는 사각형 후보군을 추출하고 투시 변환으로 기울기를 보정합니다.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-xs text-blue-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>적응형 이진화 및 문자 분할</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  조명 불균일 및 그림자 보정을 위해 오츠(Otsu) 또는 국소 적응형 임계값 알고리즘으로 이진화합니다. 수직 투영 히스토그램(Vertical Projection Histogram)을 통해 숫자와 한글 문자의 경계를 개별 글자 단위 바운딩 박스로 분할합니다.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-xs text-blue-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  <span>딥러닝 OCR 분류 및 차적 조회</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  합성곱 신경망(CNN) 및 시퀀스 모델(CRNN)을 통해 분할된 문자를 텍스트로 인식합니다. 한국 번호판 문법(숫자 2~3자리 + 한글 32자 중 1자 + 숫자 4자리)에 대한 구문 검증을 거친 후 경찰청 전산망 차적 데이터베이스와 실시간 대조하여 과태료 고지서를 발행합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Legal Exemption Notice */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs leading-relaxed text-blue-950">
            <div className="font-bold mb-1 flex items-center gap-1.5 text-blue-900">
              <Check className="w-4 h-4 text-blue-600" />
              <span>긴급자동차 면제 규정 (도로교통법 제30조)</span>
            </div>
            소방차, 119구급차, 경찰 순찰차 등 본래의 긴급한 용도로 운행 중인 긴급자동차는 도로교통법 제17조(속도제한), 제22조(앞지르기 금지) 등의 적용이 배제되며 과속 단속 카메라에 감지되더라도 공무수행 증명 확인을 거쳐 과태료가 면제 처분됩니다.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
