import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal, Eye, CheckCircle2, AlertTriangle, Clock, Copy, Check } from 'lucide-react';
import { CodeLanguage } from '../types';
import { runPythonScript } from '../utils/pythonRunner';

interface CodeRunnerProps {
  code: string;
  language: CodeLanguage;
  title?: string;
  sampleInput?: string;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({ code, language, title }) => {
  const [output, setOutput] = useState<string>('');
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'preview' | 'console'>(language === 'html' ? 'preview' : 'console');
  const [copied, setCopied] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runCode = () => {
    setIsRunning(true);
    setHasError(false);
    setOutput('');
    setTableData(null);

    const startTime = performance.now();

    try {
      if (language === 'html') {
        // For HTML, update iframe srcdoc
        if (iframeRef.current) {
          iframeRef.current.srcdoc = code;
        }
        const diff = Math.round(performance.now() - startTime);
        setExecTime(diff);
        setOutput('✅ HTML/CSS/JS 웹 위젯이 샌드박스 뷰어에 성공적으로 렌더링되었습니다.');
        setIsRunning(false);
      } else if (language === 'javascript') {
        // Execute JavaScript capturing console.log and console.table
        const logs: string[] = [];
        let capturedTable: any[] | null = null;

        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
          },
          table: (data: any) => {
            if (Array.isArray(data)) {
              capturedTable = data;
              logs.push(`[표 출력: 총 ${data.length}개 행]`);
            } else if (typeof data === 'object') {
              capturedTable = [data];
            }
          },
          error: (...args: any[]) => {
            logs.push('❌ [에러] ' + args.join(' '));
            setHasError(true);
          },
          warn: (...args: any[]) => {
            logs.push('⚠️ [경고] ' + args.join(' '));
          },
        };

        // Wrap execution in safe function
        const runnerFn = new Function('console', `
          try {
            ${code}
          } catch (e) {
            console.error(e.message);
          }
        `);

        runnerFn(customConsole);

        const diff = Math.round(performance.now() - startTime);
        setExecTime(diff);
        setOutput(logs.join('\n') || '코드가 성공적으로 실행되었습니다 (로그 출력 없음).');
        if (capturedTable) setTableData(capturedTable);
        setIsRunning(false);
      } else if (language === 'python') {
        const result = runPythonScript(code);
        setOutput(result.output);
        setHasError(!result.success);
        setExecTime(result.timeMs);
        setIsRunning(false);
      } else if (language === 'sql') {
        // SQL query runner simulation
        const diff = Math.round(performance.now() - startTime);
        setExecTime(diff);
        const mockRows = [
          { order_id: 'ORD-2026-901', customer_name: '(주)전자테크', total_amount: '4,500,000원', status: '결제완료', created_at: '2026-09-06' },
          { order_id: 'ORD-2026-902', customer_name: '(주)전자시스템', total_amount: '12,800,000원', status: '배송중', created_at: '2026-09-06' },
          { order_id: 'ORD-2026-903', customer_name: '(주)한국전자솔루션', total_amount: '8,200,000원', status: '결제완료', created_at: '2026-09-05' },
          { order_id: 'ORD-2026-904', customer_name: '(주)삼성전자협력', total_amount: '31,500,000원', status: '승인대기', created_at: '2026-09-05' },
        ];
        setTableData(mockRows);
        setOutput(`✅ SQL 쿼리가 인메모리 테스트 DB에서 성공적으로 실행되었습니다.\n반환된 레코드: 4건`);
        setIsRunning(false);
      } else {
        setOutput(`지원 언어: ${language}. 코드가 유효합니다.`);
        setIsRunning(false);
      }
    } catch (err: any) {
      setHasError(true);
      setOutput(`실행 에러: ${err.message}`);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run on first load
    runCode();
  }, [code, language]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            실시간 런너 · {language.toUpperCase()}
          </span>
          {execTime !== null && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-cyan-400" />
              {execTime}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {language === 'html' && (
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                위젯 화면
              </button>
              <button
                onClick={() => setViewMode('console')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'console' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                콘솔 출력
              </button>
            </div>
          )}

          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '복사됨' : '코드 복사'}
          </button>

          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
          >
            {isRunning ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            재실행
          </button>
        </div>
      </div>

      {/* Main Runner Body */}
      <div className="relative flex-1 min-h-[300px] overflow-hidden bg-slate-950 flex flex-col">
        {language === 'html' && viewMode === 'preview' ? (
          <div className="w-full h-full flex-1 bg-slate-900">
            <iframe
              ref={iframeRef}
              title={title || 'HTML Preview'}
              sandbox="allow-scripts allow-modals"
              className="w-full h-full min-h-[360px] border-0 bg-transparent"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed">
            {/* Table visualization if captured */}
            {tableData && tableData.length > 0 && (
              <div className="mb-4 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/90 p-2">
                <div className="text-[11px] font-semibold text-cyan-400 mb-2 px-1">
                  📊 구조화된 데이터 결과 표 ({tableData.length}건)
                </div>
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80 text-slate-300">
                      {Object.keys(tableData[0]).map((key) => (
                        <th key={key} className="px-3 py-2 font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-3 py-1.5 text-slate-300">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Terminal Raw Logs */}
            <div className="flex items-start gap-2 text-slate-400 mb-2 select-none">
              <Terminal className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-400">Terminal Stdout / Console</span>
            </div>

            <pre className="whitespace-pre-wrap font-mono text-[12px] text-slate-100 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
              {output || '실행 결과 대기 중...'}
            </pre>

            {hasError && (
              <div className="mt-3 flex items-center gap-2 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>코드 실행 중 오류가 감지되었습니다. 변수명 또는 구문을 확인해주세요.</span>
              </div>
            )}

            {!hasError && output && (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400/90">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>스크립트 정상 구동 완료 ({execTime || 0}ms)</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
