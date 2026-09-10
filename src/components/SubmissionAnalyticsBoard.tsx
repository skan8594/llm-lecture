import React from 'react';
import {
  Target,
  Layers,
  Activity,
  Code2,
} from 'lucide-react';
import { CodeSubmission, TeamActivity } from '../types';
import { formatTeamName, getTeamNumber } from '../utils/teamUtils';
import { isTeamSubmitted } from '../data/teamData';

interface SubmissionAnalyticsBoardProps {
  submissions: CodeSubmission[];
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  totalTeams?: number;
  teams?: TeamActivity[];
}

export const SubmissionAnalyticsBoard: React.FC<SubmissionAnalyticsBoardProps> = ({
  submissions,
  selectedTeam,
  onSelectTeam,
  totalTeams = 32,
  teams = [],
}) => {
  // Dynamic team count determination
  const effectiveTotalTeams = totalTeams || 32;

  // Map each team to its submitted project or registered team info
  const teamSubmissionsMap: Record<number, { sub?: CodeSubmission; team?: TeamActivity; isSubmitted: boolean }> = {};
  for (let i = 1; i <= effectiveTotalTeams; i++) {
    const sub = submissions.find((s) => {
      const match = String(s.team).match(/\d+/);
      return match ? parseInt(match[0], 10) === i : false;
    });
    const team = teams.find((t) => t.teamNumber === i);
    const submitted = (team && isTeamSubmitted(team, submissions)) || !!sub;
    teamSubmissionsMap[i] = { sub, team, isSubmitted: !!submitted };
  }

  const submittedTeamsCount = Object.values(teamSubmissionsMap).filter((item) => item.isSubmitted).length;
  const pendingTeamsCount = Math.max(0, effectiveTotalTeams - submittedTeamsCount);
  const progressPercent = Math.min(100, Math.round((submittedTeamsCount / effectiveTotalTeams) * 100));

  // Language/Tool distribution
  const languageCounts: Record<string, number> = {};
  submissions.forEach((s) => {
    const lang = (s.language || 'other').toUpperCase();
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  });

  const languageColors: Record<string, { label: string; bar: string; text: string }> = {
    PYTHON: { label: 'Python', bar: 'bg-emerald-500', text: 'text-emerald-400' },
    JAVASCRIPT: { label: 'JavaScript', bar: 'bg-amber-500', text: 'text-amber-400' },
    HTML: { label: 'HTML / Web', bar: 'bg-cyan-500', text: 'text-cyan-400' },
    SQL: { label: 'SQL', bar: 'bg-purple-500', text: 'text-purple-400' },
    OTHER: { label: '기타', bar: 'bg-slate-500', text: 'text-slate-400' },
  };

  // Recent submissions for live ticker
  const recentSubmissions = [...submissions]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Dynamic Teams Progress Bar (Minimal Text) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white tracking-tight">
              제출 현황
            </h3>
          </div>

          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-xl sm:text-2xl font-black text-white">{submittedTeamsCount}</span>
            <span className="text-xs text-slate-400">/ {effectiveTotalTeams}팀</span>
            <span className="ml-2 text-sm font-black text-emerald-400">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2-Columns Grid: Teams Matrix (Left) & Summary & Tech Stack (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Teams Matrix (7 cols) */}
        <div className="lg:col-span-7 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              팀별 제출 상태
            </span>
            <span className="text-[10px] text-slate-500">
              클릭 시 필터
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: effectiveTotalTeams }, (_, i) => i + 1).map((teamNum) => {
              const item = teamSubmissionsMap[teamNum];
              const isSubmitted = item?.isSubmitted;
              const sub = item?.sub;
              const team = item?.team;
              const teamDisplayName = `제 ${teamNum} 조`;
              const isSelected = selectedTeam === `${teamNum}조` || selectedTeam === teamDisplayName;

              return (
                <button
                  key={teamNum}
                  onClick={() => onSelectTeam(isSelected ? 'ALL' : `${teamNum}조`)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[68px] ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md scale-[1.02] z-10'
                      : isSubmitted
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-200 hover:border-emerald-500/80'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold w-full">
                    <span className="tracking-tight">{teamDisplayName}</span>
                    {isSubmitted ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        취합 완료
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800/60 text-slate-500 border border-slate-700/50">
                        미제출
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5">
                    {isSubmitted ? (
                      <div>
                        <div
                          className={`text-[10px] font-medium truncate ${
                            isSelected ? 'text-white' : 'text-emerald-300'
                          }`}
                        >
                          {sub?.title || team?.teamName || '과제 등록 완료'}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>{sub?.language || team?.language || 'WEB'}</span>
                          <span className="font-bold text-amber-400">
                            ♥ {sub?.votes || team?.totalTeamVotes || 0}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-medium">
                        미제출
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Submission Summary & Tech Stack Distribution (5 cols) */}
        <div className="lg:col-span-5 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" />
              현황 및 언어
            </span>
            <span className="text-[10px] text-slate-400">{submittedTeamsCount}팀 제출</span>
          </div>

          {/* Minimal Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px]">제출 완료</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                {submittedTeamsCount} <span className="text-[10px] font-normal text-slate-500">/ {effectiveTotalTeams}</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px]">작성 대기</div>
              <div className="text-lg font-black text-amber-400 mt-0.5">
                {pendingTeamsCount} <span className="text-[10px] font-normal text-slate-500">/ {effectiveTotalTeams}</span>
              </div>
            </div>
          </div>

          {/* Language Breakdown (Super Minimal) */}
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-semibold text-slate-400">언어 분포</div>
            {Object.keys(languageCounts).length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                제출 과제 없음
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
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{meta.label}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        <strong className="text-white">{count}</strong> ({percent}%)
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

      {/* Live Submission Ticker (Super Minimal) */}
      <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2 text-xs">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-bold text-slate-300 text-[11px] shrink-0">
          최근 접수:
        </span>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto text-[10px] text-slate-400 no-scrollbar">
          {recentSubmissions.length === 0 ? (
            <span className="text-slate-500">접수된 과제가 없습니다.</span>
          ) : (
            recentSubmissions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0"
              >
                <span className="font-bold text-indigo-300">{formatTeamName(s.team)}</span>
                <span className="text-white truncate max-w-[140px]">{s.title}</span>
                <span className="text-emerald-400 font-bold">♥{s.votes}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
