import React from 'react';
import { Volume2, VolumeX, BookOpen, RotateCcw } from 'lucide-react';

interface Props {
  activeTab: 'simulation' | 'camera' | 'inspector' | 'logs' | 'guide';
  setActiveTab: (tab: 'simulation' | 'camera' | 'inspector' | 'logs' | 'guide') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetSimulation: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  onToggleSound,
  onResetSimulation,
  onOpenGuide,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              스마트 ANPR 단속관제 시스템
            </span>
          </div>

          {/* Zone 2: 5 single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => {
                setActiveTab('simulation');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'simulation' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              도로 모니터링
            </button>
            <button
              onClick={() => {
                setActiveTab('camera');
                const el = document.getElementById('camera-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'camera' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              카메라 번호판 인식
            </button>
            <button
              onClick={() => {
                setActiveTab('inspector');
                const el = document.getElementById('inspector-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'inspector' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              ANPR 비전 파이프라인
            </button>
            <button
              onClick={() => {
                setActiveTab('logs');
                const el = document.getElementById('logs-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'logs' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              단속 기록 및 통계
            </button>
            <button
              onClick={onOpenGuide}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>단속 법령 가이드</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action area */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleSound}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
              aria-label="효과음 토글"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onResetSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
