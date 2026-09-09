import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileText,
  Table as TableIcon,
  X,
} from 'lucide-react';
import { SampleDataset } from '../types';
import { calculateCsvStats } from '../data/sampleDatasets';

interface DatasetManagerProps {
  datasets: SampleDataset[];
  onAddDataset: (newDataset: Omit<SampleDataset, 'id' | 'uploadedAt'>) => void;
  onDeleteDataset: (id: string) => void;
  onResetDatasets: () => void;
}

export const DatasetManager: React.FC<DatasetManagerProps> = ({
  datasets,
  onAddDataset,
  onDeleteDataset,
  onResetDatasets,
}) => {
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewDataset, setPreviewDataset] = useState<SampleDataset | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV into rows for preview
  const parseCsvPreview = (csv: string, maxRows = 6) => {
    const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1, maxRows + 1).map((line) => line.split(',').map((c) => c.trim()));
    return { headers, rows, totalRows: Math.max(0, lines.length - 1) };
  };

  const handleFileChange = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setStatusMessage('CSV 형식(.csv)의 파일만 업로드할 수 있습니다.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setCsvContent(text);
      setFileName(file.name);
      if (!title) {
        // Auto-fill title from filename
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setTitle(cleanTitle);
      }
      setShowAddForm(true);
      setStatusMessage(`파일 '${file.name}'을 성공적으로 불러왔습니다.`);
      setTimeout(() => setStatusMessage(null), 3000);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMessage('데이터셋 제목을 입력해주세요.');
      return;
    }
    if (!csvContent.trim()) {
      setStatusMessage('CSV 파일 또는 CSV 데이터를 입력해주세요.');
      return;
    }

    const cleanFileName = fileName.trim()
      ? fileName.toLowerCase().endsWith('.csv')
        ? fileName.trim()
        : `${fileName.trim()}.csv`
      : `${title.trim().replace(/\s+/g, '_').toLowerCase()}.csv`;

    const stats = calculateCsvStats(csvContent);

    onAddDataset({
      title: title.trim(),
      fileName: cleanFileName,
      description: description.trim() || '강사 업로드 반도체 제조 실습 데이터셋',
      csvContent: csvContent.trim(),
      fileSize: stats.fileSize,
      rowCount: stats.rowCount,
      uploadedBy: '강사',
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setFileName('');
    setCsvContent('');
    setShowAddForm(false);
    setStatusMessage('새로운 CSV 실습 데이터셋이 등록되었습니다.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const downloadCsv = (dataset: SampleDataset) => {
    const blob = new Blob(['\uFEFF' + dataset.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', dataset.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>실습 데이터셋 관리 (CSV)</span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  {datasets.length}개 보유
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                강사가 CSV 데이터를 등록하면, 학생용 화면에서 즉시 다운로드하여 실습에 활용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDatasets}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
            title="기본 반도체 예시 데이터셋으로 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 데이터셋 복원</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 CSV 데이터 추가</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-xs text-indigo-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* CSV Add Form (Upload or Direct Input) */}
      {showAddForm && (
        <div className="p-5 sm:p-6 bg-slate-900/90 border border-emerald-800/60 rounded-2xl shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>신규 CSV 데이터셋 업로드 / 작성</span>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag & Drop File Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-slate-700 bg-slate-950/60 hover:border-emerald-600 hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs font-semibold text-white">
                여기로 .csv 파일을 끌어다 놓거나 클릭하여 선택하세요
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                별도의 고정 스키마 없이 어떤 형태의 CSV 데이터도 자유롭게 업로드 가능합니다
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  데이터셋 제목 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 웨이퍼 결함 맵 결측치 데이터셋"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  파일명 (.csv)
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="예: wafer_defect_map.csv"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                데이터 설명 및 실습 안내
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 식각 공정 후 웨이퍼 결함 좌표(X, Y), 결함 종류, 크기(um) 데이터"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV 데이터 내용 (붙여넣기 또는 파일 내용)</span>
                </label>
                {csvContent && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    약 {calculateCsvStats(csvContent).rowCount}행 (
                    {calculateCsvStats(csvContent).fileSize})
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                required
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="lot_id,wafer_no,die_x,die_y,defect_type,defect_size_um&#10;LOT-2026-W01,01,14,22,Particle,0.85&#10;LOT-2026-W01,01,15,22,Bridge,2.45"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-y"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>데이터셋 등록 완료</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dataset Grid List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          현재 등록된 실습 데이터셋 목록 ({datasets.length}개)
        </h3>

        {datasets.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">등록된 데이터셋이 없습니다.</p>
            <button
              onClick={onResetDatasets}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              기본 반도체 예시 데이터셋 불러오기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {datasets.map((dataset) => {
              return (
                <div
                  key={dataset.id}
                  className="p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {dataset.title}
                          </h4>
                          <span className="text-[11px] font-mono text-emerald-400">
                            {dataset.fileName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {dataset.rowCount}행
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {dataset.fileSize}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {dataset.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 font-mono">
                      {dataset.uploadedBy || '강사'} ·{' '}
                      {new Date(dataset.uploadedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewDataset(dataset)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
                        title="데이터 미리보기"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>미리보기</span>
                      </button>

                      <button
                        onClick={() => downloadCsv(dataset)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-semibold transition-colors"
                        title="CSV 다운로드"
                      >
                        <Download className="w-3 h-3" />
                        <span>다운로드</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`'${dataset.title}' 데이터셋을 삭제하시겠습니까?`)) {
                            onDeleteDataset(dataset.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{previewDataset.title}</h3>
                  <span className="text-xs font-mono text-slate-400">
                    {previewDataset.fileName} ({previewDataset.rowCount}행, {previewDataset.fileSize}
                    )
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDataset(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">{previewDataset.description}</p>

            {/* Render CSV preview table */}
            <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-950">
              {(() => {
                const { headers, rows } = parseCsvPreview(previewDataset.csvContent, 10);
                return (
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-slate-800/80 text-emerald-400 sticky top-0">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="p-2.5 border-b border-slate-700 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/60">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 whitespace-nowrap">
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

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500 font-mono">
                상위 10개 행 미리보기 표시 중
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDataset(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white text-xs"
                >
                  닫기
                </button>
                <button
                  onClick={() => downloadCsv(previewDataset)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>전체 CSV 다운로드</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
