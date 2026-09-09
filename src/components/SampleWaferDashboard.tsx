import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  CircleDot,
  Layers,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Cpu,
  HelpCircle,
  Download,
  Filter,
  Sparkles,
  FileCode,
  Check,
  Copy,
  ArrowRight,
  Activity,
  Sliders,
  Maximize2,
  X,
  Grid,
} from 'lucide-react';
import { SampleDataset } from '../types';

export interface WaferDefectItem {
  waferId: string;
  shotId: string;
  dieX: number;
  dieY: number;
  posX: number;
  posY: number;
  radius: number;
  defectClass: string;
  defectSubclass: string;
  defectSize: number;
  clusterType: string;
  dieBinStatus: 'PASS' | 'FAIL';
}

export interface DieCellData {
  dieX: number;
  dieY: number;
  cx: number;
  cy: number;
  defects: WaferDefectItem[];
  failCount: number;
  passCount: number;
  isFail: boolean;
  isPassWithParticle: boolean;
  isGood: boolean;
}

interface SampleWaferDashboardProps {
  dataset?: SampleDataset;
  onClose?: () => void;
  onNavigateToSubmit?: () => void;
  isEmbedded?: boolean;
}

const CLASS_COLORS: Record<string, { fill: string; stroke: string; label: string; bg: string }> = {
  Scratch: { fill: '#f43f5e', stroke: '#fda4af', label: 'Scratch (스크래치)', bg: 'bg-rose-950/70 border-rose-700 text-rose-300' },
  RingDefect: { fill: '#f59e0b', stroke: '#fde68a', label: 'RingDefect (동심원 링)', bg: 'bg-amber-950/70 border-amber-700 text-amber-300' },
  Bridge: { fill: '#a855f7', stroke: '#d8b4fe', label: 'Bridge (패턴 브릿지)', bg: 'bg-purple-950/70 border-purple-700 text-purple-300' },
  EdgeExclusion: { fill: '#ef4444', stroke: '#fca5a5', label: 'EdgeExclusion (에지 결함)', bg: 'bg-red-950/70 border-red-700 text-red-300' },
  Void: { fill: '#06b6d4', stroke: '#a5f3fc', label: 'Void (비아 보이드)', bg: 'bg-cyan-950/70 border-cyan-700 text-cyan-300' },
  Particle: { fill: '#3b82f6', stroke: '#93c5fd', label: 'Particle (파티클)', bg: 'bg-blue-950/70 border-blue-700 text-blue-300' },
};

