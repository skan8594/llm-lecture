import React from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Play, Heart, Award } from 'lucide-react';
import { CodeSubmission } from '../types';
import { formatTeamName } from '../utils/teamUtils';

interface LeaderboardPodiumProps {
  topSubmissions: CodeSubmission[];
  onSelectSubmission: (submission: CodeSubmission) => void;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  topSubmissions,
  onSelectSubmission,
}) => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  if (topSubmissions.length === 0) return null;

  const first = topSubmissions[0];
  const second = topSubmissions[1];
  const third = topSubmissions[2];

  return (
    <div className="relative p-6 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Section Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              실시간 득표 명예의 전당 (Top 3)
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            15개 분임조의 실시간 득표 순위 상위 과제입니다.
          </p>
        </div>

        <button
          onClick={triggerConfetti}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          축하 폭죽 터뜨리기
        </button>
      </div>

      {/* Podium Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
        {/* 2nd Place (Silver) */}
        {second ? (
          <div
            onClick={() => onSelectSubmission(second)}
            className="group order-2 md:order-1 relative p-4 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer hover:shadow-lg hover:shadow-slate-700/20 text-center"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-slate-400 text-slate-950 font-black text-xs rounded-full shadow">
              2위🥈
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-400">{formatTeamName(second.team)}</div>
            <div className="font-bold text-sm text-slate-200 truncate mt-1 group-hover:text-white">
              {second.title}
            </div>
            <div className="flex items-center justify-center gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                {second.votes}표
              </span>
              <span className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-400 font-medium">
                <Play className="w-3 h-3" />
                실행하기
              </span>
            </div>
          </div>
        ) : (
          <div className="order-2 md:order-1" />
        )}

        {/* 1st Place (Gold) - taller and highlighted */}
        {first && (
          <div
            onClick={() => onSelectSubmission(first)}
            className="group order-1 md:order-2 relative p-5 bg-gradient-to-b from-amber-950/30 to-slate-950 border-2 border-amber-500/60 rounded-2xl transition-all cursor-pointer hover:shadow-xl hover:shadow-amber-500/20 text-center transform md:-translate-y-2"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-full shadow-lg flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              1위 대상 🥇
            </div>
            <div className="mt-2 text-xs font-bold text-amber-300">
              {formatTeamName(first.team)}
            </div>
            <div className="font-extrabold text-base text-white truncate mt-1 group-hover:text-amber-200">
              {first.title}
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">
              ⚡ {first.productivityImpact}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1 text-rose-400 font-extrabold text-sm">
                <Heart className="w-4 h-4 fill-current" />
                {first.votes}표
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                <Play className="w-3.5 h-3.5 fill-current" />
                코드 즉시 구동
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {third ? (
          <div
            onClick={() => onSelectSubmission(third)}
            className="group order-3 relative p-4 bg-slate-950/80 hover:bg-slate-800/80 border border-amber-800/40 rounded-xl transition-all cursor-pointer hover:shadow-lg text-center"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-amber-700 text-white font-black text-xs rounded-full shadow">
              3위🥉
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-400">{formatTeamName(third.team)}</div>
            <div className="font-bold text-sm text-slate-200 truncate mt-1 group-hover:text-white">
              {third.title}
            </div>
            <div className="flex items-center justify-center gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                {third.votes}표
              </span>
              <span className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-400 font-medium">
                <Play className="w-3 h-3" />
                실행하기
              </span>
            </div>
          </div>
        ) : (
          <div className="order-3" />
        )}
      </div>
    </div>
  );
};
