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
} from 'lucide-react';
import { TeamActivity, ProductivityCategory, CodeSubmission } from '../types';
import { CodeRunner } from './CodeRunner';

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
  excel_automation: '엑셀/데이터 자동화',
  email_document: '이메일/문서 자동화',
  data_analysis: '데이터 분석/SQL',
  cs_support: 'CS/고객응대 챗봇',
  internal_tools: '사내도구/온보딩',
  workflow_macro: '반복 매크로',
};

export const TeamActivitiesGrid: React.FC<TeamActivitiesGridProps> = ({
  teams,
  submissions,
  onStartPresentation,
  onStartTeamPresentation,
  onSelectSubmission,
  onVoteTeam,
  votedIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedTeamCodeId, setExpandedTeamCodeId] = useState<string | null>(null);

  const handleStartPresentation = (teamId: string, index: number) => {
    if (onStartTeamPresentation) {
      onStartTeamPresentation(teamId);
    } else if (onStartPresentation) {
      onStartPresentation(index);
    }
  };

  const filteredTeams = teams.filter((t) => {
    if (selectedCategory === 'ALL') return true;
    return t.category === selectedCategory;
  });

  const completedCount = teams.filter((t) => t.presentationStatus === 'completed').length;
  const presentingTeam = teams.find((t) => t.presentationStatus === 'presenting');

  return (
    <div className="space-y-4">
      {/* Top Overview Banner */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-white">
              15개 조별 활동 & 발표 프로젝트 보드
            </h3>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              {completedCount} / 15팀 발표 완료
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            15개 조가 발굴한 실무 자동화 대표 프로젝트를 확인하고 무대 발표를 진행합니다.
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

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
          }`}
        >
          전체 15개 조 ({teams.length})
        </button>
        {Object.entries(CATEGORY_NAMES).map(([catKey, label]) => {
          const count = teams.filter((t) => t.category === catKey).length;
          if (count === 0) return null;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === catKey
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* 15 Teams Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => {
          const isPresenting = team.presentationStatus === 'presenting';
          const isCompleted = team.presentationStatus === 'completed';

          return (
            <div
              key={team.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isPresenting
                  ? 'bg-slate-900 border-amber-500/80 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500/50'
                  : isCompleted
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/60 border-slate-850 hover:border-slate-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-indigo-600 text-white">
                      제 {team.teamNumber} 분임조
                    </span>
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
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400">
                        대기
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Name & Slogan */}
                <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                  {team.teamName}
                </h4>
                <p className="text-xs text-amber-300 font-medium mt-1">
                  "{team.slogan}"
                </p>

                {/* Problem Statement */}
                <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-850 text-xs text-slate-300 line-clamp-2">
                  <span className="text-rose-400 font-bold">문제: </span>
                  {team.problemStatement}
                </div>

                {/* Impact */}
                <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 shrink-0" />
                  <span className="truncate">{team.productivityImpact}</span>
                </div>

                {/* Inline Runner Expansion */}
                {expandedTeamCodeId === team.id && (
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
                  <button
                    onClick={() =>
                      setExpandedTeamCodeId(expandedTeamCodeId === team.id ? null : team.id)
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
                  >
                    <Play className="w-3 h-3 fill-current text-emerald-400" />
                    <span>{expandedTeamCodeId === team.id ? '코드 닫기' : '미리 구동'}</span>
                  </button>

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
    </div>
  );
};
