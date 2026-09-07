import React, { useState, useEffect } from 'react';
import {
  Users,
  Heart,
  Play,
  Timer,
  Pause,
  Trophy,
  Layers,
  Laptop,
  Tv,
  Download,
  Upload,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { CodeSubmission, TeamActivity } from '../types';
import { LeaderboardPodium } from './LeaderboardPodium';
import { BestCodeLiveShowcase } from './BestCodeLiveShowcase';
import { SubmissionAnalyticsBoard } from './SubmissionAnalyticsBoard';
import { TeamActivitiesGrid } from './TeamActivitiesGrid';
import { TweetCodeFeed } from './TweetCodeFeed';
import { formatTeamName, getTeamNumber } from '../utils/teamUtils';

interface PresenterDashboardProps {
  teams: TeamActivity[];
  submissions: CodeSubmission[];
  onSelectSubmission: (submission: CodeSubmission) => void;
  onVote: (id: string, reactionType?: string) => void;
  onVoteTeam?: (teamId: string) => void;
  votedIds: Set<string>;
  isVotingOpen: boolean;
  onToggleVoting: () => void;
  onResetData: () => void;
  onStartTeamPresentation: (teamIndex: number) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PresenterDashboard: React.FC<PresenterDashboardProps> = ({
  teams,
  submissions,
  onSelectSubmission,
  onVote,
  onVoteTeam,
  votedIds,
  isVotingOpen,
  onToggleVoting,
  onResetData,
  onStartTeamPresentation,
  onExportJson,
  onImportJson,
}) => {
  const TOTAL_TEAMS = 15;

  // 15 Teams submission count
  const teamSubmissionMap: Record<number, boolean> = {};
  submissions.forEach((s) => {
    const num = getTeamNumber(s.team);
    if (num >= 1 && num <= 15) {
      teamSubmissionMap[num] = true;
    }
  });

  const submittedTeamsCount = Object.keys(teamSubmissionMap).length;
  const submissionRate = Math.min(100, Math.round((submittedTeamsCount / TOTAL_TEAMS) * 100));
  const totalVotes = submissions.reduce((acc, s) => acc + s.votes, 0);

  // Tabbed view: 'feed' (Tweet style), 'teams', 'analytics', 'leaderboard'
  const [activeTab, setActiveTab] = useState<'feed' | 'teams' | 'analytics' | 'leaderboard'>('feed');

  // Selected team for filter in analytics
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');

  // Presentation Timer (default: 15 minutes)
  const [timerSeconds, setTimerSeconds] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Top 3 for Podium
  const topSubmissions = [...submissions].sort((a, b) => b.votes - a.votes).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Instructor Toolbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Mode */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 font-black text-sm">
              LLM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  2026 신입사원 LLM 생산성 해커톤
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  강사용
                </span>
              </div>
            </div>
          </div>

          {/* Instructor Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* Timer Widget */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm font-bold text-white">{formatTimer(timerSeconds)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-slate-400 hover:text-white transition-colors"
                title={isTimerRunning ? '일시정지' : '시작'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setTimerSeconds((prev) => prev + 5 * 60)}
                className="text-xs text-indigo-400 hover:text-indigo-300 px-1 py-0.5 rounded bg-slate-800"
                title="5분 추가"
              >
                +5m
              </button>
            </div>

            {/* Voting Open/Close Toggle (Clean Button, No Notification Banner) */}
            <button
              onClick={onToggleVoting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isVotingOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isVotingOpen ? 'fill-current' : ''}`} />
              <span>{isVotingOpen ? '투표 마감' : '투표 열기'}</span>
            </button>

            {/* 15 Teams Presentation Master Button */}
            <button
              onClick={() => onStartTeamPresentation(0)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Tv className="w-4 h-4 fill-current" />
              <span>발표 모드</span>
            </button>

            {/* Data Export Button */}
            {onExportJson && (
              <button
                onClick={onExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                title="결과 데이터 백업"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">데이터 백업</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* ================= COMPACT HERO METRICS ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Metric 1 */}
          <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>15개 분임조 제출 현황</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{submittedTeamsCount}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 15개 분임조</span>
              <span className="ml-auto text-xs font-black text-emerald-400">{submissionRate}%</span>
            </div>
            <div className="mt-2.5 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${submissionRate}%` }}
              />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>실시간 총 투표수</span>
              <Heart className="w-4 h-4 text-rose-400 fill-current" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalVotes}</span>
              <span className="text-xs text-slate-400 font-semibold">표 누적</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              15개 분임조 동료 상호 평가 집계
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>제출 완료 분임조</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{submittedTeamsCount}</span>
              <span className="text-xs text-slate-400 font-semibold">개 완료</span>
            </div>
            <div className="mt-2 text-xs text-amber-400 font-medium">
              {TOTAL_TEAMS - submittedTeamsCount > 0
                ? `${TOTAL_TEAMS - submittedTeamsCount}개 분임조 작성 대기 중`
                : '15개 분임조 전원 제출 완료!'}
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
              <span>라이브 코드 런너</span>
              <Play className="w-4 h-4 text-emerald-400 fill-current" />
            </div>
            <div className="mt-1 text-xs text-slate-300">
              클릭 즉시 브라우저 샌드박스에서 구동
            </div>
            <div className="text-[11px] font-mono text-cyan-400 mt-1">
              Python / JS / HTML / SQL 지원
            </div>
          </div>
        </section>

        {/* ================= TABBED NAVIGATION BAR ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tab 1: Tweet-style Code Feed */}
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'feed'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-850'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>💬 코드 피드 (트윗 뷰)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-200 border border-indigo-700">
                {submissions.length}
              </span>
            </button>

            {/* Tab 2: 15 Teams Activities & Presentations */}
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'teams'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-850'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 15개 분임조 활동 & 발표</span>
            </button>

            {/* Tab 3: Analytics Board (Milestone-free) */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-850'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>📊 조별 제출 현황 & 통계</span>
            </button>

            {/* Tab 4: Podium / Leaderboard */}
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-850'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>🏆 실시간 순위 (명예의 전당)</span>
            </button>
          </div>

          {/* Quick Present Button */}
          <button
            onClick={() => onStartTeamPresentation(0)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Tv className="w-4 h-4 fill-current" />
            <span>라이브 무대 열기</span>
          </button>
        </div>

        {/* ================= TAB 1: TWEET-STYLE CODE FEED ================= */}
        {activeTab === 'feed' && (
          <TweetCodeFeed
            submissions={submissions}
            onSelectSubmission={onSelectSubmission}
            onVote={onVote}
            votedIds={votedIds}
            onRunCode={onSelectSubmission}
          />
        )}

        {/* ================= TAB 2: 15 TEAMS ACTIVITIES & BEST SHOWCASE ================= */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <TeamActivitiesGrid
              teams={teams}
              submissions={submissions}
              onStartPresentation={onStartTeamPresentation}
              onSelectSubmission={onSelectSubmission}
              onVoteTeam={onVoteTeam}
              votedIds={votedIds}
            />

            <BestCodeLiveShowcase
              topSubmissions={topSubmissions}
              onSelectSubmission={onSelectSubmission}
              onVote={onVote}
              votedIds={votedIds}
              isVotingOpen={isVotingOpen}
            />
          </div>
        )}

        {/* ================= TAB 3: SUBMISSION ANALYTICS BOARD (MILESTONE-FREE) ================= */}
        {activeTab === 'analytics' && (
          <SubmissionAnalyticsBoard
            submissions={submissions}
            selectedTeam={selectedTeam}
            onSelectTeam={(team) => setSelectedTeam(team)}
          />
        )}

        {/* ================= TAB 4: LEADERBOARD PODIUM ================= */}
        {activeTab === 'leaderboard' && (
          <LeaderboardPodium
            topSubmissions={topSubmissions}
            onSelectSubmission={onSelectSubmission}
          />
        )}
      </main>
    </div>
  );
};
