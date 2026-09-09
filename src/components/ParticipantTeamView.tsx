import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Code2,
  FolderLock,
  Upload,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Play,
  Heart,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Eye,
  FileCode,
  Copy,
  Check,
  Search,
  ExternalLink,
  Target,
  Lightbulb,
  Briefcase,
  ArrowRight,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { TeamActivity, CodeSubmission, ProductivityCategory, CodeLanguage, TeamAsset, SampleDataset } from '../types';
import { CodeRunner } from './CodeRunner';
import { ParticipantDatasetList } from './ParticipantDatasetList';
import { SampleWaferDashboard } from './SampleWaferDashboard';
import { formatTeamName, formatTeamHandle } from '../utils/teamUtils';

interface ParticipantTeamViewProps {
  team: TeamActivity;
  teamNumber: number;
  submissions: CodeSubmission[];
  datasets?: SampleDataset[];
  onSubmit: (submission: Omit<CodeSubmission, 'id' | 'votes' | 'createdAt'>) => void;
  onVote: (submissionId: string) => void;
  votedIds: Set<string>;
  isVotingOpen: boolean;
  onSelectSubmission?: (sub: CodeSubmission) => void;
  onUpdateTeamInfo?: (updatedFields: Partial<TeamActivity>) => void;
}

const CATEGORY_LABELS: Record<ProductivityCategory, string> = {
  yield_defect: '🔬 수율 분석 & 결함 개선',
  process_optimization: '⚙️ 공정 파라미터 최적화',
  equipment_fdc: '🛡️ 설비 예지보전 & FDC',
  metrology_qa: '📐 계측 & 품질 검사',
  lot_logistics: '🔄 웨이퍼 물류 & Q-Time',
  utility_safety: '⚡ FAB 유틸리티 & 환경안전',
};

