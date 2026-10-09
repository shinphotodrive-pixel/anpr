import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlateInfo, PlateType, VehicleType } from '../types/traffic';
import { LicensePlateBadge } from './LicensePlateBadge';
import { playCameraShutterSound } from '../utils/audio';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Zap,
  Image as ImageIcon,
  Edit3,
  Check,
  ZoomIn,
  Crop,
  Sliders,
  HelpCircle,
} from 'lucide-react';

interface RecognitionResult {
  detected: boolean;
  plateNumber: string;
  plateType: PlateType;
  vehicleType: string;
  vehicleColor: string;
  confidence: number;
  characters: { char: string; confidence: number }[];
  analysisNotes: string;
}

interface Props {
  onSendToSimulator: (plate: PlateInfo, vehicleTypeHint?: VehicleType) => void;
}

export const CameraScanner: React.FC<Props> = ({ onSendToSimulator }) => {
  // Mode: 'camera' | 'upload'
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [zoomLevel, setZoomLevel] = useState<number>(1.5); // Default 1.5x digital zoom for closer plate shots
  const [useFocusCrop, setUseFocusCrop] = useState<boolean>(true); // Crop to center guide box
  const [enhanceContrast, setEnhanceContrast] = useState<boolean>(true); // Auto-contrast enhancement
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourceTag, setSourceTag] = useState<string>('');

  // Manual plate number editing
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editablePlate, setEditablePlate] = useState<string>('');
  const [editableType, setEditableType] = useState<PlateType>('standard');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setErrorMessage(
        '카메라에 접근할 수 없습니다. 브라우저 카메라 권한을 확인하시거나 [사진 업로드 / 촬영] 버튼을 이용해주세요.'
      );
    }
  }, [facingMode]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Effect to manage camera based on activeMode
  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode, startCamera, stopCamera]);

  // Flip Camera (Front / Back)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Enhance contrast of canvas image before OCR
  const applyImageEnhancement = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const contrast = 1.25; // 25% contrast boost
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128; // R
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Ignore filter error on cross-origin
    }
  };

  // Process and send image to backend ANPR endpoint
  const analyzeImage = async (base64Data: string, mimeType = 'image/jpeg') => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResult(null);
    setIsEditing(false);

    try {
      const response = await fetch('/api/anpr/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      });

      const json = await response.json();

      if (json.success && json.data) {
        setResult(json.data);
        setEditablePlate(json.data.plateNumber || '');
        setEditableType((json.data.plateType as PlateType) || 'standard');
        setSourceTag(json.source === 'gemini-vision' ? 'Gemini 3.8 Flash Vision AI' : '고속 ANPR 비전 엔진');
      } else {
        setErrorMessage(json.error || '번호판을 인식하지 못했습니다. 아래 팁을 확인하거나 직접 번호를 입력해주세요.');
      }
    } catch (err) {
      console.error('Recognition request error:', err);
      setErrorMessage('서버 인식 처리 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Capture Photo from Camera Viewfinder with Digital Zoom & Focus Crop
  const capturePhoto = () => {
    if (!videoRef.current) return;

    playCameraShutterSound();

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    // Apply digital zoom calculation
    // Calculate source crop rectangle
    const cropWidth = vWidth / zoomLevel;
    const cropHeight = vHeight / zoomLevel;
    const cropX = (vWidth - cropWidth) / 2;
    const cropY = (vHeight - cropHeight) / 2;

    if (useFocusCrop) {
      // Focus Crop: specifically extract the center 65% horizontal x 35% vertical bounding box
      const targetW = cropWidth * 0.7;
      const targetH = cropHeight * 0.38;
      const targetX = cropX + (cropWidth - targetW) / 2;
      const targetY = cropY + (cropHeight - targetH) / 2;

      canvas.width = 960;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, targetX, targetY, targetW, targetH, 0, 0, canvas.width, canvas.height);
        if (enhanceContrast) {
          applyImageEnhancement(canvas);
        }
      }
    } else {
      // Standard full zoomed frame
      canvas.width = Math.min(1600, cropWidth);
      canvas.height = Math.min(900, cropHeight);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        if (enhanceContrast) {
          applyImageEnhancement(canvas);
        }
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    analyzeImage(dataUrl, 'image/jpeg');
  };

  // Handle Photo File Upload with Auto-Resizing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playCameraShutterSound();

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        // Max dimension 1400px for optimal speed and sharpness
        let width = img.width;
        let height = img.height;
        const maxDim = 1400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          if (enhanceContrast) {
            applyImageEnhancement(canvas);
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setCapturedImage(dataUrl);
          analyzeImage(dataUrl, 'image/jpeg');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Preset Samples for quick 1-click test
  const loadPresetSample = (type: 'standard' | 'ev' | 'commercial' | 'school') => {
    playCameraShutterSound();
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background & car bumper
    ctx.fillStyle = type === 'ev' ? '#0f172a' : '#1e293b';
    ctx.fillRect(0, 0, 640, 360);

    ctx.fillStyle = type === 'ev' ? '#1e3a8a' : type === 'commercial' ? '#334155' : '#475569';
    ctx.beginPath();
    ctx.roundRect(80, 80, 480, 200, [16]);
    ctx.fill();

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(120, 110, 400, 30);

    let plateText = '123가 4567';
    let plateBg = '#ffffff';
    let plateFg = '#0f172a';
    let isEv = false;

    if (type === 'ev') {
      plateText = '01우 8821';
      plateBg = '#bae6fd';
      plateFg = '#082f49';
      isEv = true;
    } else if (type === 'commercial') {
      plateText = '서울31바 1234';
      plateBg = '#fcd34d';
      plateFg = '#171717';
    } else if (type === 'school') {
      plateText = '358더 9021';
      plateBg = '#ffffff';
      plateFg = '#0f172a';
    }

    ctx.fillStyle = plateBg;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(170, 180, 300, 70, [6]);
    ctx.fill();
    ctx.stroke();

    if (isEv) {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(180, 192, 30, 46);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('EV', 186, 220);
    }

    ctx.fillStyle = plateFg;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plateText, 325, 216);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    analyzeImage(dataUrl, 'image/jpeg');
  };

  // Convert result to PlateInfo (prioritizing manual edit if present)
  const effectivePlateNumber = isEditing ? editablePlate : result?.plateNumber || editablePlate;
  const effectivePlateType = isEditing ? editableType : (result?.plateType as PlateType) || editableType;

  const detectedPlateInfo: PlateInfo | null = effectivePlateNumber.trim()
    ? {
        number: effectivePlateNumber.trim(),
        type: effectivePlateType,
        vehicleCategoryText: result?.vehicleType || '식별된 차량',
      }
    : null;

  // Send to Road Simulator
  const handleTransferToSimulator = () => {
    if (!detectedPlateInfo) return;
    let mappedType: VehicleType = 'sedan';
    if (detectedPlateInfo.type === 'ev') mappedType = 'ev';
    else if (detectedPlateInfo.type === 'commercial') mappedType = 'bus';
    else if (result?.vehicleType.includes('SUV')) mappedType = 'suv';
    else if (result?.vehicleType.includes('트럭')) mappedType = 'truck';

    onSendToSimulator(detectedPlateInfo, mappedType);
  };

  // Apply manual plate edits
  const handleSaveManualEdit = () => {
    if (!editablePlate.trim()) return;
    setIsEditing(false);
    if (result) {
      setResult({
        ...result,
        plateNumber: editablePlate.trim(),
        plateType: editableType,
        characters: editablePlate.replace(/\s+/g, '').split('').map((c) => ({
          char: c,
          confidence: 100,
        })),
        analysisNotes: '사용자 직접 확인 및 번호판 수동 보정 완료',
      });
    } else {
      setResult({
        detected: true,
        plateNumber: editablePlate.trim(),
        plateType: editableType,
        vehicleType: '직접 지정 차량',
        vehicleColor: '화이트',
        confidence: 100,
        characters: editablePlate.replace(/\s+/g, '').split('').map((c) => ({
          char: c,
          confidence: 100,
        })),
        analysisNotes: '사용자 직접 등록 번호판',
      });
    }
    setErrorMessage(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>스마트폰 카메라 차량 번호판 실시간 인식기</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            스마트폰 카메라로 차량 번호판을 직접 촬영하거나 사진을 업로드하여 ANPR 비전 AI 인식률을 테스트합니다.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveMode('camera')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'camera'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>실시간 카메라</span>
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'upload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>사진 업로드</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Viewfinder on Left, Recognition Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewfinder / Upload Area (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeMode === 'camera' ? (
            <div className="relative w-full h-84 sm:h-96 bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              {/* HTML5 Video Element with CSS Zoom Transform */}
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    cameraActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>

              {/* Inactive Camera Overlay */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 text-slate-300 space-y-3 bg-slate-950/90">
                  <Camera className="w-10 h-10 text-slate-500 animate-pulse" />
                  <div className="text-sm font-semibold">카메라 대기 중</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    브라우저 카메라 접근 권한을 허용해주시거나 아래 버튼을 눌러주세요.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    카메라 다시 시작
                  </button>
                </div>
              )}

              {/* Viewfinder Target HUD Guide */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
                  {/* Bounding Box Frame */}
                  <div className="relative w-72 sm:w-80 h-28 sm:h-32 border-2 border-emerald-400/90 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)] bg-emerald-500/5 flex items-center justify-center">
                    {/* Corner Accent Brackets */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400" />

                    {/* Animated Scanning Laser Line */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

                    <div className="text-[11px] font-sans font-medium text-emerald-300/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      안내선 안에 번호판을 맞춰주세요
                    </div>
                  </div>

                  {/* Top HUD info */}
                  <div className="absolute top-3 inset-x-4 flex items-center justify-between text-[11px] font-mono text-white/80 bg-black/50 px-3 py-1 rounded-md backdrop-blur-xs pointer-events-auto">
                    <span>LIVE ANPR VIEW</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400">ZOOM: {zoomLevel}x</span>
                      {useFocusCrop && <span className="text-cyan-300">· CROP ON</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Zoom Controls on Top-Right of Viewfinder */}
              {cameraActive && (
                <div className="absolute top-12 right-4 flex flex-col gap-1 z-20">
                  {[1.0, 1.5, 2.0, 2.5].map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoomLevel(z)}
                      className={`px-2 py-1 text-[11px] font-bold font-mono rounded backdrop-blur-xs transition-all cursor-pointer ${
                        zoomLevel === z
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-black/60 text-white/80 hover:bg-black/80'
                      }`}
                      title={`${z}배 디지털 줌`}
                    >
                      {z}x
                    </button>
                  ))}
                </div>
              )}

              {/* Camera Shutter & Flip Controls Bar */}
              {cameraActive && (
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 z-20">
                  <button
                    onClick={toggleFacingMode}
                    className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-full border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                    title="전면/후면 카메라 전환"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  {/* Big Shutter Button */}
                  <button
                    onClick={capturePhoto}
                    disabled={isAnalyzing}
                    className="w-16 h-16 rounded-full bg-white border-4 border-blue-600 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    title="번호판 셔터 촬영"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </button>

                  <button
                    onClick={() => setUseFocusCrop(!useFocusCrop)}
                    className={`p-3 rounded-full border transition-all cursor-pointer backdrop-blur-xs ${
                      useFocusCrop
                        ? 'bg-blue-600/80 text-white border-blue-400'
                        : 'bg-black/60 text-white/80 border-white/20'
                    }`}
                    title={useFocusCrop ? '안내선 영역 정밀 크롭 켜짐' : '전체 화면 분석'}
                  >
                    <Crop className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Upload Photo Mode */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-84 sm:h-96 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 bg-white rounded-full border border-slate-200 group-hover:border-blue-400 shadow-xs flex items-center justify-center text-blue-600 mb-3 transition-transform group-hover:scale-105">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                스마트폰 사진 선택 또는 즉시 촬영
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-3">
                스마트폰에서 클릭 시 카메라 촬영 또는 갤러리 사진을 바로 선택할 수 있습니다. (JPG, PNG, WebP 지원)
              </p>
              <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-xs group-hover:bg-blue-700 transition-colors">
                사진 파일 선택하기
              </span>
            </div>
          )}

          {/* Camera Settings & Help Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useFocusCrop}
                  onChange={(e) => setUseFocusCrop(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>안내선 영역 집중 크롭 분석 (권장)</span>
              </label>

              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhanceContrast}
                  onChange={(e) => setEnhanceContrast(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>대비 및 선명도 자동 보정</span>
              </label>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>차량과 1~2m 거리에서 정면 촬영 시 가장 정확합니다</span>
            </div>
          </div>

          {/* Quick Preset Samples Row (for instant 1-click test) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>원클릭 번호판 샘플로 즉시 테스트하기</span>
              </span>
              <span className="text-[11px] text-slate-400">클릭 시 자동 분석</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => loadPresetSample('standard')}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800">123가 4567</div>
                <div className="text-[10px] text-slate-500">일반 신형 흰색판</div>
              </button>
              <button
                onClick={() => loadPresetSample('ev')}
                className="p-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-sky-900">01우 8821</div>
                <div className="text-[10px] text-sky-600">친환경 EV 청색판</div>
              </button>
              <button
                onClick={() => loadPresetSample('commercial')}
                className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-amber-900">서울31바 1234</div>
                <div className="text-[10px] text-amber-600">영업용 황색판</div>
              </button>
              <button
                onClick={() => loadPresetSample('school')}
                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-bold text-rose-900">358더 9021</div>
                <div className="text-[10px] text-rose-600">스쿨존 단속 차량</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Recognition Verdict & Transfer to Simulation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>번호판 인식 결과 및 검증</span>
            {sourceTag && (
              <span className="text-[10px] text-blue-600 font-mono font-medium">
                {sourceTag}
              </span>
            )}
          </div>

          {/* Captured Image Thumbnail if any */}
          {capturedImage && (
            <div className="relative w-full h-36 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
              <img
                src={capturedImage}
                alt="촬영된 번호판 스냅샷"
                className="w-full h-full object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                  <Zap className="w-6 h-6 text-emerald-400 animate-spin" />
                  <span className="text-xs font-semibold font-mono tracking-wider">
                    AI VISION ANPR 정밀 분석 중...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message with Troubleshooting and Manual Input Form */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-rose-950 text-xs">
              <div className="flex items-start gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <div className="text-[11px] text-rose-700 space-y-1 pl-6">
                <div>· 줌 버튼(1.5x, 2x)을 눌러 번호판이 화면에 크게 나오게 해주세요.</div>
                <div>· 번호판에 그림자나 강한 반사광이 없도록 각도를 조절해보세요.</div>
              </div>
              <button
                onClick={() => {
                  setIsEditing(true);
                  if (!editablePlate) setEditablePlate('123가 4567');
                }}
                className="w-full mt-2 py-1.5 px-3 bg-white hover:bg-slate-50 border border-rose-300 rounded text-rose-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>직접 번호판 번호 입력하기</span>
              </button>
            </div>
          )}

          {/* Empty State before any photo */}
          {!result && !isAnalyzing && !errorMessage && !isEditing && (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">번호판 분석 대기</div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  스마트폰 카메라로 차량 번호판을 정면에서 촬영하면 실시간 OCR 신경망 판독이 실행됩니다.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditablePlate('123가 4567');
                }}
                className="py-1 px-2.5 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                테스트할 번호판 직접 입력하기
              </button>
            </div>
          )}

          {/* Manual Editing Form (if user wants to fix or manually type a plate) */}
          {isEditing && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between font-semibold text-blue-900">
                <span>차량 번호판 직접 수정 및 확인</span>
                <span className="text-[10px] text-blue-600">한국 자동차 번호판</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">번호판 번호 (예: 123가 4567)</label>
                  <input
                    type="text"
                    value={editablePlate}
                    onChange={(e) => setEditablePlate(e.target.value)}
                    placeholder="예: 123가 4567"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-sm font-bold tracking-wider text-slate-900 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">번호판 종류</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'standard', label: '일반 흰색' },
                      { id: 'ev', label: '전기차(EV)' },
                      { id: 'commercial', label: '영업용 노란색' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setEditableType(t.id as PlateType)}
                        className={`py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                          editableType === t.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveManualEdit}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>수정 완료</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* Detected Plate Result Display */}
          {result && detectedPlateInfo && !isEditing && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Badge Display with Edit Button */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2 relative">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditablePlate(detectedPlateInfo.number);
                    setEditableType(detectedPlateInfo.type);
                  }}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  title="인식된 번호 직접 수정"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>수정</span>
                </button>

                <span className="text-xs text-slate-500 font-medium">인식된 한국 자동차 번호판</span>
                <LicensePlateBadge plate={detectedPlateInfo} size="lg" />
                <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                  <span>차종: {result.vehicleType}</span>
                  <span>·</span>
                  <span>색상: {result.vehicleColor}</span>
                </div>
              </div>

              {/* Confidence & Score Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block mb-0.5">인식 종합 신뢰도</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-xl font-bold text-emerald-600 tabular-nums">
                      {result.confidence.toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-[11px]">%</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block mb-0.5">검출 상태</span>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>정상 판독 완료</span>
                  </div>
                </div>
              </div>

              {/* Individual Character Breakdown */}
              {result.characters && result.characters.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">
                      개별 글자 신경망 판독률
                    </span>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditablePlate(detectedPlateInfo.number);
                      }}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                    >
                      오인식 수정
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {result.characters.map((c, i) => (
                      <div
                        key={i}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-center shrink-0 min-w-8"
                      >
                        <div className="font-mono font-bold text-xs text-slate-900">{c.char}</div>
                        <div className="text-[9px] font-mono text-slate-500 tabular-nums">
                          {c.confidence.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Notes */}
              {result.analysisNotes && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                  <span className="font-semibold block mb-0.5">비전 판독 코멘트</span>
                  {result.analysisNotes}
                </div>
              )}

              {/* Primary Action: Send to Road Simulator to test speeding enforcement */}
              <button
                onClick={handleTransferToSimulator}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>이 번호판으로 도로 시뮬레이터 과속 단속 테스트</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
