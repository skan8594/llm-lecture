import React, { useState } from 'react';
import { FileSpreadsheet, Download, Eye, Table, CheckCircle, FileText, Sparkles, BarChart3, ArrowRight } from 'lucide-react';
import { SampleDataset } from '../types';

interface ParticipantDatasetListProps {
  datasets: SampleDataset[];
  onOpenDashboard?: () => void;
}

export const ParticipantDatasetList: React.FC<ParticipantDatasetListProps> = ({ datasets, onOpenDashboard }) => {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const handleDownload = (dataset: SampleDataset) => {
    // Add BOM for UTF-8 Excel Korean encoding support
    const blob = new Blob(['\uFEFF' + dataset.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', dataset.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedIds((prev) => new Set(prev).add(dataset.id));
    setTimeout(() => {
      setDownloadedIds((prev) => {
        const next = new Set(prev);
        next.delete(dataset.id);
        return next;
      });
    }, 2500);
  };

  const parseCsvPreview = (csv: string, maxRows = 6) => {
    const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1, maxRows + 1).map((line) => line.split(',').map((c) => c.trim()));
    return { headers, rows };
  };

  return (
    <div className="space-y-4">
      {/* Featured Dashboard Reference Callout */}
      {onOpenDashboard && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950/80 border border-indigo-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-900/60 text-indigo-400 border border-indigo-700/60 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 mb-1">
                <span>NEW • 최종 결과물 벤치마킹</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                실습 데이터 기반 최종 결과물 대시보드 참고 예시 (Live Demo)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                1번 웨이퍼 결함 맵 데이터셋으로 구축된 <strong>2D 웨이퍼 맵, 파레토 차트, 수율 KPI 및 LLM 원인 분석 대시보드</strong>를 직접 조작해보고 최종 제출물에 벤치마킹하세요.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenDashboard}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-950 shrink-0 hover:scale-[1.02] active:scale-95"
          >
            <BarChart3 className="w-4 h-4" />
            <span>대시보드 예시 바로보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Informational Guidance Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-800/40 rounded-2xl flex items-start gap-3 shadow-md">
        <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-400 border border-emerald-700/60 shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
            <span>반도체 실습 예시 데이터셋 다운로드</span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              총 {datasets.length}개 제공 중
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            강사진이 준비한 원천 반도체 제조 데이터입니다. 각 데이터셋의 [CSV 다운로드] 버튼을 눌러
            PC에 저장한 후, <strong>LLM 프롬프트 작성</strong>이나 <strong>Python / JS 자동화 코드 개발</strong> 실습에 활용하세요.
          </p>
        </div>
      </div>

      {/* Datasets Cards Grid */}
      {datasets.length === 0 ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
          현재 등록된 실습 데이터셋이 없습니다. 강사의 안내를 기다려주세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {datasets.map((dataset) => {
            const isDownloaded = downloadedIds.has(dataset.id);
            const isPreviewOpen = previewId === dataset.id;

            return (
              <div
                key={dataset.id}
                className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3.5 flex flex-col justify-between transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white leading-tight">
                          {dataset.title}
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {dataset.fileName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {dataset.rowCount}행
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-950 border border-slate-800 text-slate-400">
                        {dataset.fileSize}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {dataset.description}
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewId(isPreviewOpen ? null : dataset.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isPreviewOpen ? '미리보기 닫기' : '컬럼 미리보기'}</span>
                    </button>

                    {(dataset.id === 'dataset-wafer-defect-map-spatial' || dataset.fileName.includes('wafer_300mm')) && onOpenDashboard && (
                      <button
                        onClick={onOpenDashboard}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/70 text-xs font-bold transition-all shadow-sm"
                        title="이 데이터셋으로 제작된 2D 웨이퍼 맵 대시보드 예시 보기"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>대시보드 예시 (Live Demo)</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(dataset)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
                      isDownloaded
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                    }`}
                  >
                    {isDownloaded ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>다운로드 완료!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV 다운로드</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Preview Table when opened */}
                {isPreviewOpen && (
                  <div className="mt-2 pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Table className="w-3 h-3 text-emerald-400" />
                        컬럼 구조 및 상위 5개 행 샘플
                      </span>
                      <span>전체 {dataset.rowCount}행</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 max-h-48 text-[11px] font-mono">
                      {(() => {
                        const { headers, rows } = parseCsvPreview(dataset.csvContent, 5);
                        return (
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-800/80 text-emerald-400 sticky top-0">
                              <tr>
                                {headers.map((h, i) => (
                                  <th key={i} className="p-2 border-b border-slate-700 whitespace-nowrap">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                              {rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-900/60">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 whitespace-nowrap">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
