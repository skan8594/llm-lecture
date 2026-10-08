import { useState } from 'react';
import { Database, Download, Eye, FileSpreadsheet, X } from 'lucide-react';
import { SampleDataset } from '../types';

export function DatasetManager({ datasets }: { datasets: SampleDataset[] }) {
  const [preview, setPreview] = useState<SampleDataset | null>(null);

  const downloadCsv = (dataset: SampleDataset) => {
    const url = URL.createObjectURL(new Blob(['\uFEFF', dataset.csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = dataset.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const previewRows = preview?.csvContent.split(/\r?\n/).slice(0, 11).map(line => line.split(',')) ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/30 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-emerald-300 font-bold">
          <Database className="w-5 h-5" />
          정적 실습 데이터셋 ({datasets.length}개)
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          데이터셋은 웹사이트에 포함되어 제공됩니다. 새 CSV를 추가하거나 수정하려면 저장소의 교안 데이터를 변경한 뒤 사이트를 재배포하세요. Firebase에는 저장하지 않습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {datasets.map(dataset => (
          <div key={dataset.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">{dataset.title}</h3>
                <p className="text-xs text-emerald-300 break-all">{dataset.fileName}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{dataset.description}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs">
              <span className="text-slate-400">{dataset.rowCount}행 · {dataset.fileSize}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPreview(dataset)} className="min-h-11 px-3 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 flex items-center gap-1">
                  <Eye className="w-4 h-4" /> 미리보기
                </button>
                <button type="button" onClick={() => downloadCsv(dataset)} className="min-h-11 px-3 rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 flex items-center gap-1">
                  <Download className="w-4 h-4" /> CSV 다운로드
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`${preview.title} 미리보기`}>
          <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">{preview.title}</h3>
                <p className="text-xs text-slate-400">첫 10행 미리보기 · 전체 {preview.rowCount}행</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} aria-label="미리보기 닫기" className="min-w-11 min-h-11 flex items-center justify-center text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto">
              <table className="text-xs text-left whitespace-nowrap min-w-full">
                <thead className="bg-slate-800 text-emerald-300"><tr>{previewRows[0]?.map((cell, index) => <th key={index} className="p-2">{cell}</th>)}</tr></thead>
                <tbody className="text-slate-200">{previewRows.slice(1).map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-800">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-2">{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={() => setPreview(null)} className="min-h-11 px-3 text-slate-300">닫기</button>
              <button type="button" onClick={() => downloadCsv(preview)} className="min-h-11 px-3 rounded-lg bg-emerald-700 text-white">전체 CSV 다운로드</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
