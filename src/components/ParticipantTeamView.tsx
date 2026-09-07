import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Code as CodeIcon,
  Trash2,
  Download,
  Copy,
  Check,
  Sparkles,
  Play,
  Heart,
  Search,
  Zap,
  Lightbulb,
  Wrench,
  Eye,
  Plus,
  RefreshCw,
  FolderLock,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Link as LinkIcon,
} from 'lucide-react';
import {
  CodeSubmission,
  CodeLanguage,
  ProductivityCategory,
  TeamActivity,
  TeamAsset,
} from '../types';
import { CodeRunner } from './CodeRunner';

interface ParticipantTeamViewProps {
  teamNumber: number; // 1 ~ 15
  team: TeamActivity;
  submissions: CodeSubmission[];
  onSubmit: (sub: Partial<CodeSubmission>) => Promise<boolean>;
  onVote: (id: string, reactionType?: string) => void;
  votedIds: Set<string>;
  isVotingOpen: boolean;
  onSelectSubmission: (sub: CodeSubmission) => void;
}

export const ParticipantTeamView: React.FC<ParticipantTeamViewProps> = ({
  teamNumber,
  team,
  submissions,
  onSubmit,
  onVote,
  votedIds,
  isVotingOpen,
  onSelectSubmission,
}) => {
  // Navigation tabs: 'workspace' (우리 팀 워크스페이스) vs 'voting' (전체 팀 투표)
  const [activeTab, setActiveTab] = useState<'workspace' | 'voting'>('workspace');

  // URL copy indicator
  const [copiedUrl, setCopiedUrl] = useState(false);

  // ==================== TEAM ASSETS STATE ====================
  const [assets, setAssets] = useState<TeamAsset[]>(() => {
    try {
      const cached = localStorage.getItem(`llm_hackathon_team_assets_${teamNumber}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // Asset Upload Form
  const [assetTitle, setAssetTitle] = useState('');
  const [assetContent, setAssetContent] = useState('');
  const [assetMode, setAssetMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: 'image' | 'code' | 'document' | 'data' | 'link' | 'note';
    dataUrl?: string;
  } | null>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Asset preview modal
  const [previewAsset, setPreviewAsset] = useState<TeamAsset | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Fetch team assets from server & persist
  const fetchTeamAssets = async () => {
    try {
      setIsLoadingAssets(true);
      const res = await fetch(`/api/teams/${teamNumber}/assets`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.assets)) {
          setAssets(data.assets);
          localStorage.setItem(
            `llm_hackathon_team_assets_${teamNumber}`,
            JSON.stringify(data.assets)
          );
        }
      }
    } catch (e) {
      // Fallback to localStorage
    } finally {
      setIsLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchTeamAssets();
  }, [teamNumber]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `llm_hackathon_team_assets_${teamNumber}`,
        JSON.stringify(assets)
      );
    } catch (e) {}
  }, [assets, teamNumber]);

  // Handle File selection (drag/drop or file input)
  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    const isImg = file.type.startsWith('image/');
    const isCode = /\.(js|ts|py|sql|html|css|json|jsx|tsx)$/i.test(file.name);
    const isData = /\.(csv|xlsx|xls|json|tsv)$/i.test(file.name);

    let type: 'image' | 'code' | 'document' | 'data' = 'document';
    if (isImg) type = 'image';
    else if (isCode) type = 'code';
    else if (isData) type = 'data';

    const sizeStr =
      file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    reader.onload = (e) => {
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        type,
        dataUrl: e.target?.result as string,
      });
      if (!assetTitle) {
        setAssetTitle(file.name.replace(/\.[^/.]+$/, ''));
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
    if (assetMode === 'file' && !selectedFile && !assetTitle) {
      alert('파일을 선택하거나 자료 제목을 입력해주세요.');
      return;
    }
    if (assetMode === 'text' && !assetContent.trim()) {
      alert('공유할 프롬프트 또는 코드 내용을 입력해주세요.');
      return;
    }

    setIsUploadingAsset(true);
    const newAsset: TeamAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamNumber,
      title: (assetTitle || selectedFile?.name || '팀 자료').trim(),
      fileName: selectedFile?.name,
      fileType: assetMode === 'text' ? 'code' : selectedFile?.type || 'document',
      fileSize: selectedFile?.size,
      dataUrl: selectedFile?.dataUrl,
      content: assetMode === 'text' ? assetContent : undefined,
      uploadedBy: `${teamNumber}조`,
      createdAt: Date.now(),
    };

    try {
      const res = await fetch(`/api/teams/${teamNumber}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.asset) {
          setAssets((prev) => [data.asset, ...prev]);
        } else {
          setAssets((prev) => [newAsset, ...prev]);
        }
      } else {
        setAssets((prev) => [newAsset, ...prev]);
      }
    } catch (e) {
      setAssets((prev) => [newAsset, ...prev]);
    } finally {
      setIsUploadingAsset(false);
      setAssetTitle('');
      setAssetContent('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('이 자료를 삭제하시겠습니까?')) return;
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    try {
      await fetch(`/api/teams/${teamNumber}/assets/${assetId}`, {
        method: 'DELETE',
      });
    } catch (e) {}
  };

  // ==================== TEAM SUBMISSION FORM STATE ====================
  // Check if our team already has a submission
  const myTeamSubmission = submissions.find(
    (s) => s.team === `${teamNumber}조` || s.team === String(teamNumber)
  );

  const [title, setTitle] = useState(myTeamSubmission?.title || '');
  const [language, setLanguage] = useState<CodeLanguage>(
    myTeamSubmission?.language || 'javascript'
  );
  const [promptUsed, setPromptUsed] = useState(myTeamSubmission?.promptUsed || '');
  const [code, setCode] = useState(myTeamSubmission?.code || '');
  const [productivityImpact, setProductivityImpact] = useState(
    myTeamSubmission?.productivityImpact || ''
  );
  const [description, setDescription] = useState(myTeamSubmission?.description || '');

  // AI Prompt Helper State
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiIdeaPrompt, setAiIdeaPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Live Runner Test State
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync form when myTeamSubmission updates
  useEffect(() => {
    if (myTeamSubmission) {
      setTitle(myTeamSubmission.title);
      setLanguage(myTeamSubmission.language);
      setPromptUsed(myTeamSubmission.promptUsed);
      setCode(myTeamSubmission.code);
      setProductivityImpact(myTeamSubmission.productivityImpact);
      setDescription(myTeamSubmission.description || '');
    }
  }, [myTeamSubmission]);

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
      setAiError(e.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('과제 제목을 입력해주세요.');
    if (!code.trim()) return alert('생성된 코드를 입력해주세요.');

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        authorName: `${teamNumber}조`,
        team: `${teamNumber}조`,
        title: title.trim(),
        language,
        promptUsed: promptUsed.trim() || '프롬프트 미기재',
        code: code.trim(),
        productivityImpact: productivityImpact.trim() || '수작업 시간 80% 이상 절감',
        description: description.trim(),
      });

      if (success) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (err) {
      alert('제출 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== VOTING TAB FILTER STATE ====================
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
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Team Badge & URL info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
              {teamNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  제 {teamNumber} 분임조 워크스페이스
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  team{teamNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[220px] sm:max-w-md">
                {team.teamName || `제 ${teamNumber} 분임조 LLM 자동화 프로젝트`}
              </p>
            </div>
          </div>
        </div>

        {/* ================= 2 SIMPLE TABS ================= */}
        <div className="max-w-4xl mx-auto mt-3 flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'workspace'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>우리 팀 워크스페이스</span>
            {assets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono">
                {assets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('voting')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'voting'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <span>15개 분임조 투표</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {submissions.length}
            </span>
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'workspace' ? (
          /* ========================================================= */
          /* TAB 1: OUR TEAM WORKSPACE (ASSETS SHARING & CODE SUBMIT) */
          /* ========================================================= */
          <div className="space-y-6">
            {/* ================= SECTION A: TEAM ASSETS SHARING ================= */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
                    <FolderLock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>팀 내 자료/애셋 공유</span>
                      <span className="text-[11px] font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
                        {teamNumber}조 전용 비공개
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      우리 조원들끼리 프롬프트, 참고 데이터, 파이썬/엑셀 스크립트, 캡처 이미지를 자유롭게 공유하세요.
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

              {/* Upload Input Box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">새 자료 업로드</span>
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
                      코드/프롬프트 메모
                    </button>
                  </div>
                </div>

                {assetMode === 'file' ? (
                  /* Drag and Drop Zone */
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
                        <Upload className="w-6 h-6 mx-auto text-indigo-400" />
                        <p className="text-xs font-semibold text-slate-300">
                          파일을 드래그하여 놓거나 클릭하여 선택
                        </p>
                        <p className="text-[11px] text-slate-500">
                          이미지, 엑셀, CSV, 파이썬/SQL 코드, 텍스트 문서 지원
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Text/Prompt Memo Input */
                  <div>
                    <textarea
                      value={assetContent}
                      onChange={(e) => setAssetContent(e.target.value)}
                      placeholder="조원들과 공유할 프롬프트 템플릿, 참고 코드, 아이디어 메모를 입력하세요..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>
                )}

                {/* Title Input & Upload Button */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={assetTitle}
                      onChange={(e) => setAssetTitle(e.target.value)}
                      placeholder="자료/애셋 제목 (예: 결산 검증 프롬프트, 샘플 데이터셋, 템플릿 코드)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUploadAsset}
                    disabled={isUploadingAsset}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isUploadingAsset ? '업로드 중' : '팀 내 공유 등록'}</span>
                  </button>
                </div>
              </div>

              {/* Uploaded Assets List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>공유된 조별 자료 목록 ({assets.length}건)</span>
                  <span className="text-[11px] text-slate-500">클릭하여 내용 확인 / 다운로드</span>
                </div>

                {assets.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                    아직 등록된 팀 자료가 없습니다. 프롬프트나 참고 코드를 가장 먼저 공유해보세요!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between gap-2 transition-all shadow-sm group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                              {asset.fileType === 'image' ? (
                                <ImageIcon className="w-4 h-4 text-purple-400" />
                              ) : asset.fileType === 'code' ? (
                                <CodeIcon className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <FileText className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                                {asset.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {asset.fileSize || (asset.content ? '텍스트/코드' : '공유 파일')}
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
                            className="h-24 w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer"
                          >
                            <img
                              src={asset.dataUrl}
                              alt={asset.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {/* Text snippet preview if content */}
                        {asset.content && (
                          <div
                            onClick={() => setPreviewAsset(asset)}
                            className="p-2 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 max-h-16 overflow-hidden line-clamp-2 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                          >
                            {asset.content}
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                          <span className="text-slate-500">
                            {new Date(asset.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="flex items-center gap-1">
                            {asset.content && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(asset.content || '');
                                  setCopiedSnippetId(asset.id);
                                  setTimeout(() => setCopiedSnippetId(null), 1500);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              >
                                {copiedSnippetId === asset.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedSnippetId === asset.id ? '복사됨' : '복사'}</span>
                              </button>
                            )}

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

            {/* ================= SECTION B: OUR TEAM CODE SUBMISSION ================= */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>우리 팀 대표 과제 코드 제출</span>
                      {myTeamSubmission ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                          제출 완료 (수정 가능)
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                          작성 대기 중
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400">
                      발표회 시연 및 전체 조 투표에 반영될 {teamNumber}조의 최종 LLM 결과물입니다.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiHelper(!showAiHelper)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950 border border-indigo-800/80 hover:bg-indigo-900 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI 프롬프트 도우미</span>
                </button>
              </div>

              {/* AI Generator Helper Drawer */}
              {showAiHelper && (
                <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Gemini 모델로 실무 자동화 코드 초안 만들기
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
                    placeholder="예: 월말 결산 불일치 데이터를 비교하여 차액을 빨간색으로 표시하는 엑셀 자동화"
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
                {/* 1. Project Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    {teamNumber}조 대표 과제 / 자동화 프로젝트 제목
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 클릭 한 번으로 끝내는 월말 결산 불일치 검증 및 자동 보고서 생성"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 3. Prompt Used */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    LLM에 입력한 핵심 프롬프트 (Prompt Strategy)
                  </label>
                  <textarea
                    rows={2}
                    value={promptUsed}
                    onChange={(e) => setPromptUsed(e.target.value)}
                    placeholder="예: '신입사원이 매월 반복하는 엑셀 A열과 B열의 계정 일치 여부를 대조하고 오차 내역만 추출하는 JavaScript 코드를 작성해줘...'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                  />
                </div>

                {/* 4. Code & Language */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-400">
                      생성된 코드 (라이브 시연 가능)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-300 font-mono"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="html">HTML / Interactive App</option>
                        <option value="python">Python</option>
                        <option value="sql">SQL</option>
                        <option value="json">JSON</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setShowTestRunner(!showTestRunner)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{showTestRunner ? '실행기 닫기' : '실행 테스트'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="생성된 코드를 붙여넣으세요..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500 resize-y"
                  />
                </div>

                {/* Code Live Runner Drawer */}
                {showTestRunner && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <p className="text-xs font-bold text-slate-300 mb-2">코드 실시간 인터랙티브 실행 테스트</p>
                    <CodeRunner code={code} language={language} isExpanded={true} />
                  </div>
                )}

                {/* 5. Productivity Impact */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    기대 생산성 효과 (업무 절감 수치)
                  </label>
                  <input
                    type="text"
                    value={productivityImpact}
                    onChange={(e) => setProductivityImpact(e.target.value)}
                    placeholder="예: 월말 정산 수작업 4시간 -> 3분으로 98% 단축"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs">
                    {submitSuccess && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        성공적으로 {teamNumber}조 대표 과제가 제출되었습니다!
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{myTeamSubmission ? `${teamNumber}조 과제 수정하기` : `${teamNumber}조 대표 과제 제출하기`}</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : (
          /* ========================================================= */
          /* TAB 2: CROSS-TEAM VOTING & CODE REVIEW (ONLY VOTE OUTSIDE) */
          /* ========================================================= */
          <div className="space-y-4">
            {/* Voting Notice Banner */}
            <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-rose-400 fill-current" />
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-white text-sm">전체 조 대표 과제 동료 평가 및 투표</h3>
                <p className="text-slate-300">
                  다른 15개 조의 대표 결과물과 코드를 확인하고 가장 혁신적이고 실무 적용성이 뛰어난 조에 투표하세요.
                </p>
                <p className="text-slate-500 text-[11px]">
                  * 각 조의 내부 공유 자료/애셋은 비공개되며, 제출 완료된 대표 과제만 투표 대상입니다.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={voteSearchQuery}
                  onChange={(e) => setVoteSearchQuery(e.target.value)}
                  placeholder="조 번호 (예: 3조), 과제 제목으로 검색..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submissions Cards List */}
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-xs text-slate-400 space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-slate-500" />
                <p className="font-semibold">제출된 과제가 없습니다.</p>
                <p className="text-slate-500 text-[11px]">
                  각 조에서 대표 과제를 등록하면 실시간으로 이곳에 노출되어 투표가 진행됩니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredSubmissions.map((sub) => {
                  const hasVoted = votedIds.has(sub.id);
                  const isMyTeam = sub.team === `${teamNumber}조` || sub.team === String(teamNumber);
                  const isCodeExpanded = expandedCodeId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-md ${
                        isMyTeam
                          ? 'border-indigo-800/80 bg-slate-900/90'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-sm">
                              {sub.team}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                              {sub.language}
                            </span>
                            {isMyTeam && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                                우리 팀
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {sub.title}
                          </h3>

                          <p className="text-xs text-slate-400">
                            기대 효과: <span className="text-emerald-400 font-medium">{sub.productivityImpact}</span>
                          </p>
                        </div>

                        {/* Vote Button */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            onClick={() => onVote(sub.id)}
                            disabled={!isVotingOpen}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              hasVoted
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                            } ${!isVotingOpen ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current text-rose-400' : ''}`} />
                            <span>{sub.votes}표</span>
                          </button>
                        </div>
                      </div>

                      {/* Prompt preview snippet */}
                      {sub.promptUsed && (
                        <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 line-clamp-2">
                          <span className="text-slate-500 mr-1 font-sans font-bold">프롬프트:</span>
                          {sub.promptUsed}
                        </div>
                      )}

                      {/* Expandable Code & Live Demo */}
                      {isCodeExpanded && (
                        <div className="mt-3 space-y-2 animate-in fade-in">
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                              <span>소스코드 ({sub.language})</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sub.code);
                                  alert('코드가 클립보드에 복사되었습니다.');
                                }}
                                className="text-indigo-400 hover:text-indigo-300"
                              >
                                복사하기
                              </button>
                            </div>
                            <pre className="text-xs font-mono text-emerald-300 max-h-48 overflow-y-auto p-2 bg-slate-900 rounded-lg">
                              {sub.code}
                            </pre>
                          </div>
                          <CodeRunner code={sub.code} language={sub.language} isExpanded={true} />
                        </div>
                      )}

                      {/* Actions Bar & Peer Reactions */}
                      <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 flex-wrap">
                        {/* Peer Reactions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => onVote(sub.id, 'productivity')}
                            disabled={!isVotingOpen}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>생산성 {sub.reactions?.productivity || 0}</span>
                          </button>
                          <button
                            onClick={() => onVote(sub.id, 'prompt')}
                            disabled={!isVotingOpen}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors flex items-center gap-1"
                          >
                            <Lightbulb className="w-3 h-3 text-indigo-400" />
                            <span>프롬프트 {sub.reactions?.prompt || 0}</span>
                          </button>
                          <button
                            onClick={() => onVote(sub.id, 'practical')}
                            disabled={!isVotingOpen}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors flex items-center gap-1"
                          >
                            <Wrench className="w-3 h-3 text-emerald-400" />
                            <span>실무적용 {sub.reactions?.practical || 0}</span>
                          </button>
                        </div>

                        {/* Code Toggle & Stage Modal */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedCodeId(isCodeExpanded ? null : sub.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                          >
                            <CodeIcon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{isCodeExpanded ? '코드 접기' : '코드/시연'}</span>
                          </button>

                          <button
                            onClick={() => onSelectSubmission(sub)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>상세보기</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= ASSET PREVIEW MODAL ================= */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div>
                <h3 className="text-sm font-bold text-white">{previewAsset.title}</h3>
                <p className="text-xs text-slate-400">
                  {previewAsset.uploadedBy} · {new Date(previewAsset.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {previewAsset.dataUrl && previewAsset.fileType === 'image' && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img src={previewAsset.dataUrl} alt={previewAsset.title} className="w-full h-auto object-contain max-h-96" />
                </div>
              )}

              {previewAsset.content && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap">
                    {previewAsset.content}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-2">
              {previewAsset.content && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewAsset.content || '');
                    alert('내용이 복사되었습니다.');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  내용 복사
                </button>
              )}
              {previewAsset.dataUrl && (
                <a
                  href={previewAsset.dataUrl}
                  download={previewAsset.fileName || `${previewAsset.title}.png`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  다운로드
                </a>
              )}
              <button
                onClick={() => setPreviewAsset(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
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
