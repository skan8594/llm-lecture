import React, { useState } from 'react';
import {
  Heart,
  Play,
  Copy,
  Check,
  Code2,
  Share2,
  Terminal,
  Search,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { CodeSubmission } from '../types';
import { formatTeamName, formatTeamHandle, getTeamNumber } from '../utils/teamUtils';

interface TweetCodeFeedProps {
  submissions: CodeSubmission[];
  onSelectSubmission: (submission: CodeSubmission) => void;
  onVote: (submissionId: string) => void;
  votedIds: Set<string>;
  onRunCode?: (submission: CodeSubmission) => void;
}

export const TweetCodeFeed: React.FC<TweetCodeFeedProps> = ({
  submissions,
  onSelectSubmission,
  onVote,
  votedIds,
  onRunCode,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'latest' | 'votes'>('votes');

  const handleCopyCode = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return `${Math.floor(diff / 3600)}시간 전`;
  };

  const filteredSubmissions = submissions
    .filter((sub) => {
      const teamNum = getTeamNumber(sub.team);
      const matchTeam =
        selectedTeamFilter === 'ALL' || String(teamNum) === selectedTeamFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        sub.title.toLowerCase().includes(q) ||
        (sub.description || '').toLowerCase().includes(q) ||
        (sub.code || '').toLowerCase().includes(q) ||
        formatTeamName(sub.team).toLowerCase().includes(q);
      return matchTeam && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  // Team Avatar Color Mapping
  const getAvatarGradient = (teamNum: number) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-cyan-600 to-blue-600',
      'from-rose-600 to-red-600',
      'from-violet-600 to-purple-600',
      'from-lime-600 to-emerald-600',
    ];
    return gradients[(teamNum - 1) % gradients.length];
  };

  return (
    <div className="space-y-4">
      {/* Feed Filter & Sort Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-black text-white tracking-wide">
            실시간 코드 트윗 피드
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {filteredSubmissions.length}개 포스트
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Team Filter Dropdown */}
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">전체 분임조</option>
            {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={String(num)}>
                제 {num} 분임조
              </option>
            ))}
          </select>

          {/* Sort Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setSortBy('votes')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                sortBy === 'votes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              최다 득표순
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                sortBy === 'latest'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              최신순
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="코드, 업무 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Tweet-style Stream */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <Code2 className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">표시할 코드 트윗이 없습니다.</p>
          <p className="text-xs text-slate-500">각 분임조에서 과제를 제출하면 실시간으로 피드에 게시됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSubmissions.map((sub) => {
            const teamNum = getTeamNumber(sub.team);
            const teamDisplay = formatTeamName(sub.team);
            const teamHandle = formatTeamHandle(sub.team);
            const hasVoted = votedIds.has(sub.id);
            const codeLines = (sub.code || '').split('\n');
            const previewLines = codeLines.slice(0, 7).join('\n');
            const totalLines = codeLines.length;

            return (
              <article
                key={sub.id}
                onClick={() => onSelectSubmission(sub)}
                className="bg-slate-900/95 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 transition-all shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between group"
              >
                {/* Tweet Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      {/* Team Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                          teamNum
                        )} flex items-center justify-center font-black text-sm text-white shadow-md shadow-indigo-500/10 shrink-0`}
                      >
                        {teamNum}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-white text-sm tracking-tight group-hover:text-indigo-300 transition-colors">
                            {teamDisplay}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{teamHandle}</span>
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="text-xs text-slate-400">
                            {getRelativeTime(sub.createdAt || Date.now())}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                            #{sub.language || 'CODE'}
                          </span>
                          {sub.votes > 5 && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🔥 인기 과제
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSubmission(sub);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="전체 상세보기"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tweet Body (Title & Description) */}
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-200 transition-colors">
                      {sub.title}
                    </h4>
                    {sub.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {sub.description}
                      </p>
                    )}
                  </div>

                  {/* Embedded Code Snippet (Tweet Card Media Look) */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 font-mono text-[11px] mb-3 group/code">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                        <span className="ml-1 text-slate-300 font-bold uppercase">{sub.language}</span>
                      </div>
                      <span className="text-slate-500">{totalLines} lines</span>
                    </div>

                    <pre className="p-3 text-emerald-300/90 overflow-x-auto max-h-36 leading-relaxed select-all">
                      <code>{previewLines}</code>
                    </pre>

                    {totalLines > 7 && (
                      <div className="px-3 py-1 bg-gradient-to-t from-slate-950 to-transparent text-[10px] text-indigo-400 font-bold text-center border-t border-slate-900">
                        + {totalLines - 7}줄 더보기 (클릭 시 실행 및 전체 열람)
                      </div>
                    )}
                  </div>
                </div>

                {/* Tweet Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  {/* Heart / Vote */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(sub.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                      hasVoted
                        ? 'text-rose-400 bg-rose-500/20 border border-rose-500/40'
                        : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                    <span>{sub.votes}</span>
                  </button>

                  {/* Run Code Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRunCode) onRunCode(sub);
                      else onSelectSubmission(sub);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 hover:border-emerald-500 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>실행</span>
                  </button>

                  {/* Copy Code Button */}
                  <button
                    onClick={(e) => handleCopyCode(sub.code, sub.id, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                  >
                    {copiedId === sub.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>코드 복사</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
