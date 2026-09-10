import React, { useState } from 'react';
import {
  Users,
  Presentation,
  Play,
  Heart,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Filter,
  Trophy,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { TeamActivity, ProductivityCategory, CodeSubmission } from '../types';
import { CodeRunner } from './CodeRunner';
import { isTeamSubmitted } from '../data/teamData';

interface TeamActivitiesGridProps {
  teams: TeamActivity[];
  submissions?: CodeSubmission[];
  onStartPresentation?: (teamIndex: number) => void;
  onStartTeamPresentation?: (teamId: string) => void;
  onSelectSubmission?: (sub: CodeSubmission) => void;
  onVoteTeam?: (teamId: string) => void;
  votedIds?: Set<string>;
}

const CATEGORY_NAMES: Record<ProductivityCategory, string> = {
  yield_defect: '수율/결함 개선',
  process_optimization: '공정 최적화',
  equipment_fdc: '설비/FDC 이상감지',
  metrology_qa: '계측/품질 검사',
  lot_logistics: '물류/Q-Time 최적화',
  utility_safety: 'FAB 유틸리티/안전',
};

export const TeamActivitiesGrid: React.FC<TeamActivitiesGridProps> = ({
  teams,
  submissions = [],
  onStartPresentation,
  onStartTeamPresentation,
  onSelectSubmission,
  onVoteTeam,
  votedIds,
}) => {
  // Status filter: 'SUBMITTED' (default) vs 'ALL' vs 'UNSUBMITTED'
  const [statusFilter, setStatusFilter] = useState<'SUBMITTED' | 'ALL' | 'UNSUBMITTED'>('SUBMITTED');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedTeamCodeId, setExpandedTeamCodeId] = useState<string | null>(null);

  const handleStartPresentation = (teamId: string, index: number) => {
    if (onStartTeamPresentation) {
      onStartTeamPresentation(teamId);
    } else if (onStartPresentation) {
      onStartPresentation(index);
    }
  };

  const submittedTeams = teams.filter((t) => isTeamSubmitted(t, submissions));
  const unsubmittedTeams = teams.filter((t) => !isTeamSubmitted(t, submissions));

  // Filter based on status filter first
  const statusFiltered =
    statusFilter === 'SUBMITTED'
      ? submittedTeams
      : statusFilter === 'UNSUBMITTED'
      ? unsubmittedTeams
      : teams;

  // Filter based on selected category next
  const filteredTeams = statusFiltered.filter((t) => {
    if (selectedCategory === 'ALL') return true;
    return t.category === selectedCategory;
  });

  const completedCount = teams.filter((t) => t.presentationStatus === 'completed').length;
  const presentingTeam = teams.find((t) => t.presentationStatus === 'presenting');

  return (
    <div className="space-y-4">
      {/* Top Overview Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-black text-white">
              팀별 활동 & 발표 프로젝트 보드
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              취합 완료: {submittedTeams.length} / 최대 {teams.length}팀
            </span>
            {completedCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                발표 완료: {completedCount}팀
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            교육생이 접속하여 제출한 팀 정보를 실시간으로 취합하여 표시합니다. (임의 카테고리 사전 배정 제외)
          </p>
        </div>

        {presentingTeam && (
          <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-600/50 px-3.5 py-2 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div>
              <div className="text-[11px] font-bold text-amber-300">현재 무대 발표 진행 중</div>
              <div className="text-xs font-black text-white">{presentingTeam.teamName}</div>
            </div>
            <button
              onClick={() => handleStartPresentation(presentingTeam.id, 0)}
              className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors ml-2"
            >
              발표 무대 이동
            </button>
          </div>
        )}
      </div>

      {/* Filter Row: Submission Status & Categories */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Status Toggle Tabs */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => {
              setStatusFilter('SUBMITTED');
              setSelectedCategory('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'SUBMITTED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>취합 완료</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {submittedTeams.length}
            </span>
          </button>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setSelectedCategory('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>전체 32개 조</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {teams.length}
            </span>
          </button>
          <button
            onClick={() => {
              setStatusFilter('UNSUBMITTED');
              setSelectedCategory('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'UNSUBMITTED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>미제출 대기</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {unsubmittedTeams.length}
            </span>
          </button>
        </div>

        {/* Category Tabs (Only displayed for categories that actually exist in the current status filtered list) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-950/60 hover:bg-slate-900 text-slate-400 border border-transparent'
            }`}
          >
            전체 분야 ({statusFiltered.length})
          </button>
          {Object.entries(CATEGORY_NAMES).map(([catKey, label]) => {
            const count = statusFiltered.filter((t) => t.category === catKey).length;
            if (count === 0) return null;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === catKey
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950/60 hover:bg-slate-900 text-slate-400 border border-transparent'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Teams Cards Grid */}
      {filteredTeams.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">해당 조건에 부합하는 조가 없습니다</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter === 'SUBMITTED'
              ? '교육생이 각 조 전용 워크스페이스에서 팀 정보나 코드를 등록하면 실시간으로 취합되어 이곳에 표시됩니다.'
              : '선택하신 카테고리 또는 상태 필터를 조정해보세요.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const isSubmitted = isTeamSubmitted(team, submissions);
            const isPresenting = team.presentationStatus === 'presenting';
            const isCompleted = team.presentationStatus === 'completed';

            // If team is not submitted, show waiting placeholder card
            if (!isSubmitted) {
              return (
                <div
                  key={team.id}
                  className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col justify-between min-h-[220px] transition-all hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-400">
                        제 {team.teamNumber} 조
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800/80 text-slate-500 border border-slate-700/50">
                        미제출 (대기)
                      </span>
                    </div>
                    <div className="mt-5 text-center py-3">
                      <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                      <div className="text-xs font-semibold text-slate-300">
                        팀 정보 등록 대기 중
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                        제 {team.teamNumber}조 워크스페이스에 접속하여 팀 기획안이나 코드를 등록하면 실시간으로 취합됩니다.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-850 flex items-center justify-between">
                    <a
                      href={`?team=${team.teamNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <span>워크스페이스 열기</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-[10px] text-slate-500 font-mono">team{team.teamNumber}</span>
                  </div>
                </div>
              );
            }

            // Submitted team: full interactive presentation card
            return (
              <div
                key={team.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPresenting
                    ? 'bg-slate-900 border-amber-500/80 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500/50'
                    : isCompleted
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/90 border-emerald-900/40 hover:border-emerald-700/60 shadow-sm'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-emerald-600 text-white">
                        제 {team.teamNumber} 조
                      </span>
                      <a
                        href={`?team=${team.teamNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`제 ${team.teamNumber}조 워크스페이스 새 탭 열기`}
                        className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {team.category && CATEGORY_NAMES[team.category] && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-950 text-indigo-300 border border-indigo-850">
                          {CATEGORY_NAMES[team.category]}
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div>
                      {isPresenting && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 animate-pulse">
                          발표 중
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          완료
                        </span>
                      )}
                      {team.presentationStatus === 'waiting' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                          취합 완료
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team Name & Slogan */}
                  <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                    {team.teamName}
                  </h4>
                  {team.slogan && (
                    <p className="text-xs text-amber-300 font-medium mt-1">
                      "{team.slogan}"
                    </p>
                  )}

                  {/* Problem Statement */}
                  {team.problemStatement && (
                    <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-850 text-xs text-slate-300 line-clamp-2">
                      <span className="text-rose-400 font-bold">문제: </span>
                      {team.problemStatement}
                    </div>
                  )}

                  {/* Impact */}
                  {team.productivityImpact && (
                    <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 shrink-0" />
                      <span className="truncate">{team.productivityImpact}</span>
                    </div>
                  )}

                  {/* Inline Runner Expansion */}
                  {expandedTeamCodeId === team.id && team.code && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <Play className="w-3 h-3 fill-current" />
                          {team.teamNumber}조 코드 라이브 샌드박스
                        </span>
                        <span className="text-[10px] uppercase font-mono">{team.language}</span>
                      </div>
                      <div className="h-60 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                        <CodeRunner
                          code={team.code}
                          language={team.language}
                          title={team.teamName}
                          sampleInput={team.sampleInput}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    {team.code && (
                      <button
                        onClick={() =>
                          setExpandedTeamCodeId(expandedTeamCodeId === team.id ? null : team.id)
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
                        <span>{expandedTeamCodeId === team.id ? '코드 닫기' : '미리 구동'}</span>
                      </button>
                    )}

                    {(() => {
                      const isVoted = votedIds?.has(`team_${team.id}_heart`);
                      return (
                        <button
                          onClick={() => onVoteTeam && onVoteTeam(team.id)}
                          title={isVoted ? '투표 완료 (클릭 시 취소)' : '1인 1회 투표'}
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 border ${
                            isVoted
                              ? 'bg-rose-950/80 border-rose-500 ring-1 ring-rose-500 text-white'
                              : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-900/50 text-rose-300'
                          }`}
                        >
                          <Heart className={`w-3 h-3 fill-current ${isVoted ? 'text-rose-400' : 'text-rose-400/80'}`} />
                          <span>{team.totalTeamVotes}</span>
                          {isVoted && <span className="text-[10px] text-rose-300 font-normal">✓</span>}
                        </button>
                      );
                    })()}
                  </div>

                  <button
                    onClick={() => handleStartPresentation(team.id, teams.indexOf(team))}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    발표 무대 진입
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