export const ParticipantTeamView: React.FC<ParticipantTeamViewProps> = ({
  team,
  teamNumber,
  submissions,
  datasets = [],
  onSubmit,
  onVote,
  votedIds,
  isVotingOpen,
  onSelectSubmission,
  onUpdateTeamInfo,
}) => {
  // Navigation Tabs: 'info' | 'code' | 'assets' | 'datasets' | 'dashboard' | 'voting'
  const [activeTab, setActiveTab] = useState<'info' | 'code' | 'assets' | 'datasets' | 'dashboard' | 'voting'>('info');

  // ==================== TAB 1: TEAM INFO STATE ====================
  const [teamName, setTeamName] = useState(team.teamName || `제 ${teamNumber} 조`);
  const [slogan, setSlogan] = useState(team.slogan || '');
  const [category, setCategory] = useState<ProductivityCategory>(team.category || 'yield_defect');
  const [problemStatement, setProblemStatement] = useState(team.problemStatement || '');
  const [productivityImpact, setProductivityImpact] = useState(team.productivityImpact || '');
  const [membersInput, setMembersInput] = useState(
    Array.isArray(team.members)
      ? team.members.map((m) => (typeof m === 'string' ? m : m.name)).join(', ')
      : ''
  );
  const [isTeamInfoSaved, setIsTeamInfoSaved] = useState(false);

  // Sync state if team prop updates
  useEffect(() => {
    if (team.teamName) setTeamName(team.teamName);
    if (team.slogan) setSlogan(team.slogan);
    if (team.category) setCategory(team.category);
    if (team.problemStatement) setProblemStatement(team.problemStatement);
    if (team.productivityImpact) setProductivityImpact(team.productivityImpact);
  }, [team]);

  const handleSaveTeamInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedFields: Partial<TeamActivity> = {
      teamName: teamName.trim() || `제 ${teamNumber} 조`,
      slogan: slogan.trim(),
      category,
      problemStatement: problemStatement.trim(),
      productivityImpact: productivityImpact.trim(),
    };

    if (onUpdateTeamInfo) {
      onUpdateTeamInfo(updatedFields);
    }

    setIsTeamInfoSaved(true);
    setTimeout(() => setIsTeamInfoSaved(false), 2500);
  };

  // ==================== TAB 2: CODE SUBMISSION STATE ====================
  // Check if our team already submitted
  const myTeamSubmission = submissions.find((s) => {
    const match = String(s.team).match(/\d+/);
    return match ? parseInt(match[0], 10) === teamNumber : false;
  });

  const [title, setTitle] = useState(myTeamSubmission?.title || '');
  const [promptUsed, setPromptUsed] = useState(myTeamSubmission?.promptUsed || '');
  const [code, setCode] = useState(myTeamSubmission?.code || '');
  const [language, setLanguage] = useState<CodeLanguage>(myTeamSubmission?.language || 'python');
  const [sampleInput, setSampleInput] = useState(myTeamSubmission?.sampleInput || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showRunnerPreview, setShowRunnerPreview] = useState(false);

  // Update form if submission already exists
  useEffect(() => {
    if (myTeamSubmission) {
      setTitle(myTeamSubmission.title);
      setPromptUsed(myTeamSubmission.promptUsed || '');
      setCode(myTeamSubmission.code);
      setLanguage(myTeamSubmission.language);
      if (myTeamSubmission.sampleInput) setSampleInput(myTeamSubmission.sampleInput);
    }
  }, [myTeamSubmission]);

  // AI Code Generator drawer
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiIdeaPrompt, setAiIdeaPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

      if (!res.ok) {
        throw new Error('AI 코드 생성에 실패했습니다.');
      }

      const data = await res.json();
      if (data.code) {
        setCode(data.code);
        if (data.title && !title) setTitle(data.title);
        if (data.promptUsed) setPromptUsed(data.promptUsed);
        if (data.sampleInput) setSampleInput(data.sampleInput);
        setShowAiHelper(false);
        setShowRunnerPreview(true);
      }
    } catch (err: any) {
      setAiError(err.message || '코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      onSubmit({
        title: title.trim(),
        team: `제 ${teamNumber} 조`,
        authorName: team.teamName || `제 ${teamNumber} 조`,
        department: team.category ? CATEGORY_LABELS[team.category] : '업무 혁신',
        code: code.trim(),
        language,
        sampleInput: sampleInput.trim(),
        promptUsed: promptUsed.trim(),
        description: problemStatement.trim() || title.trim(),
        productivityImpact: productivityImpact.trim() || '업무 처리 시간 80% 단축',
        category,
      });

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== TAB 3: TEAM ASSETS STATE ====================
  const [assets, setAssets] = useState<TeamAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assetTitle, setAssetTitle] = useState('');
  const [assetContent, setAssetContent] = useState('');
  const [assetMode, setAssetMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<TeamAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTeamAssets = async () => {
    setIsLoadingAssets(true);
    try {
      const res = await fetch(`/api/teams/${teamNumber}/assets`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (e) {
      console.warn('Using local assets storage');
    } finally {
      setIsLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchTeamAssets();
  }, [teamNumber]);

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const isImg = file.type.startsWith('image/');
      setSelectedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: isImg ? 'image' : 'file',
        dataUrl,
      });
      if (!assetTitle) {
        setAssetTitle(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAsset = async () => {
    if (!assetTitle.trim() && !selectedFile?.name && !assetContent.trim()) return;

    setIsUploadingAsset(true);
    const newPayload = {
      title: assetTitle.trim() || selectedFile?.name || '공유 메모',
      fileName: selectedFile?.name,
      fileType: selectedFile?.type || (assetMode === 'text' ? 'document' : 'file'),
      fileSize: selectedFile?.size,
      dataUrl: selectedFile?.dataUrl,
      content: assetMode === 'text' ? assetContent.trim() : undefined,
      uploadedBy: `제 ${teamNumber} 조 팀원`,
    };

    try {
      const res = await fetch(`/api/teams/${teamNumber}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.asset) {
          setAssets((prev) => [data.asset, ...prev]);
        }
      } else {
        // Local fallback
        const mockNew: TeamAsset = {
          id: `asset-${Date.now()}`,
          teamNumber,
          title: newPayload.title,
          fileName: newPayload.fileName,
          fileType: newPayload.fileType,
          fileSize: newPayload.fileSize,
          dataUrl: newPayload.dataUrl,
          content: newPayload.content,
          uploadedBy: newPayload.uploadedBy,
          createdAt: Date.now(),
        };
        setAssets((prev) => [mockNew, ...prev]);
      }

      // Reset form
      setAssetTitle('');
      setAssetContent('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    try {
      await fetch(`/api/teams/${teamNumber}/assets/${assetId}`, {
        method: 'DELETE',
      });
    } catch (e) {}
  };

  // ==================== TAB 4: VOTING TAB FILTER STATE ====================
  const [voteSearchQuery, setVoteSearchQuery] = useState('');
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);

  const filteredSubmissions = submissions.filter((sub) => {
    const q = voteSearchQuery.toLowerCase();
    return (
      sub.title.toLowerCase().includes(q) ||
      sub.team.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* ================= TOP HEADER ================= */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Team Identity Banner */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
              {teamNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  제 {teamNumber} 조 워크스페이스
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  team{teamNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                {team.teamName || `제 ${teamNumber} 조 LLM 자동화 프로젝트`}
              </p>
            </div>
          </div>

          {/* Submission status pill */}
          <div>
            {myTeamSubmission ? (
              <span className="px-2.5 py-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                과제 제출완료
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-800 rounded-xl">
                과제 작성 중
              </span>
            )}
          </div>
        </div>

        {/* ================= 4 DEDICATED TABS (DIVIDED TEAM MENU) ================= */}
        <div className="max-w-5xl mx-auto mt-2.5 flex items-center gap-1 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {/* Sub-tab 1: Team Info & Project Planning */}
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'info'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>1. 팀 정보 & 기획안</span>
          </button>

          {/* Sub-tab 2: Code Submission & Live Testing */}
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'code'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>2. 대표 코드 & 결과물 제출</span>
            {myTeamSubmission && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5" />
            )}
          </button>

          {/* Sub-tab 3: Team Assets & Files */}
          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'assets'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            <span>3. 팀 공유 자료실</span>
            {assets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono">
                {assets.length}
              </span>
            )}
          </button>

          {/* Sub-tab 4: Sample Datasets for CSV Download */}
          <button
            onClick={() => setActiveTab('datasets')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'datasets'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. 실습 데이터셋 (CSV)</span>
            {datasets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                {datasets.length}
              </span>
            )}
          </button>

          {/* Sub-tab 5: Reference Deliverable Dashboard Benchmark */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>5. 결과물 대시보드 예시</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gradient-to-r from-indigo-900 to-emerald-900 text-indigo-200 border border-indigo-700 font-bold">
              참고용
            </span>
          </button>

          {/* Sub-tab 6: Peer Voting */}
          <button
            onClick={() => setActiveTab('voting')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'voting'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>6. 동료 과제 투표</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {submissions.length}
            </span>
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ================================================================= */}
        {/* TAB 1: TEAM BASIC INFORMATION & PLANNING (DIVIDED SECTION)         */}
        {/* ================================================================= */}
        {activeTab === 'info' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    제 {teamNumber} 조 기본 정보 및 프로젝트 기획안
                  </h2>
                  <p className="text-xs text-slate-400">
                    우리 팀의 명칭, 해결하려는 업무 과제, 기대 효과를 입력하고 저장하세요.
                  </p>
                </div>
              </div>

              {isTeamInfoSaved && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>저장 완료!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveTeamInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    팀 명칭 / 프로젝트명
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="예: 제 1 조 · 식각 공정 수율 혁신팀"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Slogan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    팀 슬로건 / 캐치프레이즈
                  </label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="예: 웨이퍼 결함률 0% 도전, LLM 기반 이상 패턴 3초 탐지!"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  반도체 제조 개선 분류 카테고리
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_LABELS) as ProductivityCategory[]).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        category === cat
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem Statement (Before) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  <span>해결하고자 하는 반도체 공정/설비 Pain Point (Before)</span>
                </label>
                <textarea
                  rows={3}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="예: 식각(Etch) 공정 후 웨이퍼 맵에서 발생하는 불량 클러스터를 엔지니어가 수작업으로 육안 판독하여 로트당 40분 이상 소요되고 미세 결함 누락 위험 존재"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Productivity Impact (After) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>기대 수율 개선 및 분석시간 단축 효과 (After)</span>
                </label>
                <input
                  type="text"
                  value={productivityImpact}
                  onChange={(e) => setProductivityImpact(e.target.value)}
                  placeholder="예: 결함 판독 자동화로 로트당 분석 시간 40분 -> 1.5분 단축(96% 개선) 및 이상 로트 선제 인터락 격리"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>팀 정보 저장하기</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <span>다음: 대표 코드 작성 및 제출</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CODE SUBMISSION & LIVE TEST RUNNER (DIVIDED SECTION)        */}
        {/* ================================================================= */}
        {activeTab === 'code' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>제 {teamNumber} 조 대표 과제 코드 제출</span>
                    {myTeamSubmission ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                        제출 완료 (수정 가능)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                        작성 대기 중
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    발표회 시연 및 동료 투표에 반영될 최종 결과물입니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800 hover:bg-emerald-900 transition-colors shadow-sm"
                  title="300mm 웨이퍼 결함 맵 대시보드 예시 확인"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>대시보드 참고 예시</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAiHelper(!showAiHelper)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950 border border-indigo-800 hover:bg-indigo-900 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI 초안 도우미</span>
                </button>
              </div>
            </div>

            {/* AI Generator Helper Drawer */}
            {showAiHelper && (
              <div className="bg-indigo-950/30 border border-indigo-800/60 rounded-xl p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Gemini AI로 실무 자동화 코드 초안 생성
                  </span>
                  <button
                    onClick={() => setShowAiHelper(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={aiIdeaPrompt}
                  onChange={(e) => setAiIdeaPrompt(e.target.value)}
                  placeholder="예: 식각 챔버 압력 헌팅 시계열 데이터 분석 및 이상 징후 자동 탐지 스크립트"
                  className="w-full bg-slate-900 border border-indigo-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {aiError && <p className="text-xs text-rose-400">{aiError}</p>}
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateAiCode}
                    disabled={isGeneratingAi || !aiIdeaPrompt.trim()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {isGeneratingAi && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isGeneratingAi ? '생성 중...' : '자동 생성 및 폼에 채우기'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmitCode} className="space-y-4">
              {/* Project Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  대표 과제 / 프로젝트 제목
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 웨이퍼 맵 결함 클러스터링 및 FDC 센서 이상 상관분석 자동화 스크립트"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Prompt Strategy */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  LLM에 입력한 핵심 프롬프트 (Prompt Strategy)
                </label>
                <textarea
                  rows={2}
                  value={promptUsed}
                  onChange={(e) => setPromptUsed(e.target.value)}
                  placeholder="예: '반도체 식각 챔버의 RF Power 및 압력 시계열 데이터와 웨이퍼 결함 좌표를 입력받아 이상 챔버를 특정하고 파라미터 보정값을 제안하는 Python 스크립트를 작성해줘...'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              {/* Language & Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    자동화 코드 작성 (라이브 시연 가능)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">개발 언어:</span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="python">Python (Pyodide 샌드박스)</option>
                      <option value="javascript">JavaScript / Node</option>
                      <option value="html">HTML / Interactive</option>
                      <option value="sql">SQL Query</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={10}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// 여기에 Python, JavaScript 또는 HTML 코드를 작성하세요..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* Sample Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  테스트용 샘플 인풋 / 데이터셋 (선택사항)
                </label>
                <input
                  type="text"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  placeholder="예: lot_id: 'LOT-2026-W09', chamber: 'ETCH-CH03', rf_power: 1250"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Live Test Runner Preview Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowRunnerPreview(!showRunnerPreview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  <span>{showRunnerPreview ? '실행 결과창 닫기' : '실행 결과 미리 테스트하기'}</span>
                </button>

                {showRunnerPreview && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                      <span>실시간 샌드박스 실행 결과</span>
                      <span className="font-mono text-indigo-400">{language.toUpperCase()}</span>
                    </div>
                    <div className="h-64 rounded-lg overflow-hidden border border-slate-850">
                      <CodeRunner
                        code={code}
                        language={language}
                        title={title || '과제 실행 테스트'}
                        sampleInput={sampleInput}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  {myTeamSubmission ? '수정 후 다시 제출하시면 업데이트됩니다.' : '제출 후에도 언제든 수정 가능합니다.'}
                </span>

                <div className="flex items-center gap-3">
                  {submitSuccess && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      제출 완료!
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{myTeamSubmission ? '과제 최종 업데이트' : '대표 과제 최종 제출'}</span>
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 3: TEAM ASSETS & SHARED MATERIALS (DIVIDED SECTION)            */}
        {/* ================================================================= */}
        {activeTab === 'assets' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                  <FolderLock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>제 {teamNumber} 조 전용 공유 자료실</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                      우리 조원 전용
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    프롬프트 메모, 참고 데이터셋, 캡처 스크린샷, 파이썬 코드를 팀원들과 공유하세요.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchTeamAssets}
                disabled={isLoadingAssets}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="새로고침"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAssets ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>

            {/* Upload Area */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">새 자료 등록</span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAssetMode('file')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      assetMode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    파일/이미지
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetMode('text')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      assetMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    프롬프트/코드 메모
                  </button>
                </div>
              </div>

              {assetMode === 'file' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : selectedFile
                      ? 'border-emerald-600/60 bg-emerald-950/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                        {selectedFile.type === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white truncate max-w-xs">{selectedFile.name}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">{selectedFile.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 mx-auto text-indigo-400" />
                      <p className="text-xs font-semibold text-slate-300">
                        파일을 드래그하거나 클릭하여 업로드
                      </p>
                      <p className="text-[10px] text-slate-500">
                        이미지, 엑셀, CSV, 파이썬/SQL 스크립트 지원
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={assetContent}
                  onChange={(e) => setAssetContent(e.target.value)}
                  placeholder="조원들과 공유할 반도체 결함 분석 프롬프트, FDC 파이프라인 코드, 아이디어 메모를 입력하세요..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              )}

              {/* Title & Upload Button */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assetTitle}
                  onChange={(e) => setAssetTitle(e.target.value)}
                  placeholder="자료 제목 (예: CMP 평탄화 공정 최적화 프롬프트, 샘플 웨이퍼 데이터셋)"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleUploadAsset}
                  disabled={isUploadingAsset}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isUploadingAsset ? '업로드 중' : '등록'}</span>
                </button>
              </div>
            </div>

            {/* Assets List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>공유된 자료 ({assets.length}건)</span>
                <span className="text-[10px] text-slate-500">클릭하여 내용 확인 / 다운로드</span>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  아직 등록된 팀 자료가 없습니다. 프롬프트나 참고 코드를 공유해보세요.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between gap-2 shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                            {asset.fileType === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-purple-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                              {asset.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              {asset.fileSize || '텍스트 메모'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Image Thumbnail preview if image */}
                      {asset.dataUrl && asset.fileType === 'image' && (
                        <div
                          onClick={() => setPreviewAsset(asset)}
                          className="h-20 w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer"
                        >
                          <img
                            src={asset.dataUrl}
                            alt={asset.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      {/* Text preview */}
                      {asset.content && (
                        <div
                          onClick={() => setPreviewAsset(asset)}
                          className="p-2 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 max-h-14 overflow-hidden line-clamp-2 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                        >
                          {asset.content}
                        </div>
                      )}

                      {/* Card Bottom Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-500">
                          {new Date(asset.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {asset.dataUrl && (
                            <a
                              href={asset.dataUrl}
                              download={asset.fileName || `${asset.title}.png`}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>다운로드</span>
                            </a>
                          )}
                          <button
                            onClick={() => setPreviewAsset(asset)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 hover:bg-indigo-900 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>보기</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 4: PEER VOTING & EXPLORE (DIVIDED SECTION)                     */}
        {/* ================================================================= */}
        {activeTab === 'voting' && (
          <section className="space-y-4">
            {/* Search & Overview Header */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400 fill-current" />
                  <span>동료 과제 실시간 투표</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  타 팀의 자동화 코드를 직접 실행해보고 우수한 아이디어에 투표하세요.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="팀명 또는 과제 검색..."
                  value={voteSearchQuery}
                  onChange={(e) => setVoteSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submissions List */}
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                아직 다른 팀의 제출 과제가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSubmissions.map((sub) => {
                  const isMySubmission = sub.id === myTeamSubmission?.id;
                  const hasVoted = votedIds.has(sub.id);

                  return (
                    <div
                      key={sub.id}
                      className={`p-4 bg-slate-900 border rounded-2xl shadow-md transition-all flex flex-col justify-between ${
                        isMySubmission
                          ? 'border-indigo-500/80 ring-1 ring-indigo-500/30'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white">
                              {formatTeamName(sub.team)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {formatTeamHandle(sub.team)}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-950 text-cyan-400 border border-slate-800 uppercase">
                            {sub.language}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white tracking-tight line-clamp-2">
                          {sub.title}
                        </h4>

                        {sub.productivityImpact && (
                          <p className="text-xs text-emerald-400 font-medium mt-1">
                            ⚡ {sub.productivityImpact}
                          </p>
                        )}

                        {/* Prompt Strategy Snippet */}
                        {sub.promptUsed && (
                          <div className="mt-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono line-clamp-2">
                            💬 {sub.promptUsed}
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
                        <button
                          onClick={() => {
                            if (onSelectSubmission) onSelectSubmission(sub);
                            else setExpandedCodeId(expandedCodeId === sub.id ? null : sub.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                          <span>코드 실행</span>
                        </button>

                        <button
                          onClick={() => onVote(sub.id)}
                          disabled={!isVotingOpen}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                            hasVoted
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                              : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                          <span>{sub.votes}표</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 4: SAMPLE DATASETS FOR CSV DOWNLOAD (STUDENT SIMPLE VIEW)     */}
        {/* ================================================================= */}
        {activeTab === 'datasets' && (
          <ParticipantDatasetList
            datasets={datasets}
            onOpenDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 5: SAMPLE DASHBOARD BENCHMARK (LIVE DEMO FOR STUDENTS)        */}
        {/* ================================================================= */}
        {activeTab === 'dashboard' && (
          <SampleWaferDashboard
            dataset={
              datasets.find(
                (d) => d.id === 'dataset-wafer-defect-map-spatial' || d.fileName.includes('wafer_300mm')
              ) || datasets[0]
            }
            onNavigateToSubmit={() => setActiveTab('code')}
            isEmbedded={true}
          />
        )}
      </main>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white truncate">{previewAsset.title}</h3>
              <button
                onClick={() => setPreviewAsset(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {previewAsset.fileType === 'image' && previewAsset.dataUrl ? (
              <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center">
                <img
                  src={previewAsset.dataUrl}
                  alt={previewAsset.title}
                  className="max-h-[55vh] object-contain"
                />
              </div>
            ) : (
              <div className="max-h-[50vh] overflow-auto p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap">
                {previewAsset.content || '내용이 없습니다.'}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {previewAsset.dataUrl && (
                <a
                  href={previewAsset.dataUrl}
                  download={previewAsset.fileName || `${previewAsset.title}.png`}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>다운로드</span>
                </a>
              )}
              <button
                onClick={() => setPreviewAsset(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
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