export const SampleWaferDashboard: React.FC<SampleWaferDashboardProps> = ({
  dataset,
  onClose,
  onNavigateToSubmit,
  isEmbedded = false,
}) => {
  // Selected Wafer Filter
  const [selectedWafer, setSelectedWafer] = useState<string>('ALL');
  // Selected Defect Class Filter
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  // Selected Cluster Filter
  const [selectedClusterOnly, setSelectedClusterOnly] = useState<boolean>(false);
  // Highlighted defect & die
  const [hoveredDefect, setHoveredDefect] = useState<WaferDefectItem | null>(null);
  const [pinnedDefect, setPinnedDefect] = useState<WaferDefectItem | null>(null);
  const [selectedDie, setSelectedDie] = useState<DieCellData | null>(null);
  const [hoveredDie, setHoveredDie] = useState<DieCellData | null>(null);

  // View toggle for guideline layers - Die grid prioritized over concentric rings
  const [showDieGrid, setShowDieGrid] = useState<boolean>(true);
  const [showDieBinTint, setShowDieBinTint] = useState<boolean>(true);
  const [showRings, setShowRings] = useState<boolean>(false);
  const [showEdgeExclusion, setShowEdgeExclusion] = useState<boolean>(true);
  const [showClusterHulls, setShowClusterHulls] = useState<boolean>(true);
  // Copy prompt state
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  // Guide tab state
  const [activeGuideTab, setActiveGuideTab] = useState<'architecture' | 'prompts' | 'python_code'>('architecture');

  // Parse CSV records from dataset or fallback
  const rawCsv = dataset?.csvContent || '';

  const parsedDefects: WaferDefectItem[] = useMemo(() => {
    if (!rawCsv) return [];
    const lines = rawCsv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim());
    const items: WaferDefectItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < header.length) continue;

      const record: any = {};
      header.forEach((key, idx) => {
        record[key] = parts[idx];
      });

      items.push({
        waferId: record.wafer_id || `WFR-${i}`,
        shotId: record.shot_id || 'S_00',
        dieX: parseFloat(record.die_x) || 0,
        dieY: parseFloat(record.die_y) || 0,
        posX: parseFloat(record.pos_x_mm) || 0,
        posY: parseFloat(record.pos_y_mm) || 0,
        radius: parseFloat(record.radius_mm) || 0,
        defectClass: record.defect_class || 'Particle',
        defectSubclass: record.defect_subclass || 'Unknown',
        defectSize: parseFloat(record.defect_size_um) || 1.0,
        clusterType: record.cluster_type || 'RANDOM',
        dieBinStatus: record.die_bin_status === 'FAIL' ? 'FAIL' : 'PASS',
      });
    }
    return items;
  }, [rawCsv]);

  // Unique wafer IDs
  const waferIds = useMemo(() => {
    const set = new Set(parsedDefects.map((d) => d.waferId));
    return Array.from(set);
  }, [parsedDefects]);

  // Unique defect classes
  const defectClasses = useMemo(() => {
    const set = new Set(parsedDefects.map((d) => d.defectClass));
    return Array.from(set);
  }, [parsedDefects]);

  // Filtered defects based on controls
  const filteredDefects = useMemo(() => {
    return parsedDefects.filter((d) => {
      if (selectedWafer !== 'ALL' && d.waferId !== selectedWafer) return false;
      if (selectedClass !== 'ALL' && d.defectClass !== selectedClass) return false;
      if (selectedClusterOnly && d.clusterType === 'RANDOM') return false;
      return true;
    });
  }, [parsedDefects, selectedWafer, selectedClass, selectedClusterOnly]);

  // Generate full 300mm active die array (14mm x 14mm pitch, within R=145.5mm active wafer area)
  const diePitch = 14.0;
  const activeDice: DieCellData[] = useMemo(() => {
    const diceMap = new Map<string, WaferDefectItem[]>();
    filteredDefects.forEach((d) => {
      const key = `${Math.round(d.dieX)},${Math.round(d.dieY)}`;
      if (!diceMap.has(key)) diceMap.set(key, []);
      diceMap.get(key)!.push(d);
    });

    const list: DieCellData[] = [];
    const maxIdx = 10;
    for (let dx = -maxIdx; dx <= maxIdx; dx++) {
      for (let dy = -maxIdx; dy <= maxIdx; dy++) {
        const cx = dx * diePitch;
        const cy = dy * diePitch;
        const dist = Math.sqrt(cx * cx + cy * cy);
        // Valid die within wafer active radius (145.5mm on a 300mm wafer with 3mm edge bead exclusion)
        if (dist <= 145.5) {
          const defects = diceMap.get(`${dx},${dy}`) || [];
          const failCount = defects.filter((d) => d.dieBinStatus === 'FAIL').length;
          const passCount = defects.filter((d) => d.dieBinStatus === 'PASS').length;
          list.push({
            dieX: dx,
            dieY: dy,
            cx,
            cy,
            defects,
            failCount,
            passCount,
            isFail: failCount > 0,
            isPassWithParticle: failCount === 0 && passCount > 0,
            isGood: defects.length === 0,
          });
        }
      }
    }
    return list;
  }, [filteredDefects]);

  // Metric calculations based on real die grid
  const totalActiveDice = activeDice.length || 336;
  const failedDiceCount = activeDice.filter((d) => d.isFail).length;
  const goodDiceCount = totalActiveDice - failedDiceCount;
  const yieldRate = Math.max(0, ((goodDiceCount / totalActiveDice) * 100)).toFixed(1);
  const clusterDefectsCount = filteredDefects.filter((d) => d.clusterType !== 'RANDOM').length;
  const clusterRatio = filteredDefects.length > 0 ? ((clusterDefectsCount / filteredDefects.length) * 100).toFixed(1) : '0.0';
  const waferAreaCm2 = Math.PI * 15 * 15; // 300mm wafer area in cm2 ~ 706.86 cm2
  const defectDensity = (filteredDefects.length / waferAreaCm2).toFixed(3);

  // Pareto Chart Data
  const paretoData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDefects.forEach((d) => {
      counts[d.defectClass] = (counts[d.defectClass] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const total = filteredDefects.length || 1;
    let accumulated = 0;

    return sorted.map((item) => {
      accumulated += item.count;
      return {
        name: item.name,
        count: item.count,
        cumulativePct: Math.round((accumulated / total) * 100),
      };
    });
  }, [filteredDefects]);

  // Zone Distribution Data (Center <50mm, Mid 50-100mm, Edge >100mm)
  const zoneData = useMemo(() => {
    const center = { name: 'Center (0~50mm)', count: 0, failCount: 0, avgSize: 0, totalSize: 0 };
    const mid = { name: 'Mid (50~100mm)', count: 0, failCount: 0, avgSize: 0, totalSize: 0 };
    const edge = { name: 'Edge (100~150mm)', count: 0, failCount: 0, avgSize: 0, totalSize: 0 };

    filteredDefects.forEach((d) => {
      let target = edge;
      if (d.radius < 50) target = center;
      else if (d.radius < 100) target = mid;

      target.count += 1;
      target.totalSize += d.defectSize;
      if (d.dieBinStatus === 'FAIL') target.failCount += 1;
    });

    [center, mid, edge].forEach((z) => {
      z.avgSize = z.count > 0 ? parseFloat((z.totalSize / z.count).toFixed(2)) : 0;
    });

    return [center, mid, edge];
  }, [filteredDefects]);

  // Handle Copy LLM Prompt for Students
  const handleCopyPrompt = () => {
    const promptText = `반도체 300mm 웨이퍼 결함 분석 대시보드를 생성하고 싶어.
제공된 CSV(wafer_id, die_x, die_y, pos_x_mm, pos_y_mm, radius_mm, defect_class, defect_size_um, cluster_type, die_bin_status)를 기반으로:
1. 웨이퍼 2D 원형 맵(R=150mm, 노치, 개별 다이 경계 격자 14×14mm 테두리 표시, FAIL 불량 다이 Bin 채색, 미세 동심원 가이드라인) 시각화
2. 파레토(Pareto) 불량 유형별 발생 빈도 및 누적 점유율(%) 콤보 차트
3. 반경 영역별(Center, Mid, Edge) 불량 밀도 분석
4. 다이 수율(Die Yield %), 결함 밀도(D0 ≈ 0.51 defects/cm² 공정 이상 경보), 클러스터 결함 비중 KPI 카드 4종
5. CMP 슬러리 스크래치, 열응력 링 결함에 대한 엔지니어링 개선 권고사항
위 요구사항을 충족하는 완전한 대시보드 코드를 작성해줘.`;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Download raw CSV
  const handleDownloadCsv = () => {
    if (!dataset?.csvContent) return;
    const blob = new Blob(['\uFEFF' + dataset.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dataset.fileName || 'wafer_300mm_defect_map_clusters.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeDefect = hoveredDefect || pinnedDefect;

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800'}`}>
      {/* Top Banner: Reference Dashboard Indicator */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-emerald-950/80 border border-indigo-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>학생 제출 참고용 표준 대시보드 예시 (Benchmark Live Demo)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>300mm 웨이퍼 결함 맵 & 수율 클러스터 분석 대시보드</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                LIVE DEMO
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              제공된 <span className="text-indigo-300 font-mono font-semibold">wafer_300mm_defect_map_clusters.csv</span> 데이터셋을 분석하여
              구축된 <strong>최종 결과물 표준 대시보드 예시</strong>입니다. 각 팀은 최종 과제 제출 시 본 대시보드의
              <strong> 4대 핵심 구성(핵심 KPI, 2D 공간 맵, 파레토 분석, LLM 공정 개선 제언)</strong>을 벤치마킹하여 구현할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="원본 CSV 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>데이터셋 CSV</span>
            </button>

            <button
              onClick={handleCopyPrompt}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
              title="대시보드 구현을 위한 LLM 프롬프트 복사"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>프롬프트 복사완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-200" />
                  <span>LLM 프롬프트 복사</span>
                </>
              )}
            </button>

            {onNavigateToSubmit && (
              <button
                onClick={onNavigateToSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
              >
                <span>과제 제출하러 가기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>웨이퍼 선택:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedWafer('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedWafer === 'ALL'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              전체 통합 ({parsedDefects.length}건)
            </button>
            {waferIds.map((wid) => (
              <button
                key={wid}
                onClick={() => setSelectedWafer(wid)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedWafer === wid
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {wid}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Defect Class Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <span>불량 유형:</span>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">전체 불량 ({parsedDefects.length}건)</option>
            {defectClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls} ({parsedDefects.filter((d) => d.defectClass === cls).length}건)
              </option>
            ))}
          </select>

          {/* Cluster filter checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700">
            <input
              type="checkbox"
              checked={selectedClusterOnly}
              onChange={(e) => setSelectedClusterOnly(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>클러스터 불량만 보기</span>
          </label>
        </div>

        {/* Layer View Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] text-slate-500 font-mono">MAP LAYERS:</span>
          <button
            onClick={() => setShowDieGrid(!showDieGrid)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              showDieGrid
                ? 'bg-indigo-950 text-indigo-300 border-indigo-600 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="개별 실리콘 칩 다이 경계 격자 표시"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>다이 경계 격자 (Die Grid)</span>
          </button>
          <button
            onClick={() => setShowDieBinTint(!showDieBinTint)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
              showDieBinTint
                ? 'bg-rose-950/80 text-rose-300 border-rose-700 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="불량 다이(FAIL) 및 양품 다이(PASS) 컬러 채색"
          >
            불량 다이 Bin 채색
          </button>
          <button
            onClick={() => setShowRings(!showRings)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showRings
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="동심원 반경 가이드 라인 (50/100mm)"
          >
            동심원 링 (50/100mm)
          </button>
          <button
            onClick={() => setShowEdgeExclusion(!showEdgeExclusion)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showEdgeExclusion
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="웨이퍼 최외곽 3mm 베벨 배제 영역"
          >
            에지 배제선 (3mm)
          </button>
        </div>
      </div>

      {/* 4 Key Executive Semiconductor Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Die Yield % */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">실리콘 다이 수율 (Die Yield)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{yieldRate}%</span>
            <span className="text-xs text-slate-400 font-mono">
              ({goodDiceCount} / {totalActiveDice} Die)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${yieldRate}%` }} />
          </div>
          <p className="text-[11px] text-slate-400">
            목표 수율 95.0% 대비 <span className="text-rose-400 font-semibold">▲{Math.abs(95 - parseFloat(yieldRate)).toFixed(1)}% Drop</span>
          </p>
        </div>

        {/* KPI 2: Total Defect Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">총 검출 결함 수 (Total Defects)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{filteredDefects.length}</span>
            <span className="text-xs text-slate-400">EA</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>FAIL 불량 다이:</span>
            <span className="text-rose-300 font-bold">{failedDiceCount} Die</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            비치명 양품 파티클: {filteredDefects.length - filteredDefects.filter((d) => d.dieBinStatus === 'FAIL').length} EA
          </p>
        </div>

        {/* KPI 3: Cluster Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">클러스터 결함 비중 (Cluster %)</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{clusterRatio}%</span>
            <span className="text-xs text-slate-400">({clusterDefectsCount} / {filteredDefects.length})</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${clusterRatio}%` }} />
          </div>
          <p className="text-[11px] text-amber-300/80">
            체계적(Systematic) 스크래치 & 환상 결함
          </p>
        </div>

        {/* KPI 4: Defect Density (D0) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">결함 밀도 (Defect Density D0)</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">{defectDensity}</span>
            <span className="text-xs text-slate-400">defects/cm²</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>300mm 표준 한계:</span>
            <span className="text-slate-300 font-mono">&lt; 0.050 D0</span>
          </div>
          <p className="text-[11px] text-rose-400 font-semibold">
            ⚠️ 관리선(0.05) 10배 초과 (Excursion 발생)
          </p>
        </div>
      </div>

      {/* Main Analysis Section: 2D Wafer Map Visualizer + Defect Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive 2D Circular Wafer Map */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative shadow-xl">
          <div className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">300mm 웨이퍼 다이 맵 (Prominent Die Boundary Grid)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              다이 크기 14×14mm | 총 {totalActiveDice} Die | 하단 노치
            </span>
          </div>

          {/* SVG Canvas for 300mm Wafer */}
          <div className="w-full max-w-[460px] aspect-square relative flex items-center justify-center bg-slate-950/60 rounded-2xl p-2 border border-slate-800/80">
            <svg
              viewBox="-170 -170 340 340"
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))' }}
            >
              <defs>
                {/* Silicon Wafer Gradient */}
                <radialGradient id="waferGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="70%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
                {/* Edge exclusion hatch */}
                <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.15" />
                </pattern>
              </defs>

              {/* 1. Wafer Outer Shadow Ring */}
              <circle cx="0" cy="0" r="153" fill="none" stroke="#334155" strokeWidth="2" strokeOpacity="0.4" />

              {/* 2. Silicon Wafer Main Disk (R = 150mm) */}
              <circle
                cx="0"
                cy="0"
                r="150"
                fill="url(#waferGrad)"
                stroke="#64748b"
                strokeWidth="2.5"
              />

              {/* 3. Wafer Notch (standard notch at bottom y=150) */}
              <path
                d="M -6 150 A 6 6 0 0 0 6 150 Z"
                fill="#020617"
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
              <text x="0" y="162" fill="#64748b" fontSize="7" textAnchor="middle" fontFamily="monospace">
                NOTCH
              </text>

              {/* 4. Active Die Grid Layer - Prominent Die Boundaries */}
              {showDieGrid && (
                <g id="die-grid-layer">
                  {activeDice.map((die) => {
                    const isSelected = selectedDie?.dieX === die.dieX && selectedDie?.dieY === die.dieY;
                    const isHovered = hoveredDie?.dieX === die.dieX && hoveredDie?.dieY === die.dieY;

                    // Base colors
                    let fill = 'rgba(15, 23, 42, 0.6)';
                    let stroke = '#475569';
                    let strokeWidth = 0.8;

                    if (showDieBinTint) {
                      if (die.isFail) {
                        fill = 'rgba(239, 68, 68, 0.32)';
                        stroke = 'rgba(244, 63, 94, 0.85)';
                        strokeWidth = 1.0;
                      } else if (die.isPassWithParticle) {
                        fill = 'rgba(59, 130, 246, 0.16)';
                        stroke = 'rgba(96, 165, 250, 0.65)';
                        strokeWidth = 0.8;
                      } else {
                        fill = 'rgba(15, 23, 42, 0.65)';
                        stroke = 'rgba(71, 85, 105, 0.55)';
                        strokeWidth = 0.6;
                      }
                    }

                    if (isSelected) {
                      stroke = '#f59e0b';
                      strokeWidth = 2.2;
                      fill = 'rgba(245, 158, 11, 0.28)';
                    } else if (isHovered) {
                      stroke = '#38bdf8';
                      strokeWidth = 1.8;
                      fill = 'rgba(56, 189, 248, 0.25)';
                    }

                    return (
                      <g
                        key={`die-${die.dieX}-${die.dieY}`}
                        className="cursor-pointer transition-colors"
                        onMouseEnter={() => setHoveredDie(die)}
                        onMouseLeave={() => setHoveredDie(null)}
                        onClick={() => setSelectedDie(isSelected ? null : die)}
                      >
                        <rect
                          x={die.cx - 7}
                          y={die.cy - 7}
                          width={14}
                          height={14}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                        />
                        {/* Center die coordinate marker */}
                        {die.dieX === 0 && die.dieY === 0 && (
                          <text
                            x={die.cx}
                            y={die.cy + 2}
                            fill="#64748b"
                            fontSize="5.5"
                            textAnchor="middle"
                            fontFamily="monospace"
                            pointerEvents="none"
                          >
                            (0,0)
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* 5. Radius Guideline Rings (Subtle, non-intrusive) */}
              {showRings && (
                <g id="concentric-rings" opacity={0.35}>
                  {/* Center Zone R = 50mm */}
                  <circle cx="0" cy="0" r="50" fill="none" stroke="#818cf8" strokeWidth="0.6" strokeDasharray="2 3" />
                  <text x="0" y="-52" fill="#818cf8" fontSize="5.5" textAnchor="middle" fontFamily="monospace">
                    R=50mm
                  </text>

                  {/* Mid Zone R = 100mm */}
                  <circle cx="0" cy="0" r="100" fill="none" stroke="#818cf8" strokeWidth="0.6" strokeDasharray="2 3" />
                  <text x="0" y="-102" fill="#818cf8" fontSize="5.5" textAnchor="middle" fontFamily="monospace">
                    R=100mm
                  </text>
                </g>
              )}

              {/* 6. Edge Exclusion Ring (3mm from edge => R = 147mm) */}
              {showEdgeExclusion && (
                <>
                  <circle cx="0" cy="0" r="147" fill="url(#hatch)" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.5" />
                  <text x="0" y="-140" fill="#f87171" fontSize="5.5" textAnchor="middle" fontFamily="monospace">
                    3mm EBR (R=147mm)
                  </text>
                </>
              )}

              {/* 7. Center Crosshairs */}
              <line x1="-15" y1="0" x2="15" y2="0" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.4" />
              <line x1="0" y1="-15" x2="0" y2="15" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.4" />

              {/* 8. Cluster connection accents (scratch and ring indicators) */}
              {showClusterHulls && (
                <>
                  {/* Outer Ring Cluster visualization */}
                  <circle cx="0" cy="0" r="114" fill="none" stroke="#f59e0b" strokeWidth="6" strokeOpacity="0.07" />
                  {/* Scratch cluster stroke */}
                  <line x1="-72" y1="108" x2="-60" y2="114" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.2" />
                </>
              )}

              {/* 9. Render Defect Dots with Tooltips & Hover States */}
              {filteredDefects.map((defect, idx) => {
                const conf = CLASS_COLORS[defect.defectClass] || { fill: '#ffffff', stroke: '#cbd5e1' };
                const isHovered = (hoveredDefect === defect) || (pinnedDefect === defect);
                // Size mapping: defect.defectSize in um mapped to SVG radius
                const dotRadius = Math.min(6.5, Math.max(2.4, 2.0 + defect.defectSize * 0.12));

                return (
                  <g
                    key={`${defect.waferId}-${idx}`}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredDefect(defect)}
                    onMouseLeave={() => setHoveredDefect(null)}
                    onClick={() => setPinnedDefect(defect === pinnedDefect ? null : defect)}
                  >
                    {/* Pulsing ring for FAIL items */}
                    {defect.dieBinStatus === 'FAIL' && (
                      <circle
                        cx={defect.posX}
                        cy={defect.posY}
                        r={dotRadius + 3}
                        fill="none"
                        stroke={conf.fill}
                        strokeWidth="0.8"
                        strokeOpacity={isHovered ? 0.9 : 0.35}
                        className={isHovered ? 'animate-pulse' : ''}
                      />
                    )}

                    {/* Defect Core Dot */}
                    <circle
                      cx={defect.posX}
                      cy={defect.posY}
                      r={isHovered ? dotRadius + 1.8 : dotRadius}
                      fill={conf.fill}
                      stroke={isHovered ? '#ffffff' : conf.stroke}
                      strokeWidth={isHovered ? 1.8 : 0.8}
                      fillOpacity={0.92}
                    />

                    {/* Defect label if hovered */}
                    {isHovered && (
                      <g>
                        <rect
                          x={defect.posX + 8}
                          y={defect.posY - 16}
                          width="90"
                          height="24"
                          rx="4"
                          fill="#020617"
                          stroke={conf.fill}
                          strokeWidth="1"
                        />
                        <text
                          x={defect.posX + 12}
                          y={defect.posY - 4}
                          fill="#ffffff"
                          fontSize="7"
                          fontWeight="bold"
                        >
                          {defect.defectClass} ({defect.defectSize}um)
                        </text>
                        <text
                          x={defect.posX + 12}
                          y={defect.posY + 4}
                          fill="#94a3b8"
                          fontSize="6"
                          fontFamily="monospace"
                        >
                          Die({defect.dieX},{defect.dieY}) | {defect.dieBinStatus}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Color Legend Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-center gap-2">
            {Object.entries(CLASS_COLORS).map(([cls, info]) => {
              const count = filteredDefects.filter((d) => d.defectClass === cls).length;
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(selectedClass === cls ? 'ALL' : cls)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border ${
                    selectedClass === cls
                      ? 'border-white bg-slate-800 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.fill }} />
                  <span className="font-medium">{cls}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Die Defect Inspector & Realtime Detail */}
        <div className="lg:col-span-5 space-y-4">
          {/* Defect & Die Inspector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">다이 & 결함 정밀 인스펙터</h3>
              </div>
              {pinnedDefect ? (
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  결함 고정됨
                </span>
              ) : selectedDie ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  다이 선택됨
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">다이 격자 또는 결함 마커 클릭</span>
              )}
            </div>

            {/* View 1: Specific Defect Active */}
            {activeDefect ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">{activeDefect.waferId} • 샷 {activeDefect.shotId}</span>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{activeDefect.defectClass}</span>
                      <span className={`text-[11px] px-2 py-0.2 rounded-full font-bold font-mono ${
                        activeDefect.dieBinStatus === 'FAIL' ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}>
                        {activeDefect.dieBinStatus}
                      </span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">결함 입경</span>
                    <p className="text-lg font-mono font-bold text-amber-400">{activeDefect.defectSize} μm</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">다이 격자 좌표</span>
                    <span className="font-mono font-semibold text-slate-200">X: {activeDefect.dieX}, Y: {activeDefect.dieY}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">물리적 좌표 (mm)</span>
                    <span className="font-mono font-semibold text-slate-200">X: {activeDefect.posX}, Y: {activeDefect.posY}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">중심 이격 반경</span>
                    <span className="font-mono font-semibold text-slate-200">R: {activeDefect.radius} mm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">클러스터 패턴</span>
                    <span className="font-mono font-semibold text-indigo-300">{activeDefect.clusterType}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400 block font-medium">상세 결함 서브클래스 & 추정 공정:</span>
                  <p className="text-slate-300 font-mono font-bold text-indigo-300">
                    {activeDefect.defectSubclass}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeDefect.defectClass === 'Scratch' && 'CMP 연마 패드 컨디셔너 마모 또는 슬러리 응집체에 의한 기계적 긁힘'}
                    {activeDefect.defectClass === 'RingDefect' && '웨이퍼 에지 부위 가스 공급 유동 불균일 및 정전척 온도 편차'}
                    {activeDefect.defectClass === 'Bridge' && '포토 노광 스캐너 초점 불량 및 현상액 잔류로 인한 인접 패턴 단락'}
                    {activeDefect.defectClass === 'EdgeExclusion' && 'EBR(Edge Bead Removal) 세정 노즐 분사 오차 및 베벨 박리'}
                    {activeDefect.defectClass === 'Void' && '미세 비아 홀 금속 증착 시 불완전 매립(Incomplete Via Filling)'}
                    {activeDefect.defectClass === 'Particle' && '챔버 내벽 폴리머 박리 또는 클린룸 에어로졸 낙하 파티클'}
                  </p>
                </div>
              </div>
            ) : (hoveredDie || selectedDie) ? (
              /* View 2: Die Cell Hovered or Selected */
              (() => {
                const activeDie = (hoveredDie || selectedDie)!;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-mono">
                          다이 규격 14×14mm
                        </span>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="font-mono">Die [X: {activeDie.dieX}, Y: {activeDie.dieY}]</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono ${
                            activeDie.isFail
                              ? 'bg-rose-950 text-rose-300 border border-rose-700'
                              : activeDie.isPassWithParticle
                              ? 'bg-blue-950 text-blue-300 border border-blue-700'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          }`}>
                            {activeDie.isFail ? 'FAIL (불량 다이)' : activeDie.isPassWithParticle ? 'PASS (파티클 유)' : 'PASS (정상 양품)'}
                          </span>
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">다이 내 결함</span>
                        <p className={`text-lg font-mono font-bold ${activeDie.defects.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {activeDie.defects.length} EA
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">다이 중심 좌표</span>
                        <span className="font-mono font-semibold text-slate-200">X: {activeDie.cx}mm, Y: {activeDie.cy}mm</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">중심 이격 반경</span>
                        <span className="font-mono font-semibold text-slate-200">
                          R: {Math.sqrt(activeDie.cx * activeDie.cx + activeDie.cy * activeDie.cy).toFixed(1)} mm
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">치명 결함(FAIL) 수</span>
                        <span className="font-mono font-semibold text-rose-400">{activeDie.failCount} 건</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">양품 판정 파티클 수</span>
                        <span className="font-mono font-semibold text-blue-400">{activeDie.passCount} 건</span>
                      </div>
                    </div>

                    {activeDie.defects.length > 0 ? (
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
                        <span className="text-slate-400 block font-medium">본 다이에 발생한 결함 목록 ({activeDie.defects.length}건):</span>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {activeDie.defects.map((d, i) => (
                            <button
                              key={i}
                              onClick={() => setPinnedDefect(d)}
                              className="w-full text-left p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-[11px] transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: CLASS_COLORS[d.defectClass]?.fill || '#ffffff' }}
                                />
                                <span className="text-slate-200 font-medium">{d.defectClass}</span>
                                <span className="text-slate-500 font-mono">({d.defectSize}μm)</span>
                              </div>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                d.dieBinStatus === 'FAIL' ? 'text-rose-400' : 'text-emerald-400'
                              }`}>
                                {d.dieBinStatus}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>결함이 검출되지 않은 완전한 정상 실리콘 양품 다이입니다.</span>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* View 3: Default Empty State */
              <div className="py-8 text-center space-y-2 text-slate-400">
                <Grid className="w-8 h-8 mx-auto text-indigo-400/60 animate-pulse" />
                <p className="text-xs font-medium text-slate-300">
                  웨이퍼 맵의 <strong>다이 경계(Die Grid)</strong> 또는 <strong>결함 마커</strong>를 클릭해보세요.
                </p>
                <p className="text-[11px] text-slate-500">
                  개별 다이 좌표 [X, Y] 및 결함 입경, 소속 클러스터 정보를 정밀 분석할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* Quick Zone Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">웨이퍼 반경 영역별 불량 현황</h3>
            </div>
            <div className="space-y-2.5">
              {zoneData.map((zone) => (
                <div key={zone.name} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{zone.name}</span>
                    <span className="font-mono text-slate-400">
                      결함 <strong className="text-white">{zone.count}</strong>건 (불량 <strong className="text-rose-400">{zone.failCount}</strong>)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        zone.name.includes('Edge') ? 'bg-rose-500' : zone.name.includes('Mid') ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${filteredDefects.length > 0 ? (zone.count / filteredDefects.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>평균 결함 크기: {zone.avgSize} μm</span>
                    <span>점유율: {filteredDefects.length > 0 ? Math.round((zone.count / filteredDefects.length) * 100) : 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytical Visualizations: Pareto Chart & Root-Cause Engineering Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pareto Chart (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">불량 유형별 파레토 분석 (Defect Pareto Chart)</h3>
              </div>
              <p className="text-xs text-slate-400">
                수율 개선 우선순위 결정을 위한 80-20 법칙(주요 원인 상위 2개 집중 개선)
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
              80% CUTOFF LINE
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any, name: any) => [
                    name === 'count' ? `${value} 건` : `${value} %`,
                    name === 'count' ? '발생 빈도' : '누적 점유율',
                  ]}
                />
                <Bar yAxisId="left" dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {paretoData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CLASS_COLORS[entry.name]?.fill || '#6366f1'}
                    />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="cumulativePct" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
                <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '80% 임계선', fill: '#ef4444', fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engineering Root-Cause & Actionable Insight (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">LLM 공정 지능형 원인 분석 및 개선 액션</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              결함 좌표 클러스터링과 설비 파라미터 상관관계를 종합하여 도출한 추천 개선안입니다.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-rose-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">1. CMP 슬러리 스크래치 클러스터 (우선순위: 긴급)</span>
                <span className="text-[10px] bg-rose-950 px-1.5 py-0.5 rounded text-rose-300 font-mono">수율 영향: -3.2%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                좌측 상단(-72mm, 108mm)에서 연속 선형 스크래치 다발 확인. 슬러리 필터 미세 균열 및 연마 패드 응집물 배출 실패로 추정됩니다.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>개선: CMP 헤드 패드 드레싱 주기 15% 단축 및 필터 모니터링 FDC 인터락 설정</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-amber-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">2. 에지 영역 동심원 링 결함 (RingDefect)</span>
                <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">수율 영향: -1.8%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                R=108~118mm 외곽 환상 영역 결함 밀집. 식각 챔버 정전척(ESC) 히팅 밸런스 오차 및 배기 가스 와류 현상으로 분석됩니다.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>개선: ESC 멀티존 히터 캘리브레이션 및 공정 가스 플로우 오리피스 청정화</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs flex items-center justify-between">
            <span className="text-indigo-200">추정 수율 회복 가능치:</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">+4.8%p 회복 기대</span>
          </div>
        </div>
      </div>

      {/* Student Benchmarking Guide Card: How to Build & Submit a Dashboard */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white">학생들을 위한 최종 결과물 대시보드 제작 가이드</h3>
            </div>
            <p className="text-xs text-slate-400">
              팀별 주제에 맞게 대시보드를 제작할 때 참고할 수 있는 필수 구성요소와 LLM 프롬프트, 파이썬 코드 예시입니다.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveGuideTab('architecture')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeGuideTab === 'architecture' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              대시보드 필수 4요소
            </button>
            <button
              onClick={() => setActiveGuideTab('prompts')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeGuideTab === 'prompts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              추천 프롬프트 템플릿
            </button>
            <button
              onClick={() => setActiveGuideTab('python_code')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeGuideTab === 'python_code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              파이썬 시각화 예시
            </button>
          </div>
        </div>

        {/* Tab 1: 4 Core Elements */}
        {activeGuideTab === 'architecture' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 font-mono font-bold flex items-center justify-center text-xs border border-indigo-700">1</span>
              <h4 className="font-bold text-white text-sm">정량적 핵심 KPI 카드</h4>
              <p className="text-slate-400 leading-relaxed">
                경영진이나 엔지니어가 한눈에 상태를 파악할 수 있도록 <strong>수율(Yield), 불량 수, 결함 밀도, 손실 비용</strong> 등을 상단에 배치합니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 font-mono font-bold flex items-center justify-center text-xs border border-indigo-700">2</span>
              <h4 className="font-bold text-white text-sm">공간적/시계열 시각화</h4>
              <p className="text-slate-400 leading-relaxed">
                웨이퍼 맵(Wafer Map), 챔버 FDC 시계열 센서 차트, 샷별 오버레이 벡터 맵 등 <strong>도메인에 특화된 시각적 컴포넌트</strong>를 배치합니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 font-mono font-bold flex items-center justify-center text-xs border border-indigo-700">3</span>
              <h4 className="font-bold text-white text-sm">원인 분석 & 파레토</h4>
              <p className="text-slate-400 leading-relaxed">
                어떤 불량 유형이 수율 하락의 80%를 차지하는지 <strong>파레토 차트 및 영역별 밀도 분석</strong>으로 우선순위를 명확히 제시합니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 font-mono font-bold flex items-center justify-center text-xs border border-indigo-700">4</span>
              <h4 className="font-bold text-white text-sm">LLM 개선 액션 연계</h4>
              <p className="text-slate-400 leading-relaxed">
                단순 데이터 표시를 넘어, <strong>LLM이 제안하는 설비 점검 액션, FDC 파라미터 보정 권고</strong> 등 실행 가능한 해결책을 포함합니다.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Prompt Templates */}
        {activeGuideTab === 'prompts' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 text-sm">웨이퍼 맵 결함 시각화 생성 프롬프트</span>
                <button
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>복사</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
{`"반도체 300mm 웨이퍼 결함 분석 대시보드를 생성하고 싶어.
제공된 CSV(wafer_id, die_x, die_y, pos_x_mm, pos_y_mm, radius_mm, defect_class, defect_size_um, cluster_type, die_bin_status)를 기반으로:
1. 웨이퍼 2D 원형 맵(R=150mm, 노치, 개별 다이 경계 격자 14×14mm 명확한 테두리 표시, FAIL 불량 다이 Bin 채색, 미세 동심원 가이드라인) 시각화
2. 파레토(Pareto) 불량 유형별 발생 빈도 및 누적 점유율(%) 콤보 차트
3. 반경 영역별(Center, Mid, Edge) 불량 밀도 분석
4. 다이 수율(Die Yield %), 결함 밀도(D0 ≈ 0.51 defects/cm² 공정 이상 상태), 클러스터 결함 비중 KPI 카드 4종
5. CMP 슬러리 스크래치, 열응력 링 결함에 대한 엔지니어링 개선 권고사항
위 요구사항을 충족하는 완전한 대시보드 코드를 작성해줘."`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Python Code Example */}
        {activeGuideTab === 'python_code' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-sm">파이썬 Matplotlib 웨이퍼 다이 격자(Die Grid) 및 결함 시각화 스니펫</span>
              <span className="text-[11px] text-slate-500 font-mono">Python 3.10+ / matplotlib</span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-emerald-300/90 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 overflow-x-auto text-[11px]">
{`import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# 1. 데이터셋 로드 (D0 ≈ 0.505 defects/cm², 총 357건)
df = pd.read_csv('wafer_300mm_defect_map_clusters.csv')

# 2. 웨이퍼 2D 캔버스 생성 (R=150mm)
fig, ax = plt.subplots(figsize=(8, 8), facecolor='#020617')
ax.set_facecolor('#020617')

# 웨이퍼 실리콘 베이스
wafer = plt.Circle((0, 0), 150, facecolor='#0f172a', edgecolor='#64748b', lw=2.0)
ax.add_patch(wafer)

# 3. 다이 경계 격자 (Die Boundary Grid, 14mm x 14mm) 우선 렌더링
die_pitch = 14.0
fail_dice = set(zip(df[df['die_bin_status'] == 'FAIL']['die_x'], df[df['die_bin_status'] == 'FAIL']['die_y']))

for dx in range(-10, 11):
    for dy in range(-10, 11):
        cx, cy = dx * die_pitch, dy * die_pitch
        if np.hypot(cx, cy) <= 145.5:  # 유효 다이 영역
            is_fail = (dx, dy) in fail_dice
            face_color = 'rgba(239, 68, 68, 0.3)' if is_fail else '#0f172a'
            edge_color = '#f43f5e' if is_fail else '#475569'
            lw = 1.2 if is_fail else 0.7
            rect = patches.Rectangle((cx - 7, cy - 7), 14, 14, facecolor=face_color, edgecolor=edge_color, lw=lw)
            ax.add_patch(rect)

# 4. 결함 산포 플롯
colors = {'Scratch': '#f43f5e', 'RingDefect': '#f59e0b', 'Bridge': '#a855f7', 'EdgeExclusion': '#ef4444', 'Particle': '#3b82f6'}
for defect_type, group in df.groupby('defect_class'):
    ax.scatter(group['pos_x_mm'], group['pos_y_mm'], label=defect_type, 
               c=colors.get(defect_type, '#ffffff'), s=group['defect_size_um'] * 2.5, alpha=0.9, edgecolors='white', lw=0.5)

ax.set_xlim(-165, 165); ax.set_ylim(-165, 165)
ax.set_title("300mm Wafer Die Grid & Defect Map (D0 = 0.505 defects/cm²)", color='white', fontsize=12, pad=12)
ax.legend(facecolor='#0f172a', edgecolor='#334155', labelcolor='white')
plt.show()`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
