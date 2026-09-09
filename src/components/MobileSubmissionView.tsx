import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Heart,
  Play,
  CheckCircle,
  Smartphone,
  Trophy,
  Filter,
  Search,
  Code,
  FileCode,
  Clock,
  User,
  Building,
  RotateCcw,
  Loader2,
  AlertCircle,
  ExternalLink,
  Flame,
  Zap,
  Lightbulb,
  Wrench,
  Palette,
  Copy,
  Check,
  Users,
} from 'lucide-react';
import { CodeSubmission, CodeLanguage, ProductivityCategory, TeamActivity } from '../types';
import { CodeRunner } from './CodeRunner';

interface MobileSubmissionViewProps {
  teams?: TeamActivity[];
  submissions: CodeSubmission[];
  onSubmit: (sub: Partial<CodeSubmission>) => Promise<boolean>;
  onVote: (id: string, reactionType?: string) => void;
  onVoteTeam?: (teamId: string, tag?: 'innovation' | 'practicality' | 'presentation' | 'promptQuality') => void;
  votedIds: Set<string>;
  isVotingOpen: boolean;
  onSwitchToPresenter: () => void;
  onSelectSubmission: (sub: CodeSubmission) => void;
}

export const MobileSubmissionView: React.FC<MobileSubmissionViewProps> = ({
  teams = [],
  submissions,
  onSubmit,
  onVote,
  onVoteTeam,
  votedIds,
  isVotingOpen,
  onSwitchToPresenter,
  onSelectSubmission,
}) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'submit' | 'vote' | 'leaderboard' | 'top1'>('teams');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [promptCopiedId, setPromptCopiedId] = useState<string | null>(null);
  const [mobileTopIndex, setMobileTopIndex] = useState<number>(0);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [team, setTeam] = useState('3조');
  const [department, setDepartment] = useState('공정기술팀');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductivityCategory>('yield_defect');
  const [language, setLanguage] = useState<CodeLanguage>('javascript');
  const [promptUsed, setPromptUsed] = useState('');
  const [code, setCode] = useState('');
  const [productivityImpact, setProductivityImpact] = useState('');
  const [description, setDescription] = useState('');

  // AI Prompt Generator Helper
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiIdeaPrompt, setAiIdeaPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Testing runner state
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Voting search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');

  // Handle AI Code Generation
  const handleGenerateAiCode = async () => {
    if (!aiIdeaPrompt.trim()) return;
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: aiIdeaPrompt,
          language,
          category,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        if (data.title) setTitle(data.title);
        if (data.code) setCode(data.code);
        if (data.productivityImpact) setProductivityImpact(data.productivityImpact);
        if (data.description) setDescription(data.description);
        setPromptUsed(aiIdeaPrompt);
        setShowAiHelper(false);
        setAiIdeaPrompt('');
      } else {
        setAiError(json.error || 'AI 코드 생성에 실패했습니다.');
      }
    } catch (e: any) {
      setAiError(e.message || '네트워크 통신 오류');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle Submission Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !title.trim() || !code.trim()) {
      alert('이름, 과제 제목, 코드는 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    const ok = await onSubmit({
      authorName,
      employeeId: employeeId || `2026-${Math.floor(1000 + Math.random() * 9000)}`,
      team,
      department,
      title,
      category,
      language,
      promptUsed: promptUsed || 'LLM 업무 생산성 자동화 코드 생성',
      code,
      productivityImpact: productivityImpact || '주당 약 2~4시간 절감 효과',
      description: description || title,
    });

    setIsSubmitting(false);
    if (ok) {
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('vote'); // automatically go to voting tab
      }, 1800);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = selectedTeamFilter === 'ALL' || sub.team === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-xl mx-auto border-x border-slate-800 shadow-2xl">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              신입사원 LLM 해커톤
            </h1>
            <p className="text-[11px] text-slate-400">교육생 모드</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onSwitchToPresenter}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <span>강사용 (PC)</span>
            <ExternalLink className="w-3 h-3 text-indigo-400" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex bg-slate-900 border-b border-slate-800 sticky top-[53px] z-20 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-3 py-3 text-xs font-bold text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'teams'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          15개 조 활동
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900 text-indigo-200">
            {teams.length || 15}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('submit')}
          className={`px-3 py-3 text-xs font-bold text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'submit'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          내 코드 제출
        </button>

        <button
          onClick={() => setActiveTab('vote')}
          className={`px-3 py-3 text-xs font-bold text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'vote'
              ? 'border-rose-500 text-rose-400 bg-rose-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          코드 투표
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {submissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-3 py-3 text-xs font-bold text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'leaderboard'
              ? 'border-amber-500 text-amber-400 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          실시간 랭킹
        </button>

        <button
          onClick={() => setActiveTab('top1')}
          className={`px-3 py-3 text-xs font-bold text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'top1'
              ? 'border-yellow-400 text-yellow-300 bg-amber-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          1위 체험
        </button>
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {/* ================= TAB 0: 15 TEAMS ACTIVITIES ================= */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-700/50 rounded-2xl space-y-1.5 shadow-md">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white">15개 조별 실무 자동화 발표회</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                현재 대형 스크린에서 발표 중인 조를 확인하고, 4가지 항목으로 실시간 피어 평가를 남겨주세요.
              </p>
            </div>

            {/* Currently Presenting Team Banner if any */}
            {(() => {
              const activePresenting = teams.find((t) => t.presentationStatus === 'presenting');
              if (!activePresenting) return null;
              return (
                <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-2xl space-y-3 shadow-lg animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                        지금 발표 무대 진행 중!
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950">
                      {activePresenting.teamNumber}조
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-white">{activePresenting.teamName}</h4>
                    <p className="text-xs text-amber-200/90 mt-0.5">🎯 {activePresenting.slogan}</p>
                  </div>

                  {/* Quick Peer Score Buttons (Strict 1 vote per item) */}
                  <div className="pt-2 border-t border-amber-900/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300">
                        실시간 피어 평가 (총 {activePresenting.totalTeamVotes}표)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { key: 'innovation', label: '🚀 혁신성', color: 'indigo' },
                        { key: 'practicality', label: '🛠️ 실무 적용성', color: 'emerald' },
                        { key: 'presentation', label: '🎤 발표력', color: 'amber' },
                        { key: 'promptQuality', label: '💡 프롬프트', color: 'purple' },
                      ] as const).map(({ key, label, color }) => {
                        const isVoted = votedIds.has(`team_${activePresenting.id}_${key}`);
                        return (
                          <button
                            key={key}
                            onClick={() => onVoteTeam && onVoteTeam(activePresenting.id, key)}
                            className={`flex items-center justify-between p-2 rounded-xl text-left active:scale-95 transition-all border ${
                              isVoted
                                ? `bg-${color}-950/80 border-${color}-500 ring-1 ring-${color}-500 text-white shadow-sm`
                                : 'bg-slate-950 border-amber-900/50 hover:border-slate-700 text-slate-200'
                            }`}
                          >
                            <span className="text-xs font-bold">
                              {label} {isVoted && '✓'}
                            </span>
                            <span className={`text-xs font-black text-${color}-400`}>
                              {activePresenting.feedbackTags?.[key] || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* List of 15 Teams */}
            <div className="space-y-2.5">
              {teams.map((team) => {
                const isExpanded = expandedTeamId === team.id;
                const repSub = submissions.find(
                  (s) =>
                    s.id === team.representativeSubmissionId ||
                    s.team === `${team.teamNumber}조` ||
                    s.team === team.teamName
                );
                const teamCode = team.code || repSub?.code || '';
                const teamLang = (team.language || repSub?.language || 'html') as any;
                const isHeartVoted = votedIds.has(`team_${team.id}_heart`);

                return (
                  <div
                    key={team.id}
                    className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-indigo-600 text-white">
                            {team.teamNumber}조
                          </span>
                          {team.presentationStatus === 'presenting' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500 text-slate-950 animate-pulse">
                              발표 중
                            </span>
                          )}
                          {team.presentationStatus === 'completed' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                              발표 완료
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white">{team.teamName}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{team.slogan}</p>
                      </div>

                      <button
                        onClick={() => onVoteTeam && onVoteTeam(team.id)}
                        title={isHeartVoted ? '투표 완료 (재클릭 시 취소)' : '1인 1회 투표'}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all active:scale-95 ${
                          isHeartVoted
                            ? 'bg-rose-950/80 border-rose-500 ring-1 ring-rose-500 text-white'
                            : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-900/60 text-rose-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 fill-current ${isHeartVoted ? 'text-rose-400' : 'text-rose-400/80'}`} />
                        <span>{team.totalTeamVotes}</span>
                        {isHeartVoted && <span className="text-[10px] text-rose-300 font-normal">✓</span>}
                      </button>
                    </div>

                    {/* Expand/Collapse details and runner */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
                        {isExpanded ? '상세 접기' : '문제해결 & 코드 구동'}
                      </button>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>혁신 {team.feedbackTags?.innovation || 0}</span>·
                        <span>실무 {team.feedbackTags?.practicality || 0}</span>·
                        <span>발표 {team.feedbackTags?.presentation || 0}</span>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 animate-in fade-in">
                        {/* Problem */}
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                          <div className="text-[11px] font-bold text-rose-400 mb-1">
                            ⚠️ 실무 Pain Point:
                          </div>
                          <div className="text-xs text-slate-300">
                            {team.problemStatement || repSub?.description || team.slogan}
                          </div>
                        </div>

                        {/* Prompt Strategy */}
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                          <div className="text-[11px] font-bold text-indigo-400 mb-1">
                            ✨ LLM 프롬프트 전략:
                          </div>
                          <div className="text-xs text-slate-300 font-mono">
                            {team.llmPromptStrategy || repSub?.promptUsed || '업무 요구사항 맞춤 프롬프팅'}
                          </div>
                        </div>

                        {/* Mobile Code Runner */}
                        {teamCode ? (
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                            <div className="px-3 py-1.5 bg-slate-800 text-[11px] font-bold text-white flex items-center justify-between">
                              <span>📱 폰에서 즉시 실행</span>
                              <span className="text-emerald-400">실시간 구동 샌드박스</span>
                            </div>
                            <div className="min-h-[260px] p-1">
                              <CodeRunner
                                code={teamCode}
                                language={teamLang}
                                title={team.teamName}
                                sampleInput={team.sampleInput}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 1: CODE SUBMISSION ================= */}
        {activeTab === 'submit' && (
          <div className="space-y-4">
            {submitSuccess && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl text-center space-y-1 animate-in fade-in">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">코드 제출이 완료되었습니다!</h4>
                <p className="text-xs text-emerald-200">
                  대시보드 메인 화면에 반영되었습니다. 잠시 후 투표 화면으로 이동합니다.
                </p>
              </div>
            )}

            {/* AI Assistant Banner */}
            <div className="p-4 bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">AI 프롬프트 코드 생성 도우미</h3>
                    <p className="text-[11px] text-indigo-200">
                      아이디어만 입력하면 Gemini가 즉시 구동 코드를 만들어줍니다.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiHelper(!showAiHelper)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition-colors shrink-0"
                >
                  {showAiHelper ? '닫기' : '도우미 열기'}
                </button>
              </div>

              {showAiHelper && (
                <div className="mt-4 pt-3 border-t border-indigo-900/60 space-y-3">
                  <label className="block text-xs font-medium text-slate-300">
                    💡 어떤 업무를 자동화하고 싶으신가요?
                  </label>
                  <textarea
                    value={aiIdeaPrompt}
                    onChange={(e) => setAiIdeaPrompt(e.target.value)}
                    placeholder="예: 엑셀에서 부서별 출장비 영수증 합계를 구하고, 식대 3만원 초과 건을 빨간색으로 표시해주는 위젯"
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-indigo-800/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {aiError && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {aiError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerateAiCode}
                    disabled={isGeneratingAi || !aiIdeaPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Gemini가 코드를 설계 및 생성 중입니다...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI로 코드 및 프롬프트 자동 완성
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Participant Info */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  제출자 기본 정보
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">이름 *</label>
                    <input
                      type="text"
                      required
                      placeholder="김신입"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">사번</label>
                    <input
                      type="text"
                      placeholder="2026-0091"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">소속 조 *</label>
                    <select
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {Array.from({ length: 15 }, (_, i) => `${i + 1}조`).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">부서/팀</label>
                    <input
                      type="text"
                      placeholder="마케팅팀 / 개발팀 등"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Task Details */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  과제 및 생산성 효과
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">과제 / 도구 제목 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 법인카드 영수증 이상지출 실시간 탐지기"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">업무 카테고리</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductivityCategory)}
                      className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="yield_defect">🔬 수율 분석 & 결함 개선</option>
                      <option value="process_optimization">⚙️ 공정 파라미터 최적화</option>
                      <option value="equipment_fdc">🛡️ 설비 예지보전 & FDC</option>
                      <option value="metrology_qa">📐 계측 & 품질 검사</option>
                      <option value="lot_logistics">🔄 웨이퍼 물류 & Q-Time</option>
                      <option value="utility_safety">⚡ FAB 유틸리티 & 안전</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">실행 언어</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                      className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="html">🌐 HTML/JS 인터랙티브 위젯</option>
                      <option value="javascript">⚡ JavaScript (Node/Console)</option>
                      <option value="python">🐍 Python (분석/스크립트)</option>
                      <option value="sql">🗄️ SQL 데이터 쿼리</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">기대 생산성 효과</label>
                  <input
                    type="text"
                    placeholder="예: 수기 대조 2시간 -> 5초 완료 (주당 8시간 절감)"
                    value={productivityImpact}
                    onChange={(e) => setProductivityImpact(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    사용한 LLM 프롬프트 (신입사원이 실제로 LLM에 넣은 질의문)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="신입사원 관점에서 어떤 지시어와 제약조건을 주었는지 입력해주세요."
                    value={promptUsed}
                    onChange={(e) => setPromptUsed(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Code Editor */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    생성된 코드 본문 *
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowTestRunner(!showTestRunner)}
                    disabled={!code.trim()}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {showTestRunner ? '런너 닫기' : '미리 구동해보기'}
                  </button>
                </div>

                <textarea
                  rows={8}
                  required
                  placeholder="LLM이 생성한 코드를 이곳에 붙여넣으세요..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                />

                {/* In-page Test Runner */}
                {showTestRunner && code && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">
                      📱 폰 실시간 사전 테스트 결과:
                    </div>
                    <div className="h-64 rounded-lg overflow-hidden border border-slate-700">
                      <CodeRunner code={code} language={language} title={title} />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                코드 제출하기
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 2: LIVE VOTING ================= */}
        {activeTab === 'vote' && (
          <div className="space-y-4">
            {/* Search & Team Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="이름, 과제명, 팀으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedTeamFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedTeamFilter === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  전체
                </button>
                {Array.from({ length: 15 }, (_, i) => `${i + 1}조`).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTeamFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedTeamFilter === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {!isVotingOpen && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs text-center font-medium">
                현재 강사님에 의해 투표가 일시 중지 상태입니다.
              </div>
            )}

            {/* Submissions List */}
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const hasVoted = votedIds.has(sub.id);
                return (
                  <div
                    key={sub.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-md hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {sub.team}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            {sub.authorName} ({sub.department})
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{sub.title}</h4>
                      </div>

                      {/* Vote Button */}
                      <button
                        onClick={() => onVote(sub.id)}
                        disabled={!isVotingOpen}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all shrink-0 active:scale-90 ${
                          hasVoted
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700'
                        } disabled:opacity-50`}
                      >
                        <Heart className={`w-5 h-5 ${hasVoted ? 'fill-current text-white' : 'text-rose-400'}`} />
                        <span className="text-[11px] font-black mt-0.5">{sub.votes}</span>
                      </button>
                    </div>

                    <div className="text-xs text-emerald-400 font-medium">
                      ⚡ {sub.productivityImpact}
                    </div>

                    {/* Card Actions & Result Expander */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <button
                        type="button"
                        onClick={() => setExpandedResultId(expandedResultId === sub.id ? null : sub.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold border transition-colors ${
                          expandedResultId === sub.id
                            ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                            : 'bg-slate-950 hover:bg-slate-850 border-slate-700 text-slate-300'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{expandedResultId === sub.id ? '실행 결과 닫기' : '실행 결과 확인 & 평가'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectSubmission(sub)}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        상세 모달
                      </button>
                    </div>

                    {/* Inline Code Runner Preview & Reaction Voting */}
                    {expandedResultId === sub.id && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <Play className="w-3 h-3 fill-current" />
                            모바일 실시간 샌드박스 구동 결과
                          </span>
                          <span className="font-mono uppercase text-slate-500">{sub.language}</span>
                        </div>

                        {/* Mobile Runner Box */}
                        <div className="h-64 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                          <CodeRunner
                            code={sub.code}
                            language={sub.language}
                            title={sub.title}
                            sampleInput={sub.sampleInput}
                          />
                        </div>

                        {/* Prompt Snippet with Copy */}
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-indigo-400">사용한 LLM 프롬프트:</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(sub.promptUsed);
                                setPromptCopiedId(sub.id);
                                setTimeout(() => setPromptCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {promptCopiedId === sub.id ? (
                                <span className="text-emerald-400 font-bold">복사됨!</span>
                              ) : (
                                <span>복사</span>
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 font-mono line-clamp-2">
                            {sub.promptUsed}
                          </p>
                        </div>

                        {/* Reaction Badges for Voting */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-slate-300">
                            실행 결과를 확인하고 동료에게 리액션 투표를 남겨보세요:
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => onVote(sub.id, 'productivity')}
                              disabled={!isVotingOpen}
                              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border transition-all ${
                                hasVoted
                                  ? 'bg-rose-950/40 border-rose-800 text-rose-300 font-bold'
                                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                              } disabled:opacity-50`}
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              ⚡ 압도적 생산성
                            </button>
                            <button
                              type="button"
                              onClick={() => onVote(sub.id, 'prompt')}
                              disabled={!isVotingOpen}
                              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border transition-all ${
                                hasVoted
                                  ? 'bg-rose-950/40 border-rose-800 text-rose-300 font-bold'
                                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                              } disabled:opacity-50`}
                            >
                              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                              💡 기발한 프롬프트
                            </button>
                            <button
                              type="button"
                              onClick={() => onVote(sub.id, 'practical')}
                              disabled={!isVotingOpen}
                              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border transition-all ${
                                hasVoted
                                  ? 'bg-rose-950/40 border-rose-800 text-rose-300 font-bold'
                                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                              } disabled:opacity-50`}
                            >
                              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                              🛠️ 실무 즉시 적용
                            </button>
                            <button
                              type="button"
                              onClick={() => onVote(sub.id, 'ui')}
                              disabled={!isVotingOpen}
                              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg border transition-all ${
                                hasVoted
                                  ? 'bg-rose-950/40 border-rose-800 text-rose-300 font-bold'
                                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                              } disabled:opacity-50`}
                            >
                              <Palette className="w-3.5 h-3.5 text-purple-400" />
                              🎨 직관적 UI
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: LEADERBOARD ================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-1">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">실시간 최다 득표 순위</h3>
              <p className="text-xs text-slate-400">15개 조가 실시간으로 선정한 베스트 코드입니다.</p>
            </div>

            <div className="space-y-2">
              {[...submissions]
                .sort((a, b) => b.votes - a.votes)
                .map((sub, idx) => (
                  <div
                    key={sub.id}
                    onClick={() => onSelectSubmission(sub)}
                    className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all"
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
                        <div className="text-xs font-bold text-white truncate max-w-[220px]">
                          {sub.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sub.team} · {sub.authorName} ({sub.department})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs shrink-0">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      {sub.votes}표
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
