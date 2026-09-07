import React, { useState } from 'react';
import {
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Heart,
  Copy,
  Check,
  Maximize2,
  ExternalLink,
  Clock,
  CheckCircle2,
  Code,
  Flame,
  Zap,
  Lightbulb,
  Wrench,
  Palette,
} from 'lucide-react';
import { CodeSubmission } from '../types';
import { CodeRunner } from './CodeRunner';
import confetti from 'canvas-confetti';

interface BestCodeLiveShowcaseProps {
  topSubmissions: CodeSubmission[];
  onSelectSubmission: (submission: CodeSubmission) => void;
  onVote: (id: string, reactionType?: string) => void;
  votedIds: Set<string>;
  isVotingOpen: boolean;
}

export const BestCodeLiveShowcase: React.FC<BestCodeLiveShowcaseProps> = ({
  topSubmissions,
  onSelectSubmission,
  onVote,
  votedIds,
  isVotingOpen,
}) => {
  const [selectedRankIdx, setSelectedRankIdx] = useState<number>(0);
  const [promptCopied, setPromptCopied] = useState<boolean>(false);
  const [runnerKey, setRunnerKey] = useState<number>(0);

  if (!topSubmissions || topSubmissions.length === 0) return null;

  const currentSubmission = topSubmissions[selectedRankIdx] || topSubmissions[0];
  const hasVoted = votedIds.has(currentSubmission.id);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentSubmission.promptUsed);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.5 },
    });
  };

  return (
    <section className="relative p-5 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-36 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-10 w-72 h-28 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Showcase Top Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow">
                <Flame className="w-3.5 h-3.5 fill-current text-rose-600" />
                실시간 1위 우수작 즉시 라이브 실행 스테이지
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                웹 앱 브라우저 즉시 구동
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
              교육생 최다 추천 코드 실시간 체험존
            </h2>
          </div>
        </div>

        {/* Top 3 Quick Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {topSubmissions.slice(0, 3).map((sub, idx) => (
            <button
              key={sub.id}
              onClick={() => setSelectedRankIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedRankIdx === idx
                  ? idx === 0
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : idx === 1
                    ? 'bg-slate-300 text-slate-950'
                    : 'bg-amber-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{idx === 0 ? '🥇 1위 대상' : idx === 1 ? '🥈 2위' : '🥉 3위'}</span>
              <span className="opacity-80">({sub.votes}표)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Showcase Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-start">
        {/* Left Column: Metadata & Prompt & Peer Feedback (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-black rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {currentSubmission.team}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {currentSubmission.authorName} 사원 ({currentSubmission.department})
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase">
                {currentSubmission.language}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
              {currentSubmission.title}
            </h3>

            {/* Productivity Impact Pill */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 fill-current" />
              <span>{currentSubmission.productivityImpact}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentSubmission.description}
            </p>
          </div>

          {/* Prompt Section */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                사용한 LLM 프롬프트 지시어
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-400 transition-colors"
              >
                {promptCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>프롬프트 복사</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-xs font-mono p-3 bg-slate-900 rounded-lg border border-slate-800/80 text-indigo-200 leading-relaxed max-h-28 overflow-y-auto">
              {currentSubmission.promptUsed}
            </div>
          </div>

          {/* Quick Reaction & Vote Action */}
          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                동료 교육생 투표 & 리액션 뱃지
              </span>
              <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-current" />
                현재 {currentSubmission.votes}표 획득
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onVote(currentSubmission.id, 'productivity')}
                disabled={!isVotingOpen}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all text-[11px] font-bold ${
                  hasVoted
                    ? 'bg-rose-950/50 border-rose-700 text-rose-300'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                ⚡ 압도적 생산성
              </button>
              <button
                onClick={() => onVote(currentSubmission.id, 'prompt')}
                disabled={!isVotingOpen}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all text-[11px] font-bold ${
                  hasVoted
                    ? 'bg-rose-950/50 border-rose-700 text-rose-300'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-300'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                💡 기발한 프롬프트
              </button>
              <button
                onClick={() => onVote(currentSubmission.id, 'practical')}
                disabled={!isVotingOpen}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all text-[11px] font-bold ${
                  hasVoted
                    ? 'bg-rose-950/50 border-rose-700 text-rose-300'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-300'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                🛠️ 실무 즉시 적용
              </button>
              <button
                onClick={() => onVote(currentSubmission.id, 'ui')}
                disabled={!isVotingOpen}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all text-[11px] font-bold ${
                  hasVoted
                    ? 'bg-rose-950/50 border-rose-700 text-rose-300'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-300'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                🎨 직관적 UI/UX
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onVote(currentSubmission.id)}
                disabled={!isVotingOpen}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                  hasVoted
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                <span>{hasVoted ? '투표 완료 (취소 가능)' : '이 우수작에 투표하기'}</span>
              </button>

              <button
                onClick={handleCelebrate}
                className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-colors"
                title="축하 폭죽 연출"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Direct Live Interactive Runner (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[480px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Runner Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                웹 앱 실시간 구동 화면 (Live Interactive Sandbox)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRunnerKey((k) => k + 1)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="코드 재실행"
              >
                <RotateCcw className="w-3 h-3" />
                <span>다시 실행</span>
              </button>
              <button
                onClick={() => onSelectSubmission(currentSubmission)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-300 hover:text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-800 rounded-lg transition-colors"
                title="전체화면 발표 모달 열기"
              >
                <Maximize2 className="w-3 h-3" />
                <span>전체화면 발표</span>
              </button>
            </div>
          </div>

          {/* Embedded Code Runner */}
          <div className="flex-1 overflow-hidden p-2 bg-slate-950">
            <CodeRunner
              key={`${currentSubmission.id}-${runnerKey}`}
              code={currentSubmission.code}
              language={currentSubmission.language}
              title={currentSubmission.title}
              sampleInput={currentSubmission.sampleInput}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
