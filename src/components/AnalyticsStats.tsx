import React from 'react';
import { DetectionRecord } from '../types/traffic';
import { Car, AlertTriangle, Percent, DollarSign, Gauge } from 'lucide-react';

interface Props {
  records: DetectionRecord[];
}

export const AnalyticsStats: React.FC<Props> = ({ records }) => {
  const totalCount = records.length;
  const violationCount = records.filter(
    (r) => r.penalty.status === 'speeding' || r.penalty.status === 'extreme_speeding'
  ).length;

  const violationRate = totalCount > 0 ? (violationCount / totalCount) * 100 : 0;

  const totalFines = records.reduce((acc, curr) => acc + curr.penalty.fineWon, 0);

  const avgSpeed =
    totalCount > 0
      ? records.reduce((acc, curr) => acc + curr.measuredSpeed, 0) / totalCount
      : 0;

  const maxSpeed =
    totalCount > 0 ? Math.max(...records.map((r) => r.measuredSpeed)) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Total Vehicles */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <Car className="w-3.5 h-3.5 text-slate-400" />
          <span>총 통과 차량</span>
        </div>
        <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
          {totalCount.toLocaleString('ko-KR')}
          <span className="text-xs font-normal text-slate-400 ml-1">대</span>
        </div>
      </div>

      {/* 2. Violations */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span>과속 적발 건수</span>
        </div>
        <div className="font-mono text-2xl font-bold text-red-600 tabular-nums">
          {violationCount.toLocaleString('ko-KR')}
          <span className="text-xs font-normal text-slate-400 ml-1">건</span>
        </div>
      </div>

      {/* 3. Violation Rate */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <Percent className="w-3.5 h-3.5 text-amber-500" />
          <span>과속 적발률</span>
        </div>
        <div className="font-mono text-2xl font-bold text-amber-600 tabular-nums">
          {violationRate.toFixed(1)}
          <span className="text-xs font-normal text-slate-400 ml-1">%</span>
        </div>
      </div>

      {/* 4. Total Fines */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>부과 과태료 총액</span>
        </div>
        <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums truncate">
          {totalFines.toLocaleString('ko-KR')}
          <span className="text-xs font-normal text-slate-400 ml-1">원</span>
        </div>
      </div>

      {/* 5. Speed Stats */}
      <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <Gauge className="w-3.5 h-3.5 text-blue-500" />
          <span>평균 / 최고 속도</span>
        </div>
        <div className="font-mono text-lg font-bold text-slate-800 tabular-nums flex items-baseline gap-2">
          <span>{avgSpeed > 0 ? avgSpeed.toFixed(0) : '0'}</span>
          <span className="text-xs font-normal text-slate-400">/</span>
          <span className="text-red-600">{maxSpeed > 0 ? maxSpeed : '0'}</span>
          <span className="text-xs font-normal text-slate-400">km/h</span>
        </div>
      </div>
    </div>
  );
};
