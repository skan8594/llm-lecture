import React, { useState } from 'react';
import {
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Terminal,
  Clock,
  User,
  Building,
  Target,
  FileCode,
  Copy,
  Check,
  Award,
  Loader2,
} from 'lucide-react';
import { CodeSubmission } from '../types';
import { CodeRunner } from './CodeRunner';

interface SubmissionModalProps {
  submission: CodeSubmission | null;
  onClose: () => void;
  onVote: (id: string) => void;
  hasVoted: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isVotingOpen: boolean;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  submission,
  onClose,
  onVote,
  hasVoted,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  isVotingOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'run' | 'prompt' | 'ai-review'>('run');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [aiReview, setAiReview] = useState<any | null>(null);
  const [loadingAiReview, setLoadingAiReview] = useState(false);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);

  if (!submission) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(submission.promptUsed);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const fetchAiReview = async () => {
    if (aiReview) {
      setActiveTab('ai-review');
      return;
    }

    setLoadingAiReview(true);
    setAiReviewError(null);
    setActiveTab('ai-review');

    try {
      const res = await fetch('/api/gemini/review-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: submission.title,
          promptUsed: submission.promptUsed,
          code: submission.code,
          language: submission.language,
        }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setAiReview(data.review);
      } else {
        setAiReviewError(data.error || 'AI 심사 결과를 가져올 수 없습니다.');
      }
    } catch (e: any) {
      setAiReviewError(e.message || '네트워크 오류');
    } finally {
      setLoadingAiReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              {submission.team}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-xl">
              {submission.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Next controls for instructor stage presentation */}
            {hasPrev && (
              <button
                onClick={onPrev}
                title="이전 제출물"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={onNext}
                title="다음 제출물"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Vote Button */}
            <button
              onClick={() => onVote(submission.id)}
              disabled={!isVotingOpen}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                hasVoted
                  ? 'bg-rose-600 text-white shadow-rose-900/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              } disabled:opacity-50`}
            >
              <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current text-white' : 'text-rose-400'}`} />
              <span>투표 {submission.votes}표</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header Info Strip (No Personal Information) */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-800 px-2.5 py-0.5 rounded-md">
              {submission.team} 대표 과제
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded-md">
              {submission.language}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/50">
              <Clock className="w-3.5 h-3.5" />
              기대 효과: {submission.productivityImpact}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('run')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'run' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              실시간 구동 (Run)
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'prompt' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              사용한 프롬프트
            </button>
            <button
              onClick={fetchAiReview}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'ai-review' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI 심사 & 생산성 분석
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-slate-950">
          {activeTab === 'run' && (
            <div className="w-full h-full flex flex-col">
              <CodeRunner
                code={submission.code}
                language={submission.language}
                title={submission.title}
                sampleInput={submission.sampleInput}
              />
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="w-full h-full flex flex-col overflow-y-auto space-y-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white">
                      신입사원이 LLM에 입력한 원본 프롬프트 (Prompt Engineering)
                    </h4>
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPrompt ? '복사 완료' : '프롬프트 복사'}
                  </button>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {submission.promptUsed}
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  프로젝트 개요 및 비즈니스 기대 효과
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {submission.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>제출 시간: {new Date(submission.createdAt).toLocaleTimeString('ko-KR')}</span>
                  <span>·</span>
                  <span>사용 언어: {submission.language.toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-review' && (
            <div className="w-full h-full flex flex-col overflow-y-auto">
              {loadingAiReview ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  <p className="text-sm">Gemini가 신입사원의 프롬프트와 코드를 정밀 심사 중입니다...</p>
                </div>
              ) : aiReviewError ? (
                <div className="p-6 bg-slate-900 border border-rose-800/50 rounded-xl text-center">
                  <p className="text-sm text-rose-300 mb-3">{aiReviewError}</p>
                  <button
                    onClick={fetchAiReview}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                  >
                    다시 시도
                  </button>
                </div>
              ) : aiReview ? (
                <div className="space-y-4">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 mb-1">종합 심사 점수</div>
                      <div className="text-3xl font-extrabold text-amber-400 flex items-center justify-center gap-1">
                        <Award className="w-6 h-6 text-amber-400" />
                        {aiReview.score}
                        <span className="text-xs text-slate-400 font-normal">/100</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 mb-1">실무 생산성 기여</div>
                      <div className="text-2xl font-bold text-emerald-400">{aiReview.productivityScore}점</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 mb-1">프롬프트 작성 완성도</div>
                      <div className="text-2xl font-bold text-indigo-400">{aiReview.promptEngineeringScore}점</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 mb-1">코드 완성도 & 안전성</div>
                      <div className="text-2xl font-bold text-cyan-400">{aiReview.codeQualityScore}점</div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-5 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-800/40 rounded-xl">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      수석 심사위원 총평
                    </h5>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      "{aiReview.summary}"
                    </p>
                    {aiReview.expectedTimeSaved && (
                      <div className="mt-2 text-xs text-emerald-400 font-semibold">
                        ⏱️ AI 공인 월간 절감 시간: {aiReview.expectedTimeSaved}
                      </div>
                    )}
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                      <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                        ✨ 주요 강점 및 호평 요소
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiReview.strengths?.map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                        💡 현업 적용을 위한 업그레이드 조언
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiReview.improvements?.map((imp: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
