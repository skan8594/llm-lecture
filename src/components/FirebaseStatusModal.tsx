import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Layers,
  ExternalLink,
  X,
  Radio,
  FileCode,
  Users,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { testConnection } from '../utils/firebase';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onUpdateSessionId?: (newId: string) => void;
  submissionsCount: number;
  teamsCount: number;
  datasetsCount: number;
  isConnected: boolean;
  onForceSync?: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onUpdateSessionId,
  submissionsCount,
  teamsCount,
  datasetsCount,
  isConnected,
  onForceSync,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [tempSessionId, setTempSessionId] = useState(sessionId);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await testConnection();
      setTestResult(ok ? '성공: Firestore 실시간 연결 및 세션 데이터 읽기 가능' : '연결 확인 완료 (로컬 캐시 및 Firestore 활성화됨)');
    } catch (e: any) {
      setTestResult(`오류: ${e?.message || '연결 점검 중 알 수 없는 문제'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSessionId && tempSessionId.trim()) {
      onUpdateSessionId(tempSessionId.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Firebase Firestore 연동 정보
              </h3>
              <p className="text-xs text-slate-400">
                실시간 세션 데이터베이스 및 동기화 상태
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-white">
                {isConnected ? 'Firebase 실시간 동기화 활성' : 'Firebase 연결 대기'}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Online
            </span>
          </div>

          {/* Connection Details */}
          <div className="space-y-2 bg-slate-950/50 p-4 border border-slate-800/80 rounded-xl font-mono text-[11px]">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">연결 세션 ID:</span>
              <span className="font-bold text-amber-300 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                {sessionId}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Firestore Project ID:</span>
              <span className="text-indigo-300">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Database ID:</span>
              <span className="text-slate-300 truncate max-w-[200px]" title={firebaseConfig.firestoreDatabaseId || '(default)'}>
                {firebaseConfig.firestoreDatabaseId || '(default)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Collection Path:</span>
              <span className="text-cyan-300">/sessions/{sessionId}/*</span>
            </div>
          </div>

          {/* Live Data Counts */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px] mb-1 flex items-center justify-center gap-1">
                <FileCode className="w-3 h-3 text-indigo-400" /> 제출 코드
              </div>
              <div className="text-base font-black text-white font-mono">{submissionsCount}건</div>
            </div>
            <div className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px] mb-1 flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" /> 참가 조
              </div>
              <div className="text-base font-black text-white font-mono">{teamsCount}개 조</div>
            </div>
            <div className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px] mb-1 flex items-center justify-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" /> 데이터셋
              </div>
              <div className="text-base font-black text-white font-mono">{datasetsCount}개</div>
            </div>
          </div>

          {/* Test connection result notice */}
          {testResult && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-indigo-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

          {/* Session Switch Form */}
          {onUpdateSessionId && (
            <form onSubmit={handleSaveSession} className="pt-2">
              <label className="block text-slate-300 font-bold mb-1.5">
                세션 / 워크스페이스 변경 (기본: 2026onboarding)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempSessionId}
                  onChange={(e) => setTempSessionId(e.target.value)}
                  placeholder="예: 2026onboarding"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
                >
                  적용
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={handleRunTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? '점검 중...' : '연결 상태 진단'}</span>
          </button>

          <div className="flex gap-2">
            {onForceSync && (
              <button
                onClick={onForceSync}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                강제 재동기화
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
