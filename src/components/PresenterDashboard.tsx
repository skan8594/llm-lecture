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
  FileSpreadsheet,
  BarChart3,
  Database,
  BookOpen,
} from 'lucide-react';
import { CodeSubmission, TeamActivity, SampleDataset } from '../types';
import { LeaderboardPodium } from './LeaderboardPodium';
import { BestCodeLiveShowcase } from './BestCodeLiveShowcase';
import { SubmissionAnalyticsBoard } from './SubmissionAnalyticsBoard';
import { TeamActivitiesGrid } from './TeamActivitiesGrid';
import { TweetCodeFeed } from './TweetCodeFeed';
import { DatasetManager } from './DatasetManager';
import { SampleWaferDashboard } from './SampleWaferDashboard';
import { CurriculumManager } from './CurriculumManager';
import { formatTeamName, getTeamNumber } from '../utils/teamUtils';
import { isTeamSubmitted } from '../data/teamData';

interface PresenterDashboardProps {
  teams: TeamActivity[];
  submissions: CodeSubmission[];
  datasets?: SampleDataset[];
  onAddDataset?: (newDataset: Omit<SampleDataset, 'id' | 'uploadedAt'>) => void;
  onDeleteDataset?: (id: string) => void;
  onResetDatasets?: () => void;
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
  firebaseConnected?: boolean;
  sessionId?: string;
  onOpenFirebaseModal?: () => void;
}

