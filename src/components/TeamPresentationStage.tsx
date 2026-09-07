import React, { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Zap,
  Lightbulb,
  Wrench,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Check,
  Presentation,
  X,
  Flame,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TeamActivity, ProductivityCategory, CodeSubmission } from '../types';
import { CodeRunner } from './CodeRunner';

interface TeamPresentationStageProps {
  teams: TeamActivity[];
  submissions?: CodeSubmission[];
  currentTeamId?: string;
  currentTeamIndex?: number;
  onSelectTeam?: (teamId: string) => void;
  onSelectTeamIndex?: (index: number) => void;
  onScoreTeam?: (teamId: string, category: 'innovation' | 'practicality' | 'presentation' | 'promptQuality') => void;
  onVoteTeam?: (teamId: string, tag?: 'innovation' | 'practicality' | 'presentation' | 'promptQuality') => void;
  onUpdateTeamStatus: (teamId: string, status: 'waiting' | 'presenting' | 'completed') => void;
  votedIds?: Set<string>;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<ProductivityCategory, string> = {
  excel_automation: '📊 엑셀/데이터 자동화',
  email_document: '✉️ 이메일/문서 자동화',
  data_analysis: '📈 데이터 분석 및 쿼리',
  cs_support: '💬 CS/고객 응대 자동화',
  internal_tools: '🛠️ 사내 도구 & 온보딩',
  workflow_macro: '⚡ 반복 업무 매크로',
};

export const TeamPresentationStage: React.FC<TeamPresentationStageProps> = ({
  teams,
  submissions = [],
  currentTeamId,
  currentTeamIndex = 0,
  onSelectTeam,
  onSelectTeamIndex,
  onScoreTeam,
  onVoteTeam,
  onUpdateTeamStatus,
  votedIds,
  onClose,
}) => {
  // Determine current team by id or index
  let currentIndex = currentTeamIndex;
  if (currentTeamId) {
    const foundIdx = teams.findIndex((t) => t.id === currentTeamId);
    if (foundIdx !== -1) currentIndex = foundIdx;
  }
  if (currentIndex < 0 || currentIndex >= teams.length) currentIndex = 0;

  const currentTeam = teams[currentIndex] || teams[0];

  // Look up representative submission if team fields are partial
  const repSubmission = submissions.find(
    (s) =>
      s.id === currentTeam.representativeSubmissionId ||
      s.team === `${currentTeam.teamNumber}조` ||
      s.team === currentTeam.teamName
  );

  const teamProblem =
    currentTeam.problemStatement ||
    repSubmission?.description ||
    '단순 반복 수작업으로 인한 업무 비효율 및 시간 지연 문제를 해결하고자 함';

  const teamPrompt =
    currentTeam.llmPromptStrategy ||
    repSubmission?.promptUsed ||
    '지정된 데이터와 비즈니스 요구사항을 기반으로 오류 없이 즉각 산출하는 LLM 프롬프트 설계';

  const teamCode =
    currentTeam.code ||
    repSubmission?.code ||
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;background:#0f172a;color:#fff;"><h3>${currentTeam.teamName}</h3><p>라이브 시연 준비 완료</p><button onclick="alert('성공적으로 실행되었습니다!')" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">실행 테스트</button></body></html>`;

  const teamLanguage = (currentTeam.language || repSubmission?.language || 'html') as any;
  const teamImpact =
    currentTeam.productivityImpact ||
    repSubmission?.productivityImpact ||
    '주당 반복 업무 5시간 이상 절감';

  // Timer: 3 min (180s) or 5 min (300s)
  const [timerDuration, setTimerDuration] = useState<number>(180);
  const [timerSeconds, setTimerSeconds] = useState<number>(180);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Prompt copy feedback
  const [isPromptCopied, setIsPromptCopied] = useState<boolean>(false);

  // View toggle: runner vs code
  const [viewMode, setViewMode] = useState<'runner' | 'code'>('runner');

  // Ranking modal
  const [showRankingModal, setShowRankingModal] = useState<boolean>(false);

  // Reset timer on team switch
  useEffect(() => {
    setTimerSeconds(timerDuration);
    setIsTimerRunning(false);
  }, [currentTeam.id, timerDuration]);

  // Countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            try {
              if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
              }
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectTeamByIndex = (idx: number) => {
    if (onSelectTeamIndex) {
      onSelectTeamIndex(idx);
    } else if (onSelectTeam && teams[idx]) {
      onSelectTeam(teams[idx].id);
    }
  };

