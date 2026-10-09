import React, { useState } from 'react';
import { DetectionRecord } from '../types/traffic';
import { LicensePlateBadge } from './LicensePlateBadge';
import { Download, Trash2, Search } from 'lucide-react';

interface Props {
  records: DetectionRecord[];
  onClearRecords: () => void;
  onSelectRecord: (record: DetectionRecord) => void;
}

export const DetectionLogTable: React.FC<Props> = ({
  records,
  onClearRecords,
  onSelectRecord,
}) => {
  const [filter, setFilter] = useState<'all' | 'speeding' | 'normal' | 'emergency'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredRecords = records.filter((rec) => {
    // Search query match
    if (searchQuery.trim() && !rec.plate.number.includes(searchQuery.trim())) {
      return false;
    }

    if (filter === 'speeding') {
      return rec.penalty.status === 'speeding' || rec.penalty.status === 'extreme_speeding';
    }
    if (filter === 'normal') {
      return rec.penalty.status === 'normal';
    }
    if (filter === 'emergency') {
      return rec.penalty.status === 'emergency_exempt';
    }
    return true;
  });

  // Export to CSV function
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      '일시',
      '차량번호',
      '차종',
      '측정속도(km/h)',
      '제한속도(km/h)',
      '초과속도(km/h)',
      '단속구역',
      '과태료(원)',
      '벌점',
      '처분내용',
    ];

    const rows = records.map((r) => [
      `"${r.timestamp}"`,
      `"${r.plate.number}"`,
      `"${r.plate.vehicleCategoryText}"`,
      r.measuredSpeed,
      r.speedLimit,
      r.penalty.overSpeed,
      `"${r.zoneName}"`,
      r.penalty.fineWon,
      r.penalty.demeritPoints,
      `"${r.penalty.legalNotice.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ANPR_과속단속대장_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Filter and Actions Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
        {/* Left: Filter Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 ({records.length})
            </button>
            <button
              onClick={() => setFilter('speeding')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'speeding'
                  ? 'bg-white text-red-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              과속 적발 (
              {
                records.filter(
                  (r) =>
                    r.penalty.status === 'speeding' ||
                    r.penalty.status === 'extreme_speeding'
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilter('normal')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'normal'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              정상 통과
            </button>
            <button
              onClick={() => setFilter('emergency')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'emergency'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              긴급 면제
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="차량번호 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono focus:outline-blue-500 w-36 sm:w-44"
            />
          </div>
        </div>

        {/* Right: CSV & Clear buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 저장</span>
          </button>
          <button
            onClick={onClearRecords}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>기록 초기화</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[460px]">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            {records.length === 0
              ? '단속 기록이 없습니다. 차량을 통과시켜주세요.'
              : '조건에 해당하는 단속 기록이 없습니다.'}
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4">통과 시각</th>
                <th className="py-2.5 px-4">인식 번호판</th>
                <th className="py-2.5 px-4">차종 및 차로</th>
                <th className="py-2.5 px-4 text-right">측정 속도</th>
                <th className="py-2.5 px-4 text-right">제한 속도</th>
                <th className="py-2.5 px-4 text-right">초과 속도</th>
                <th className="py-2.5 px-4">단속 판정</th>
                <th className="py-2.5 px-4 text-right">과태료 / 벌점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => {
                const isSpeeding =
                  r.penalty.status === 'speeding' || r.penalty.status === 'extreme_speeding';

                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                      {r.timestamp}
                    </td>

                    {/* License Plate Badge */}
                    <td className="py-3 px-4">
                      <LicensePlateBadge plate={r.plate} size="sm" />
                    </td>

                    {/* Vehicle Type & Lane */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{r.plate.vehicleCategoryText}</div>
                      <div className="text-[11px] text-slate-400">
                        {r.lane}차로 · {r.zoneName}
                      </div>
                    </td>

                    {/* Measured Speed */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm tabular-nums">
                      <span className={isSpeeding ? 'text-red-600' : 'text-slate-800'}>
                        {r.measuredSpeed}
                      </span>{' '}
                      <span className="text-[10px] text-slate-400 font-normal">km/h</span>
                    </td>

                    {/* Speed Limit */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {r.speedLimit}{' '}
                      <span className="text-[10px] text-slate-400">km/h</span>
                    </td>

                    {/* Over Speed */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {r.penalty.overSpeed > 0 ? (
                        <span className="font-bold text-red-600">
                          +{r.penalty.overSpeed} km/h
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {r.penalty.status === 'emergency_exempt' && (
                        <span className="text-blue-600 font-medium">긴급 면제</span>
                      )}
                      {r.penalty.status === 'normal' && (
                        <span className="text-emerald-700 font-medium">정상 통과</span>
                      )}
                      {r.penalty.status === 'speeding' && (
                        <span className="text-red-600 font-semibold">과속 적발</span>
                      )}
                      {r.penalty.status === 'extreme_speeding' && (
                        <span className="text-rose-700 font-bold">초과속(형사)</span>
                      )}
                    </td>

                    {/* Fine / Demerit */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {r.penalty.fineWon > 0 ? (
                        <div>
                          <div className="font-semibold text-slate-900">
                            {r.penalty.fineWon.toLocaleString('ko-KR')}원
                          </div>
                          {r.penalty.demeritPoints > 0 && (
                            <div className="text-[11px] text-red-600">
                              벌점 {r.penalty.demeritPoints}점
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">0원</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