export const PresenterDashboard: React.FC<PresenterDashboardProps> = ({
  teams,
  submissions,
  datasets = [],
  onAddDataset,
  onDeleteDataset,
  onResetDatasets,
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
  firebaseConnected = true,
  sessionId = '2026onboarding',
  onOpenFirebaseModal,
}) => {
  // Dynamic team count
  const maxTeamNumInSubmissions = Math.max(
    ...submissions.map((s) => getTeamNumber(s.team)),
    0
  );
  const totalTeams = Math.max(teams.length, maxTeamNumInSubmissions, 32);

  // Teams submission status map (based on actual submissions and registered team info)
  const teamSubmissionMap: Record<number, boolean> = {};
  submissions.forEach((s) => {
    const num = getTeamNumber(s.team);
    if (num >= 1) {
      teamSubmissionMap[num] = true;
    }
  });
  teams.forEach((t) => {
    if (isTeamSubmitted(t, submissions)) {
      teamSubmissionMap[t.teamNumber] = true;
    }
  });

  const submittedTeamsCount = Object.keys(teamSubmissionMap).length;
  const pendingTeamsCount = Math.max(0, totalTeams - submittedTeamsCount);
  const submissionRate = Math.min(100, Math.round((submittedTeamsCount / totalTeams) * 100));
  const totalVotes = submissions.reduce((acc, s) => acc + s.votes, 0);

  // Tabbed view: 'feed' (Tweet style), 'teams', 'analytics', 'leaderboard', 'datasets', 'sample_dashboard', 'curriculum'
  const [activeTab, setActiveTab] = useState<'feed' | 'teams' | 'analytics' | 'leaderboard' | 'datasets' | 'sample_dashboard' | 'curriculum'>('feed');

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
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Mode */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md font-black text-xs">
              LLM
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                LLM 생산성 해커톤
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                강사용
              </span>
              {onOpenFirebaseModal && (
                <button
                  onClick={onOpenFirebaseModal}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all hover:scale-102"
                  title="Firebase 2026onboarding 실시간 동기화 상세 보기"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono">Firebase: {sessionId}</span>
                </button>
              )}
            </div>
          </div>

          {/* Instructor Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Timer Widget */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-bold text-white">{formatTimer(timerSeconds)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-slate-400 hover:text-white transition-colors"
                title={isTimerRunning ? '일시정지' : '시작'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setTimerSeconds((prev) => prev + 5 * 60)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 px-1 py-0.5 rounded bg-slate-800 font-mono"
                title="5분 추가"
              >
                +5m
              </button>
            </div>

            {/* Voting Open/Close Toggle */}
            <button
              onClick={onToggleVoting}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                isVotingOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isVotingOpen ? 'fill-current' : ''}`} />
              <span>{isVotingOpen ? '투표 마감' : '투표 열기'}</span>
            </button>

            {/* Presentation Stage Master Button */}
            <button
              onClick={() => onStartTeamPresentation(0)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Tv className="w-3.5 h-3.5 fill-current" />
              <span>발표 무대</span>
            </button>

            {/* Curriculum Quick Shortcut */}
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
              }`}
              title="교육 커리큘럼 및 강의안 파일 보기"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">커리큘럼 & 강의안</span>
            </button>

            {/* Data Export Button */}
            {onExportJson && (
              <button
                onClick={onExportJson}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                title="데이터 백업"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">백업</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* ================= COMPACT HERO METRICS (MINIMAL TEXT) ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Metric 1 */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
              <span>취합 현황 (제출 기준)</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-black text-white">{submittedTeamsCount}</span>
              <span className="text-xs text-slate-400">/ 최대 {totalTeams}팀</span>
              <span className="ml-auto text-xs font-black text-emerald-400">{submissionRate}%</span>
            </div>
            <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${submissionRate}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>취합 완료 {submittedTeamsCount}팀</span>
              <span>대기 {pendingTeamsCount}팀</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
              <span>총 투표수</span>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
            </div>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-black text-white">{totalVotes}</span>
              <span className="text-xs text-slate-400">표</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 truncate">
              동료 평가 합계
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
              <span>완료 / 미제출</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-black text-emerald-400">{submittedTeamsCount}</span>
              <span className="text-xs text-slate-400">/ 미제출 {pendingTeamsCount}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 truncate">
              {pendingTeamsCount === 0 ? '전원 제출 완료' : `${pendingTeamsCount}팀 작성 중`}
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold">
              <span>코드 런너</span>
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            </div>
            <div className="mt-1 text-xs font-bold text-white truncate">
              브라우저 샌드박스
            </div>
            <div className="text-[10px] font-mono text-cyan-400">
              Python · JS · HTML · SQL
            </div>
          </div>
        </section>

        {/* ================= TABBED NAVIGATION BAR ================= */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
          <div className="flex flex-wrap items-center gap-1">
            {/* Tab 1: Tweet-style Code Feed */}
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'feed'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>💬 코드 피드</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-200 border border-indigo-700">
                {submissions.length}
              </span>
            </button>

            {/* Tab 2: Teams Activities & Presentations */}
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'teams'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 팀별 활동 & 발표</span>
            </button>

            {/* Tab 3: Analytics Board */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📊 현황 & 통계</span>
            </button>

            {/* Tab 4: Podium / Leaderboard */}
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>🏆 실시간 순위</span>
            </button>

            {/* Tab 5: Dataset Management (CSV) */}
            <button
              onClick={() => setActiveTab('datasets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'datasets'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>📁 실습 데이터 관리</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700">
                {datasets.length}
              </span>
            </button>

            {/* Tab 6: Sample Deliverable Dashboard Benchmark */}
            <button
              onClick={() => setActiveTab('sample_dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sample_dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>🔬 결과물 대시보드 예시</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700">
                Live
              </span>
            </button>

            {/* Tab 7: Curriculum & Lecture Materials */}
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>📚 교육 커리큘럼 & 강의안</span>
            </button>
          </div>

          {/* Quick Present Button */}
          <button
            onClick={() => onStartTeamPresentation(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
          >
            <Tv className="w-3.5 h-3.5 fill-current" />
            <span>발표 무대 열기</span>
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

        {/* ================= TAB 2: TEAMS ACTIVITIES & BEST SHOWCASE ================= */}
        {activeTab === 'teams' && (
          <div className="space-y-5">
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

        {/* ================= TAB 3: SUBMISSION ANALYTICS BOARD ================= */}
        {activeTab === 'analytics' && (
          <SubmissionAnalyticsBoard
            submissions={submissions}
            selectedTeam={selectedTeam}
            onSelectTeam={(team) => setSelectedTeam(team)}
            totalTeams={totalTeams}
            teams={teams}
          />
        )}

        {/* ================= TAB 4: LEADERBOARD PODIUM ================= */}
        {activeTab === 'leaderboard' && (
          <LeaderboardPodium
            topSubmissions={topSubmissions}
            onSelectSubmission={onSelectSubmission}
          />
        )}

        {/* ================= TAB 5: DATASET MANAGEMENT (CSV) ================= */}
        {activeTab === 'datasets' && (
          <DatasetManager
            datasets={datasets}
            onAddDataset={onAddDataset || (() => {})}
            onDeleteDataset={onDeleteDataset || (() => {})}
            onResetDatasets={onResetDatasets || (() => {})}
          />
        )}

        {/* ================= TAB 6: SAMPLE DELIVERABLE DASHBOARD BENCHMARK ================= */}
        {activeTab === 'sample_dashboard' && (
          <div className="space-y-4">
            <SampleWaferDashboard
              dataset={
                datasets.find(
                  (d) => d.id === 'dataset-wafer-defect-map-spatial' || d.fileName.includes('wafer_300mm')
                ) || datasets[0]
              }
              isEmbedded={true}
            />
          </div>
        )}

        {/* ================= TAB 7: CURRICULUM & LECTURE MATERIALS ================= */}
        {activeTab === 'curriculum' && (
          <CurriculumManager />
        )}
      </main>
    </div>
  );
};