  const handleNextTeam = () => {
    if (currentIndex < teams.length - 1) {
      handleSelectTeamByIndex(currentIndex + 1);
    }
  };

  const handlePrevTeam = () => {
    if (currentIndex > 0) {
      handleSelectTeamByIndex(currentIndex - 1);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 65,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const handleFeedbackVote = (
    category: 'innovation' | 'practicality' | 'presentation' | 'promptQuality'
  ) => {
    const already = votedIds?.has(`team_${currentTeam.id}_${category}`);
    if (onScoreTeam) {
      onScoreTeam(currentTeam.id, category);
    } else if (onVoteTeam) {
      onVoteTeam(currentTeam.id, category);
    }
    if (!already) {
      triggerConfetti();
    }
  };

  const sortedTeams = [...teams].sort((a, b) => b.totalTeamVotes - a.totalTeamVotes);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ================= TOP STAGE NAVIGATION ================= */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Presentation className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  15개 조별 LLM 생산성 활동 발표 무대
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                15개 조 (1~15조) · 실무 자동화 해결책 발표 & 실시간 코드 즉시 구동
              </p>
            </div>
          </div>

          {/* Quick Stage Controls, Timer & Exit Button */}
          <div className="flex items-center gap-2.5">
            {/* Timer Widget */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-inner">
              <Clock className="w-4 h-4 text-amber-400" />
              <span
                className={`font-mono text-base font-black ${
                  timerSeconds < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                }`}
              >
                {formatTimer(timerSeconds)}
              </span>

              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-1 rounded-md transition-colors ${
                  isTimerRunning ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isTimerRunning ? '일시정지' : '발표 타이머 시작'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                onClick={() => {
                  setTimerSeconds(timerDuration);
                  setIsTimerRunning(false);
                }}
                className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white"
                title="타이머 리셋"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="border-l border-slate-800 pl-2 flex items-center gap-1 text-[11px] text-slate-400">
                <button
                  onClick={() => setTimerDuration(180)}
                  className={`px-1.5 py-0.5 rounded ${timerDuration === 180 ? 'bg-indigo-600 text-white font-bold' : 'hover:text-white'}`}
                >
                  3분
                </button>
                <button
                  onClick={() => setTimerDuration(300)}
                  className={`px-1.5 py-0.5 rounded ${timerDuration === 300 ? 'bg-indigo-600 text-white font-bold' : 'hover:text-white'}`}
                >
                  5분
                </button>
              </div>
            </div>

            {/* 15 Teams Leaderboard Drawer Button */}
            <button
              onClick={() => setShowRankingModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/50 text-amber-300 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              15팀 종합 랭킹
            </button>

            {/* Exit Stage Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                title="발표 무대 닫고 대시보드로 복귀"
              >
                <X className="w-4 h-4" />
                <span>무대 닫기</span>
              </button>
            )}
          </div>
        </div>

        {/* 15 Teams Horizontal Navigation Ribbon */}
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {teams.map((t, idx) => {
            const isSelected = idx === currentIndex;
            const isCompleted = t.presentationStatus === 'completed';
            const isPresenting = t.presentationStatus === 'presenting';

            return (
              <button
                key={t.id}
                onClick={() => handleSelectTeamByIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40 scale-105 z-10'
                    : isPresenting
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : isCompleted
                    ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500'
                    : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{t.teamNumber}조</span>
                {isPresenting && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                )}
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                <span className="text-[10px] opacity-75 font-normal">({t.totalTeamVotes}표)</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ================= STAGE CONTENT BODY ================= */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* Title Header Card */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 text-xs font-black rounded-lg bg-indigo-600 text-white shadow-sm">
                제 {currentTeam.teamNumber} 조
              </span>
              {currentTeam.category && CATEGORY_LABELS[currentTeam.category] && (
                <span className="text-xs font-bold text-indigo-300 px-2.5 py-1 bg-indigo-950/80 border border-indigo-800/80 rounded-lg">
                  {CATEGORY_LABELS[currentTeam.category]}
                </span>
              )}
              <span className="text-xs text-slate-400">
                신입사원 LLM 생산성 해커톤 발표 과제
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentTeam.teamName}
            </h2>
            <p className="text-sm text-amber-300 font-medium">
              🎯 <span>{currentTeam.slogan}</span>
            </p>
          </div>

          {/* Navigation Controls & Status Toggle */}
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevTeam}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                이전 조
              </button>
              <button
                onClick={handleNextTeam}
                disabled={currentIndex === teams.length - 1}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                다음 조
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => onUpdateTeamStatus(currentTeam.id, 'waiting')}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all ${
                  currentTeam.presentationStatus === 'waiting'
                    ? 'bg-slate-800 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                대기
              </button>
              <button
                onClick={() => onUpdateTeamStatus(currentTeam.id, 'presenting')}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all ${
                  currentTeam.presentationStatus === 'presenting'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                발표 중
              </button>
              <button
                onClick={() => {
                  onUpdateTeamStatus(currentTeam.id, 'completed');
                  triggerConfetti();
                }}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all ${
                  currentTeam.presentationStatus === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                완료
              </button>
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN PRESENTATION VIEW ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (5 Cols): Pain Point, LLM Prompt Strategy, Impact, Peer Reviews */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Problem Statement (Before) */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                신입사원이 겪은 실무 업무 Pain Point (Before)
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {teamProblem}
              </p>
            </div>

            {/* 2. LLM Prompt Strategy */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  LLM 프롬프트 해결 전략 & 핵심 접근법
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(teamPrompt);
                    setIsPromptCopied(true);
                    setTimeout(() => setIsPromptCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300"
                >
                  {isPromptCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>프롬프트 복사</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-850 leading-relaxed">
                {teamPrompt}
              </p>
            </div>

            {/* 3. Expected Productivity Impact (After) */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-2 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                기대 정량적 생산성 절감 효과 (After)
              </div>
              <p className="text-sm font-bold text-emerald-200 leading-relaxed">
                ⚡ {teamImpact}
              </p>
            </div>

            {/* 4. Live Peer Review & Voting Reactions (Strict: 1 vote per item) */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Heart className="w-4 h-4 text-rose-500 fill-current" />
                  청중/동료 조 실시간 피어 평가 & 투표
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-900/60">
                  <span>총 {currentTeam.totalTeamVotes}표</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                발표와 실시간 코드 시연을 확인하고 투표해 주세요. (각 항목당 1인 1회 투표 가능, 재클릭 시 취소)
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Innovation */}
                {(() => {
                  const isVoted = votedIds?.has(`team_${currentTeam.id}_innovation`);
                  return (
                    <button
                      onClick={() => handleFeedbackVote('innovation')}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all active:scale-95 border ${
                        isVoted
                          ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500 text-white shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-indigo-500 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚀</span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            혁신성
                            {isVoted && <span className="text-[10px] text-indigo-400 font-semibold">✓</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isVoted ? '내 투표 완료' : '참신한 아이디어'}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${isVoted ? 'text-indigo-300' : 'text-indigo-400'}`}>
                        {currentTeam.feedbackTags?.innovation || 0}
                      </span>
                    </button>
                  );
                })()}

                {/* Practicality */}
                {(() => {
                  const isVoted = votedIds?.has(`team_${currentTeam.id}_practicality`);
                  return (
                    <button
                      onClick={() => handleFeedbackVote('practicality')}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all active:scale-95 border ${
                        isVoted
                          ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500 text-white shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-emerald-500 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🛠️</span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            실무 적용성
                            {isVoted && <span className="text-[10px] text-emerald-400 font-semibold">✓</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isVoted ? '내 투표 완료' : '당장 내일 쓸 수 있음'}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${isVoted ? 'text-emerald-300' : 'text-emerald-400'}`}>
                        {currentTeam.feedbackTags?.practicality || 0}
                      </span>
                    </button>
                  );
                })()}

                {/* Presentation */}
                {(() => {
                  const isVoted = votedIds?.has(`team_${currentTeam.id}_presentation`);
                  return (
                    <button
                      onClick={() => handleFeedbackVote('presentation')}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all active:scale-95 border ${
                        isVoted
                          ? 'bg-amber-950/80 border-amber-500 ring-1 ring-amber-500 text-white shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-amber-500 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎤</span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            발표력
                            {isVoted && <span className="text-[10px] text-amber-400 font-semibold">✓</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isVoted ? '내 투표 완료' : '명쾌한 전달력'}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${isVoted ? 'text-amber-300' : 'text-amber-400'}`}>
                        {currentTeam.feedbackTags?.presentation || 0}
                      </span>
                    </button>
                  );
                })()}

                {/* Prompt Quality */}
                {(() => {
                  const isVoted = votedIds?.has(`team_${currentTeam.id}_promptQuality`);
                  return (
                    <button
                      onClick={() => handleFeedbackVote('promptQuality')}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all active:scale-95 border ${
                        isVoted
                          ? 'bg-purple-950/80 border-purple-500 ring-1 ring-purple-500 text-white shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-purple-500 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">💡</span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            프롬프트 완성도
                            {isVoted && <span className="text-[10px] text-purple-400 font-semibold">✓</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isVoted ? '내 투표 완료' : '설계 정교함'}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${isVoted ? 'text-purple-300' : 'text-purple-400'}`}>
                        {currentTeam.feedbackTags?.promptQuality || 0}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): The Live Interactive Code Execution Stage */}
          <div className="lg:col-span-7 flex flex-col space-y-2">
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  {currentTeam.teamNumber}조 대표 코드 무대 라이브 실행 (Live Execution Stage)
                </h3>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('runner')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    viewMode === 'runner'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  라이브 시연
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    viewMode === 'code'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  소스 코드
                </button>
              </div>
            </div>

            {/* Stage Sandbox Container */}
            <div className="flex-1 min-h-[500px] bg-slate-950 border border-slate-800 rounded-b-2xl overflow-hidden shadow-2xl relative">
              {viewMode === 'runner' ? (
                <div className="w-full h-full min-h-[500px]">
                  <CodeRunner
                    code={teamCode}
                    language={teamLanguage}
                    title={currentTeam.teamName}
                    sampleInput={currentTeam.sampleInput}
                  />
                </div>
              ) : (
                <div className="p-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase text-slate-500">
                      언어: {teamLanguage}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(teamCode);
                        alert('전체 소스코드가 클립보드에 복사되었습니다.');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      코드 복사
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
                    <code>{teamCode}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ================= 15-TEAM RANKING MODAL ================= */}
      {showRankingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">15개 조 실시간 득표 & 발표 종합 랭킹</h3>
              </div>
              <button
                onClick={() => setShowRankingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {sortedTeams.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => {
                    const targetIdx = teams.findIndex((item) => item.id === t.id);
                    handleSelectTeamByIndex(targetIdx);
                    setShowRankingModal(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    t.id === currentTeam.id
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{t.teamName}</span>
                        {t.presentationStatus === 'completed' && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                            발표완료
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{t.slogan}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-rose-400 font-black text-sm">
                      <Heart className="w-4 h-4 fill-current" />
                      {t.totalTeamVotes}표
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowRankingModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
