import React, { useState } from 'react';
import { DetectionRecord, ANPRProcessingState } from '../types/traffic';
import { LicensePlateBadge } from './LicensePlateBadge';
import { Eye, Scan, Cpu, Database, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

interface Props {
  anprState: ANPRProcessingState;
  latestRecord: DetectionRecord | null;
  onSelectStep?: (step: number) => void;
}

export const ANPRInspector: React.FC<Props> = ({ anprState, latestRecord }) => {
  const [filterView, setFilterView] = useState<'original' | 'edges' | 'binary' | 'ocr'>('original');

  const activeStep = anprState.isProcessing ? anprState.currentStep : 4;
  const record = latestRecord;

  if (!record) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Scan className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          ANPR 비전 파이프라인 대기 중
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          도로 모니터링 영역에서 차량을 통과시키면 레이더가 감지하여 고속 카메라 캡처와 번호판 인식 4단계 과정이 실시간으로 시각화됩니다.
        </p>
      </div>
    );
  }

  const { plate, penalty, measuredSpeed, speedLimit, lane, weather, confidenceScore, characterScores } = record;
  const isSpeeding = penalty.status === 'speeding' || penalty.status === 'extreme_speeding';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header & Pipeline Progress */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <span>실시간 ANPR 컴퓨터 비전 파이프라인 분석</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              도플러 레이더 속도 트리거 · 1/2000s 전자셔터 스냅샷 · OCR 신경망 인식
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">전체 신뢰도:</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums text-sm">
              {confidenceScore.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 4-Step Pipeline Flow Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {[
            {
              step: 1,
              title: '01. 영상 획득',
              desc: '레이더 센서 연동 셔터 촬영',
              icon: Eye,
            },
            {
              step: 2,
              title: '02. 번호판 추출',
              desc: 'Sobel 에지 & 사각형 ROI',
              icon: Scan,
            },
            {
              step: 3,
              title: '03. 문자 분할',
              desc: '오츠 적응형 이진화 분할',
              icon: Cpu,
            },
            {
              step: 4,
              title: '04. OCR 및 조회',
              desc: '딥러닝 인식 & 과태료 산정',
              icon: Database,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = activeStep === item.step;
            const isCompleted = activeStep > item.step;

            return (
              <div
                key={item.step}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-1 ring-blue-400'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30 text-slate-700'
                    : 'border-slate-200 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrent
                        ? 'text-blue-600 animate-pulse'
                        : isCompleted
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-blue-900'
                        : isCompleted
                        ? 'text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column View: Visual Filter Canvas on Left, Detection Data on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vision Processing Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">비전 프로세싱 렌더링 뷰</span>
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilterView('original')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterView === 'original'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                원본 스냅샷
              </button>
              <button
                onClick={() => setFilterView('edges')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterView === 'edges'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sobel 에지
              </button>
              <button
                onClick={() => setFilterView('binary')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterView === 'binary'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                적응형 이진화
              </button>
              <button
                onClick={() => setFilterView('ocr')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterView === 'ocr'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                문자 분할 박스
              </button>
            </div>
          </div>

          {/* Simulated High-Res Snapshot Frame */}
          <div
            className={`relative w-full h-64 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center transition-all ${
              filterView === 'edges'
                ? 'bg-black'
                : filterView === 'binary'
                ? 'bg-neutral-900'
                : 'bg-slate-900'
            }`}
          >
            {/* Frame Metadata Watermark (OSD) */}
            <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-cyan-300 z-20 pointer-events-none">
              <span>REC {record.timestamp} · CH-{lane}</span>
              <span className="text-yellow-300 font-bold">RADAR: {measuredSpeed} km/h</span>
            </div>

            {/* Filter-specific render preview */}
            {filterView === 'original' && (
              <div className="flex flex-col items-center justify-center p-4 text-center z-10">
                {/* Vehicle Silhouette Representation */}
                <div
                  className="w-48 h-20 rounded-lg border-2 border-slate-600 flex items-center justify-center shadow-lg relative mb-4"
                  style={{ backgroundColor: record.vehicleColor }}
                >
                  <div className="absolute top-1 left-6 right-6 h-6 bg-slate-950/80 rounded-xs" />
                  {/* Bounding box around plate */}
                  <div className="absolute -bottom-2 px-1 py-0.5 border-2 border-emerald-400 bg-emerald-500/20 rounded shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                    <LicensePlateBadge plate={plate} size="sm" />
                  </div>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-3">
                  <span>차종: {plate.vehicleCategoryText}</span>
                  <span>·</span>
                  <span>조도: {weather === 'night' ? 'IR 적외선 투광' : weather === 'rain' ? '우천 노면보정' : '주간 자연광'}</span>
                </div>
              </div>
            )}

            {filterView === 'edges' && (
              <div className="flex flex-col items-center justify-center p-4 z-10 w-full h-full">
                <div className="relative border border-cyan-500/40 p-4 rounded bg-black/60 w-3/4 max-w-sm flex flex-col items-center">
                  <div className="text-[11px] text-cyan-400 font-mono mb-2">
                    [Sobel Edge Filter Contour Analysis]
                  </div>
                  {/* Wireframe plate contour */}
                  <div className="w-56 h-14 border-2 border-dashed border-emerald-400 flex items-center justify-center font-mono text-emerald-400 text-lg tracking-widest bg-emerald-950/40">
                    ■ ROI CANDIDATE ■
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    Aspect Ratio: 4.72 (한국 표준 520x110 규격 일치율 99.2%)
                  </div>
                </div>
              </div>
            )}

            {filterView === 'binary' && (
              <div className="flex flex-col items-center justify-center p-4 z-10 w-full h-full bg-black">
                <div className="bg-white p-3 rounded border-4 border-neutral-700 flex flex-col items-center">
                  <div className="text-[10px] text-neutral-500 font-mono mb-1">
                    [Otsu Adaptive Binarization Threshold: 142]
                  </div>
                  <div className="font-mono font-extrabold text-2xl tracking-wider text-black bg-white px-4 py-2 border-2 border-black">
                    {plate.number}
                  </div>
                </div>
              </div>
            )}

            {filterView === 'ocr' && (
              <div className="flex flex-col items-center justify-center p-4 z-10 w-full h-full">
                <div className="text-[11px] text-yellow-300 font-mono mb-3">
                  [Deep Learning CRNN Character Segmentation]
                </div>
                {/* Individual segmented character boxes */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {characterScores.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center bg-slate-800 border border-emerald-400/80 px-2 py-1.5 rounded"
                    >
                      <span className="font-mono text-base font-bold text-white">
                        {item.char}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400">
                        {item.confidence.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Corner Bracket OSD markers */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </div>

          {/* Character Recognition Breakdown Table */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              개별 문자 분할 및 OCR 인식 점수표
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {characterScores.map((c, i) => (
                <div
                  key={i}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-center shrink-0 min-w-10"
                >
                  <div className="font-mono font-bold text-xs text-slate-900">{c.char}</div>
                  <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                    {c.confidence.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Violation Verdict & Traffic Law Calculator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-semibold text-slate-700">단속 측정 결과 및 법적 판정</div>

          {/* Big Plate Display Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2">
            <span className="text-xs text-slate-500">인식된 차량 번호판</span>
            <LicensePlateBadge plate={plate} size="lg" />
            <span className="text-xs text-slate-500 font-medium">
              {plate.vehicleCategoryText}
            </span>
          </div>

          {/* Speed Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="block text-xs text-slate-500 mb-0.5">레이더 측정 속도</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  isSpeeding ? 'text-red-600' : 'text-slate-900'
                }`}>
                  {measuredSpeed}
                </span>
                <span className="text-xs text-slate-500">km/h</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="block text-xs text-slate-500 mb-0.5">법정 제한 속도</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {speedLimit}
                </span>
                <span className="text-xs text-slate-500">km/h</span>
              </div>
            </div>
          </div>

          {/* Legal Verdict Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              penalty.status === 'emergency_exempt'
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : isSpeeding
                ? penalty.status === 'extreme_speeding'
                  ? 'bg-rose-100 border-rose-300 text-rose-950'
                  : 'bg-red-50 border-red-200 text-red-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            {penalty.status === 'emergency_exempt' ? (
              <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            ) : isSpeeding ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1">
              <div className="font-bold text-sm flex items-center gap-2">
                {penalty.status === 'emergency_exempt' && <span>긴급자동차 면제</span>}
                {penalty.status === 'normal' && <span>정상 주행 (단속 기준 적합)</span>}
                {penalty.status === 'speeding' && (
                  <span>과속 적발 (+{penalty.overSpeed}km/h 초과)</span>
                )}
                {penalty.status === 'extreme_speeding' && (
                  <span>초과속 형사입건 대상 (+{penalty.overSpeed}km/h)</span>
                )}
              </div>
              <p className="text-xs leading-relaxed opacity-90">{penalty.legalNotice}</p>
            </div>
          </div>

          {/* Fine & Demerit Points Table */}
          {penalty.fineWon > 0 || penalty.demeritPoints > 0 ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>과태료 부과액:</span>
                <span className="font-mono font-bold text-red-600 text-sm tabular-nums">
                  {penalty.fineWon.toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>범칙금 (직접 운전자 확인 시):</span>
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {penalty.penaltyWon.toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>운전면허 벌점:</span>
                <span className={`font-mono font-bold tabular-nums ${
                  penalty.demeritPoints >= 40 ? 'text-red-600' : 'text-slate-800'
                }`}>
                  {penalty.demeritPoints}점
                  {penalty.demeritPoints >= 40 && ' (면허 정지/취소 처분)'}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
