import React from 'react';
import {
  Target,
  Layers,
  Activity,
  Code2,
} from 'lucide-react';
import { CodeSubmission } from '../types';
import { formatTeamName } from '../utils/teamUtils';

interface SubmissionAnalyticsBoardProps {
  submissions: CodeSubmission[];
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
}

export const SubmissionAnalyticsBoard: React.FC<SubmissionAnalyticsBoardProps> = ({
  submissions,
  selectedTeam,
  onSelectTeam,
}) => {
  const TOTAL_TEAMS = 15;

  // Map each team to its submitted project (if any)
  const teamSubmissionsMap: Record<number, CodeSubmission | undefined> = {};
  for (let i = 1; i <= 15; i++) {
    teamSubmissionsMap[i] = submissions.find((s) => {
      const match = String(s.team).match(/\d+/);
      return match ? parseInt(match[0], 10) === i : false;
    });
  }

  const submittedTeamsCount = Object.values(teamSubmissionsMap).filter(Boolean).length;
  const pendingTeamsCount = TOTAL_TEAMS - submittedTeamsCount;
  const progressPercent = Math.min(100, Math.round((submittedTeamsCount / TOTAL_TEAMS) * 100));

  // Language/Tool distribution
  const languageCounts: Record<string, number> = {};
  submissions.forEach((s) => {
    const lang = (s.language || 'other').toUpperCase();
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  });

  const languageColors: Record<string, { label: string; bar: string; text: string }> = {
    PYTHON: { label: 'Python (데이터/업무)', bar: 'bg-emerald-500', text: 'text-emerald-400' },
    JAVASCRIPT: { label: 'JavaScript / Node', bar: 'bg-amber-500', text: 'text-amber-400' },
    HTML: { label: 'HTML / 웹 대시보드', bar: 'bg-cyan-500', text: 'text-cyan-400' },
    SQL: { label: 'SQL / 데이터 쿼리', bar: 'bg-purple-500', text: 'text-purple-400' },
    OTHER: { label: '기타 스크립트', bar: 'bg-slate-500', text: 'text-slate-400' },
  };

  // Recent submissions for live ticker
  const recentSubmissions = [...submissions]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 15 Teams Progress Banner (Clean & Milestone-Free) */}
      <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                15개 분임조 과제 제출 현황
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                전체 15개 분임조의 실시간 제출 상태를 집계합니다.
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{submittedTeamsCount}</span>
            <span className="text-sm font-bold text-slate-400">/ {TOTAL_TEAMS}개 분임조</span>
            <span className="ml-2 text-base sm:text-lg font-black text-emerald-400">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar (Milestones removed) */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2-Columns Grid: 15 Teams Matrix (Left) & Submission Summary & Tech Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 15 Teams Matrix (7 cols) */}
        <div className="lg:col-span-7 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              15개 분임조 제출 상태
            </span>
            <span className="text-[11px] text-slate-400">
              클릭 시 해당 분임조 필터링
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((teamNum) => {
              const sub = teamSubmissionsMap[teamNum];
              const isSubmitted = !!sub;
              const teamDisplayName = `제 ${teamNum} 분임조`;
              const isSelected = selectedTeam === `${teamNum}조` || selectedTeam === teamDisplayName;

              return (
                <button
                  key={teamNum}
                  onClick={() => onSelectTeam(isSelected ? 'ALL' : `${teamNum}조`)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[76px] ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40 scale-105 z-10'
                      : isSubmitted
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-200 hover:border-emerald-500/80'
                      : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold w-full">
                    <span className="tracking-tight">{teamDisplayName}</span>
                    {isSubmitted ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        제출완료
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50">
                        대기
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    {isSubmitted ? (
                      <div>
                        <div
                          className={`text-[11px] font-medium truncate ${
                            isSelected ? 'text-white' : 'text-emerald-300'
                          }`}
                        >
                          {sub?.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>{sub?.language}</span>
                          <span className="font-bold text-amber-400">♥ {sub?.votes}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-medium">
                        과제 작성 중
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Submission Summary & Tech Stack Distribution (5 cols) */}
        <div className="lg:col-span-5 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" />
              개발 언어 및 제출 현황
            </span>
            <span className="text-[11px] text-slate-400">총 {submittedTeamsCount}개 분임조 제출</span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[11px]">제출 완료</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                {submittedTeamsCount} <span className="text-xs font-normal text-slate-400">/ 15</span>
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[11px]">작성 대기</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">
                {pendingTeamsCount} <span className="text-xs font-normal text-slate-400">/ 15</span>
              </div>
            </div>
          </div>

          {/* Language Breakdown */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[11px] font-semibold text-slate-400">사용 언어/도구 분포</div>
            {Object.keys(languageCounts).length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl border border-slate-850">
                아직 제출된 과제가 없습니다.
              </div>
            ) : (
              Object.entries(languageCounts).map(([lang, count]) => {
                const meta = languageColors[lang] || languageColors.OTHER;
                const percent =
                  submittedTeamsCount > 0
                    ? Math.round((count / submittedTeamsCount) * 100)
                    : 0;

                return (
                  <div key={lang} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-300">{meta.label}</span>
                      <span className="text-slate-400">
                        <strong className="text-white">{count}개</strong> ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Live Submission Ticker */}
      <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            실시간 제출 알림:
          </span>
        </div>

        <div className="flex-1 flex items-center gap-3 overflow-x-auto text-[11px] text-slate-400">
          {recentSubmissions.length === 0 ? (
            <span className="text-slate-500">현재 접수된 제출 내역이 없습니다.</span>
          ) : (
            recentSubmissions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 shrink-0"
              >
                <span className="font-bold text-indigo-300">{formatTeamName(s.team)}</span>
                <span className="text-slate-500">·</span>
                <span className="text-white truncate max-w-[180px]">{s.title}</span>
                <span className="text-emerald-400 font-bold">({s.votes}표)</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

