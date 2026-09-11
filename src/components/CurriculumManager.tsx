import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Eye,
  Trash2,
  Plus,
  Share2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  Presentation,
  Link2,
  ArrowUp,
  ArrowDown,
  Edit3,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { CurriculumSession, CurriculumCategory, LectureMaterial } from '../types';
import { DEFAULT_CURRICULUM_SESSIONS, DEFAULT_LECTURE_MATERIALS } from '../data/curriculumData';

interface CurriculumManagerProps {
  sessions?: CurriculumSession[];
  onUpdateSessions?: (sessions: CurriculumSession[]) => void;
  materials?: LectureMaterial[];
  onAddMaterial?: (material: LectureMaterial) => void;
  onDeleteMaterial?: (id: string) => void;
  onToggleShareMaterial?: (id: string) => void;
  readOnly?: boolean; // If true (e.g. for students), hide upload and edit controls
}

const STORAGE_KEY_SESSIONS = 'llm_curriculum_sessions_v4_3h_custom';
const STORAGE_KEY_MATERIALS = 'llm_lecture_materials_v1';

interface SessionFormData {
  title: string;
  category: CurriculumCategory;
  durationMinutes: number;
  summary: string;
  objectives: string[];
  handsOnTasks: string[];
  recommendedPrompts: string[];
  instructorNotes: string;
}

export const CurriculumManager: React.FC<CurriculumManagerProps> = ({
  sessions: propSessions,
  onUpdateSessions,
  materials: propMaterials,
  onAddMaterial,
  onDeleteMaterial,
  onToggleShareMaterial,
  readOnly = false,
}) => {
  // Local state initialized with props or localStorage or defaults
  const [sessions, setSessions] = useState<CurriculumSession[]>(() => {
    if (propSessions && propSessions.length > 0) return propSessions;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CURRICULUM_SESSIONS;
  });

  const [materials, setMaterials] = useState<LectureMaterial[]>(() => {
    if (propMaterials && propMaterials.length > 0) return propMaterials;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATERIALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LECTURE_MATERIALS;
  });

  // Keep in sync with props
  useEffect(() => {
    if (propSessions && propSessions.length > 0) {
      setSessions(propSessions);
    }
  }, [propSessions]);

  useEffect(() => {
    if (propMaterials && propMaterials.length > 0) {
      setMaterials(propMaterials);
    }
  }, [propMaterials]);

  // Save to localStorage
  const updateSessions = (newSessions: CurriculumSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newSessions));
    } catch (e) {}
    if (onUpdateSessions) onUpdateSessions(newSessions);
  };

  const updateMaterials = (newMaterials: LectureMaterial[]) => {
    setMaterials(newMaterials);
    try {
      localStorage.setItem(STORAGE_KEY_MATERIALS, JSON.stringify(newMaterials));
    } catch (e) {}
  };

  // Sub-tabs: 'timeline' | 'materials'
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'materials'>('timeline');

  // Selected session for detail view
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    () => sessions[0]?.id || 'session-orientation'
  );

  // Edit & Add Module Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    title: '',
    category: 'prompting',
    durationMinutes: 30,
    summary: '',
    objectives: [''],
    handsOnTasks: [''],
    recommendedPrompts: [''],
    instructorNotes: '',
  });

  const handleOpenEdit = (sess: CurriculumSession) => {
    setEditingSessionId(sess.id);
    setFormData({
      title: sess.title,
      category: sess.category,
      durationMinutes: sess.durationMinutes || 30,
      summary: sess.summary || '',
      objectives: sess.objectives && sess.objectives.length > 0 ? [...sess.objectives] : [''],
      handsOnTasks: sess.handsOnTasks && sess.handsOnTasks.length > 0 ? [...sess.handsOnTasks] : [''],
      recommendedPrompts:
        sess.recommendedPrompts && sess.recommendedPrompts.length > 0
          ? [...sess.recommendedPrompts]
          : [''],
      instructorNotes: sess.instructorNotes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingSessionId(null);
    setFormData({
      title: '',
      category: 'prompting',
      durationMinutes: 30,
      summary: '',
      objectives: [''],
      handsOnTasks: [''],
      recommendedPrompts: [''],
      instructorNotes: '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSessionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const cleanedObjectives = formData.objectives.map((o) => o.trim()).filter(Boolean);
    const cleanedTasks = formData.handsOnTasks.map((t) => t.trim()).filter(Boolean);
    const cleanedPrompts = formData.recommendedPrompts.map((p) => p.trim()).filter(Boolean);

    if (editingSessionId) {
      const updated = sessions.map((s) => {
        if (s.id === editingSessionId) {
          return {
            ...s,
            title: formData.title.trim(),
            category: formData.category,
            durationMinutes: Number(formData.durationMinutes) || 30,
            summary: formData.summary.trim(),
            objectives: cleanedObjectives.length > 0 ? cleanedObjectives : ['학습 목표를 입력해주세요.'],
            handsOnTasks: cleanedTasks.length > 0 ? cleanedTasks : ['실습 과제를 입력해주세요.'],
            recommendedPrompts: cleanedPrompts,
            instructorNotes: formData.instructorNotes.trim(),
          };
        }
        return s;
      });
      updateSessions(updated);
    } else {
      const newSession: CurriculumSession = {
        id: `session-${Date.now()}`,
        title: formData.title.trim(),
        category: formData.category,
        durationMinutes: Number(formData.durationMinutes) || 30,
        summary: formData.summary.trim(),
        objectives: cleanedObjectives.length > 0 ? cleanedObjectives : ['학습 목표를 입력해주세요.'],
        handsOnTasks: cleanedTasks.length > 0 ? cleanedTasks : ['실습 과제를 입력해주세요.'],
        recommendedPrompts: cleanedPrompts,
        instructorNotes: formData.instructorNotes.trim(),
        isCompleted: false,
      };
      const next = [...sessions, newSession];
      updateSessions(next);
      setSelectedSessionId(newSession.id);
    }

    setIsEditModalOpen(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (readOnly) return;
    if (sessions.length <= 1) {
      alert('최소 1개의 모듈은 유지되어야 합니다.');
      return;
    }
    const target = sessions.find((s) => s.id === sessionId);
    if (!confirm(`"${target?.title}" 모듈을 삭제하시겠습니까?`)) return;
    const next = sessions.filter((s) => s.id !== sessionId);
    updateSessions(next);
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(next[0]?.id || '');
    }
  };

  const handleMoveSession = (index: number, direction: 'up' | 'down') => {
    if (readOnly) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sessions.length) return;
    const next = [...sessions];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    updateSessions(next);
  };

  const handleResetDefault = () => {
    if (readOnly) return;
    if (
      !confirm(
        '커리큘럼을 표준 3시간(180분) 템플릿으로 초기화하시겠습니까?\n작성했던 커스텀 편집 내용이 기본값으로 복원됩니다.'
      )
    )
      return;
    updateSessions(DEFAULT_CURRICULUM_SESSIONS);
    setSelectedSessionId(DEFAULT_CURRICULUM_SESSIONS[0]?.id || '');
  };

  // Currently viewing material in modal
  const [viewingMaterial, setViewingMaterial] = useState<LectureMaterial | null>(null);
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);

  // Copied prompt feedback
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<string | null>(null);

  // File Upload Handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Add External Link Modal / State
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDesc, setLinkDesc] = useState('');

  const handleCopyPrompt = (prompt: string, key: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptIndex(key);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  const handleToggleSessionComplete = (sessionId: string) => {
    if (readOnly) return;
    const next = sessions.map((s) =>
      s.id === sessionId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    updateSessions(next);
  };

  // Process uploaded files
  const processUploadedFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    let fileType: LectureMaterial['fileType'] = 'other';
    if (extension === 'pdf') fileType = 'pdf';
    else if (['ppt', 'pptx'].includes(extension)) fileType = 'pptx';
    else if (['doc', 'docx'].includes(extension)) fileType = 'docx';
    else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension)) fileType = 'image';
    else if (['md', 'markdown', 'txt'].includes(extension)) fileType = 'markdown';

    let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    if (file.size >= 1024 * 1024) {
      sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    const reader = new FileReader();

    if (fileType === 'markdown') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const newMat: LectureMaterial = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          fileType,
          fileSize: sizeStr,
          uploadedAt: Date.now(),
          uploadedBy: '강사',
          textContent: text,
          isSharedWithStudents: true,
          description: `업로드된 ${file.name} 강의안 문서입니다.`,
        };
        const next = [newMat, ...materials];
        updateMaterials(next);
        if (onAddMaterial) onAddMaterial(newMat);
        setIsUploading(false);
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newMat: LectureMaterial = {
          id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          fileType,
          fileSize: sizeStr,
          uploadedAt: Date.now(),
          uploadedBy: '강사',
          fileDataUrl: dataUrl,
          isSharedWithStudents: true,
          description: `업로드된 ${file.name} 강의안 파일입니다.`,
        };
        const next = [newMat, ...materials];
        updateMaterials(next);
        if (onAddMaterial) onAddMaterial(newMat);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFilesSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      processUploadedFile(files[i]);
    }
  };

  const handleAddExternalLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const newMat: LectureMaterial = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: linkTitle.trim() || '온라인 강의안 슬라이드',
      fileName: '외부 웹 링크',
      fileType: 'link',
      fileSize: '웹 링크',
      uploadedAt: Date.now(),
      uploadedBy: '강사',
      externalUrl: url,
      isSharedWithStudents: true,
      description: linkDesc.trim() || url,
    };
    const next = [newMat, ...materials];
    updateMaterials(next);
    if (onAddMaterial) onAddMaterial(newMat);
    setIsAddLinkModalOpen(false);
    setLinkTitle('');
    setLinkUrl('');
    setLinkDesc('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('해당 강의안 파일을 삭제하시겠습니까?')) return;
    const next = materials.filter((m) => m.id !== id);
    updateMaterials(next);
    if (onDeleteMaterial) onDeleteMaterial(id);
    if (viewingMaterial?.id === id) setViewingMaterial(null);
  };

  const handleToggleShare = (id: string) => {
    const next = materials.map((m) =>
      m.id === id ? { ...m, isSharedWithStudents: !m.isSharedWithStudents } : m
    );
    updateMaterials(next);
    if (onToggleShareMaterial) onToggleShareMaterial(id);
  };

  // Download material
  const handleDownload = (mat: LectureMaterial) => {
    if (mat.externalUrl) {
      window.open(mat.externalUrl, '_blank');
      return;
    }
    if (mat.fileDataUrl) {
      const a = document.createElement('a');
      a.href = mat.fileDataUrl;
      a.download = mat.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (mat.textContent) {
      const blob = new Blob([mat.textContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mat.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const completedCount = sessions.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / sessions.length) * 100);

  const getCategoryColor = (cat: CurriculumSession['category']) => {
    switch (cat) {
      case 'orientation':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'theory':
      case 'prompting':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'eda':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'hackathon':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'mentoring':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'pitching':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'award':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCategoryLabel = (cat: CurriculumSession['category']) => {
    switch (cat) {
      case 'orientation':
        return '오리엔테이션';
      case 'theory':
        return '이론';
      case 'prompting':
        return '프롬프트 실무';
      case 'eda':
        return 'FAB 데이터 EDA';
      case 'hackathon':
        return '해커톤 집중 개발';
      case 'mentoring':
        return '멘토링 & 디버깅';
      case 'pitching':
        return '릴레이 피칭 & 시연';
      case 'award':
        return '시상 & 피드백';
      default:
        return '세션';
    }
  };

  const getFileTypeBadge = (type: LectureMaterial['fileType']) => {
    switch (type) {
      case 'pdf':
        return { label: 'PDF 슬라이드', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'pptx':
        return { label: 'PPTX 프레젠테이션', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'docx':
        return { label: 'DOCX 문서', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'markdown':
        return { label: 'MARKDOWN 교안', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'image':
        return { label: 'IMAGE 이미지', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'link':
        return { label: 'WEB 웹 슬라이드', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      default:
        return { label: 'FILE 파일', bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          handleFilesSelect(e.target.files);
          if (e.target) e.target.value = '';
        }}
        multiple
        accept=".pdf,.ppt,.pptx,.doc,.docx,.md,.txt,.png,.jpg,.jpeg,.zip"
        className="hidden"
      />

      {/* Header & Quick Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    교육 커리큘럼 & 강의안 보관함
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Syllabus & Slides
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  반도체 제조 혁신 온보딩 LLM 해커톤 표준 타임라인 및 강의안 파일(PDF/PPT) 즉시 열람
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Progress */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Total Duration Badge */}
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">총 교육:</span>
              <span className="font-bold text-white">{sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)}분</span>
              <span className="text-slate-400">
                ({(sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60).toFixed(1)}시간)
              </span>
            </div>

            {/* Progress Badge */}
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center gap-2">
              <span className="text-slate-400 font-medium">진도 현황:</span>
              <span className="font-mono font-black text-emerald-400">
                {completedCount}/{sessions.length} 모듈
              </span>
              <span className="text-slate-500">({progressPercent}%)</span>
            </div>

            {/* Instructor Actions */}
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                  title="새로운 교육 모듈 추가"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 모듈 추가</span>
                </button>

                <button
                  onClick={handleResetDefault}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                  title="표준 3시간(180분) 템플릿으로 복원"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline">3시간 템플릿 복원</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  title="PDF, PPTX, DOCX, Markdown 파일 업로드"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>강의안 파일 업로드</span>
                </button>

                <button
                  onClick={() => setIsAddLinkModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                  title="Google Slides, Notion 링크 추가"
                >
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">웹 슬라이드 링크</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>⏱️ 커리큘럼 타임라인 & 모듈</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700">
                {sessions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('materials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'materials'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📑 강의안 파일 & 슬라이드 뷰어</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700">
                {materials.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2 font-mono">
            <span>총 {sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)}분 ({(sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60).toFixed(1)}시간) 실습</span>
            <span>·</span>
            <span>순서 및 소요시간 자유 편집 지원</span>
          </div>
        </div>
      </div>

      {/* ================= SUB-TAB 1: TIMELINE & MODULE DETAILS ================= */}
      {activeSubTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Timeline Modules List (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span>진행 모듈 목록 ({sessions.length}개)</span>
              {!readOnly && (
                <button
                  onClick={handleOpenAdd}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 모듈 추가</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {sessions.map((sess, index) => {
                const isSelected = sess.id === selectedSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedSessionId(sess.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSessionComplete(sess.id);
                          }}
                          className={`text-slate-500 hover:text-white transition-colors ${
                            readOnly ? 'cursor-default' : 'cursor-pointer'
                          }`}
                          title={sess.isCompleted ? '완료 취소' : '모듈 완료 체크'}
                        >
                          {sess.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(
                            sess.category
                          )}`}
                        >
                          {getCategoryLabel(sess.category)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{sess.durationMinutes}분</span>
                        </div>

                        {!readOnly && (
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveSession(index, 'up')}
                              className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                                index === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white'
                              }`}
                              title="순서 위로 이동"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === sessions.length - 1}
                              onClick={() => handleMoveSession(index, 'down')}
                              className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                                index === sessions.length - 1
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="순서 아래로 이동"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sess)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                              title="모듈 편집"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(sess.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="모듈 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3
                      className={`mt-2 text-xs sm:text-sm font-bold tracking-tight transition-colors ${
                        isSelected ? 'text-white' : 'text-slate-200'
                      } ${sess.isCompleted ? 'line-through text-slate-500' : ''}`}
                    >
                      {sess.title}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {sess.summary}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>학습 목표 {sess.objectives.length}개</span>
                      <span className="flex items-center gap-1 text-indigo-400 font-bold">
                        <span>세부 보기</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed View of Selected Session (7 cols) */}
          <div className="lg:col-span-7">
            <div className="sticky top-16 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              {/* Session Title Header */}
              <div className="border-b border-slate-800 pb-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getCategoryColor(
                        selectedSession.category
                      )}`}
                    >
                      {getCategoryLabel(selectedSession.category)}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedSession.durationMinutes}분 소요
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(selectedSession)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-colors"
                          title="이 모듈 편집"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>모듈 내용 편집</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSession(selectedSession.id)}
                          className="p-1 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition-colors"
                          title="모듈 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {!readOnly && (
                      <button
                        onClick={() => handleToggleSessionComplete(selectedSession.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          selectedSession.isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{selectedSession.isCompleted ? '진행 완료됨' : '진행 완료로 표시'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  {selectedSession.title}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {selectedSession.summary}
                </p>
              </div>

              {/* Learning Objectives */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>핵심 학습 목표 (Learning Objectives)</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedSession.objectives.map((obj, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80"
                    >
                      <span className="text-indigo-400 font-mono font-bold">0{i + 1}.</span>
                      <span className="leading-normal">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hands-on Tasks */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>실습 과제 및 팀 액션 아이템</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedSession.handsOnTasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-300 bg-emerald-950/10 p-2.5 rounded-lg border border-emerald-800/30"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="leading-normal">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Prompts */}
              {selectedSession.recommendedPrompts && selectedSession.recommendedPrompts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>추천 프롬프트 템플릿 (원클릭 복사)</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedSession.recommendedPrompts.map((prompt, i) => {
                      const copyKey = `${selectedSession.id}-${i}`;
                      const isCopied = copiedPromptIndex === copyKey;
                      return (
                        <div
                          key={i}
                          className="relative p-3 rounded-xl bg-slate-950 border border-slate-800 group"
                        >
                          <p className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed pr-16">
                            {prompt}
                          </p>
                          <button
                            onClick={() => handleCopyPrompt(prompt, copyKey)}
                            className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isCopied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>복사완료</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>복사</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instructor Notes */}
              {selectedSession.instructorNotes && !readOnly && (
                <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Info className="w-3.5 h-3.5" />
                    <span>강사 전용 티칭 노트 & 현장 지도 팁</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    {selectedSession.instructorNotes}
                  </p>
                </div>
              )}

              {/* Associated Materials Shortcut */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>관련 강의안 파일 열람이 필요하신가요?</span>
                <button
                  onClick={() => setActiveSubTab('materials')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>강의안 보관함 바로가기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: LECTURE MATERIALS & SLIDE VIEWER ================= */}
      {activeSubTab === 'materials' && (
        <div className="space-y-4">
          {/* Drag & Drop Upload Zone (For Instructor) */}
          {!readOnly && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFilesSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center space-y-2 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-950/40 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  강의안 파일(PDF, PPT, DOCX, Markdown)을 여기에 드래그하거나 클릭하여 추가하세요
                </p>
                <p className="text-xs text-slate-400">
                  업로드된 파일은 브라우저 내에서 즉시 슬라이드로 열람하고 교육생과 공유할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                <span>지원 형식: .pdf, .pptx, .ppt, .docx, .md, .png, .jpg</span>
              </div>
            </div>
          )}

          {/* Materials List Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400">
              <span>등록된 강의자료 목록 ({materials.length}건)</span>
              <span>열람 / 다운로드 / 공유</span>
            </div>

            {materials.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                등록된 강의안이 없습니다. 위의 업로드 버튼을 눌러 강의안 파일을 등록해주세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {materials.map((mat) => {
                  const badge = getFileTypeBadge(mat.fileType);
                  return (
                    <div
                      key={mat.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {mat.fileSize}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {mat.title}
                          </h3>
                          <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                            {mat.fileName}
                          </p>
                        </div>

                        {mat.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {mat.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {/* Share status */}
                        <div className="flex items-center gap-1.5">
                          {!readOnly && (
                            <button
                              onClick={() => handleToggleShare(mat.id)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                mat.isSharedWithStudents
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                              title={
                                mat.isSharedWithStudents
                                  ? '현재 교육생 뷰에 공개 중'
                                  : '교육생 뷰에서 비공개(강사 전용)'
                              }
                            >
                              <Share2 className="w-3 h-3" />
                              <span>{mat.isSharedWithStudents ? '교육생 공유됨' : '강사 전용'}</span>
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {/* In-App Preview Button */}
                          <button
                            onClick={() => setViewingMaterial(mat)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
                            title="강의안 미리보기 / 열람"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>열람</span>
                          </button>

                          {/* Download Button */}
                          <button
                            onClick={() => handleDownload(mat)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="다운로드"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          {!readOnly && (
                            <button
                              onClick={() => handleDelete(mat.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= IN-APP LECTURE MATERIAL VIEWER MODAL ================= */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl transition-all ${
              isViewerFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[85vh]'
            }`}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950 rounded-t-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Presentation className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {viewingMaterial.title}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    {viewingMaterial.fileName} · {viewingMaterial.fileSize}
                  </p>
                </div>
              </div>

              {/* Viewer Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(viewingMaterial)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                  title="다운로드"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">다운로드</span>
                </button>

                {viewingMaterial.fileDataUrl && (
                  <button
                    onClick={() => {
                      const win = window.open();
                      if (win && viewingMaterial.fileDataUrl) {
                        win.document.write(
                          `<iframe src="${viewingMaterial.fileDataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                        );
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                    title="새 창에서 프로젝터 뷰로 열기"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">새 창 열기</span>
                  </button>
                )}

                <button
                  onClick={() => setIsViewerFullscreen(!isViewerFullscreen)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title={isViewerFullscreen ? '창 축소' : '전체화면'}
                >
                  {isViewerFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setViewingMaterial(null);
                    setIsViewerFullscreen(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-slate-400 hover:text-white transition-colors"
                  title="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Content Viewer */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950 flex flex-col">
              {viewingMaterial.fileType === 'pdf' && viewingMaterial.fileDataUrl ? (
                <iframe
                  src={viewingMaterial.fileDataUrl}
                  title={viewingMaterial.title}
                  className="w-full flex-1 rounded-xl border border-slate-800 bg-white"
                />
              ) : viewingMaterial.fileType === 'markdown' && viewingMaterial.textContent ? (
                <div className="max-w-4xl mx-auto w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 text-slate-200">
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {viewingMaterial.textContent}
                  </div>
                </div>
              ) : viewingMaterial.fileType === 'image' && viewingMaterial.fileDataUrl ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <img
                    src={viewingMaterial.fileDataUrl}
                    alt={viewingMaterial.title}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                  />
                </div>
              ) : viewingMaterial.externalUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                    <ExternalLink className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">{viewingMaterial.title}</h4>
                    <p className="text-xs text-slate-400 max-w-md">
                      외부 클라우드/웹 슬라이드(Google Slides, Notion 등)입니다. 아래 버튼을 눌러 새 탭에서 열어주세요.
                    </p>
                  </div>
                  <a
                    href={viewingMaterial.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <span>새 탭에서 슬라이드 열기</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
                  <FileText className="w-12 h-12 text-slate-600" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{viewingMaterial.fileName}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      해당 파일 형식({viewingMaterial.fileType})은 직접 다운로드하여 전용 뷰어(PowerPoint 등)에서 열람하실 수 있습니다.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(viewingMaterial)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>파일 다운로드하여 열기</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD EXTERNAL LINK MODAL ================= */}
      {isAddLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">웹 슬라이드 / 강의안 링크 추가</h3>
              </div>
              <button
                onClick={() => setIsAddLinkModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExternalLink} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  강의자료 명칭
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 반도체 LLM 해커톤 Google Slides"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  슬라이드 URL (Google Slides, Notion, OneDrive 등)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/presentation/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  간단한 설명 (선택)
                </label>
                <textarea
                  rows={2}
                  placeholder="강의 발표용 슬라이드 링크입니다."
                  value={linkDesc}
                  onChange={(e) => setLinkDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLinkModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  링크 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT / CREATE MODULE MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingSessionId ? '교육 모듈 내용 수정' : '새로운 교육 모듈 추가'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    모듈의 제목, 소요 시간, 학습 목표, 실습 과제 및 추천 프롬프트를 자유롭게 편집하세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveSessionForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Row 1: Title */}
              <div>
                <label className="block font-bold text-slate-200 mb-1.5">
                  모듈 명칭 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: FAB 실시간 센서 불량 탐지 프롬프팅"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Row 2: Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as CurriculumCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="orientation">오리엔테이션</option>
                    <option value="theory">이론</option>
                    <option value="prompting">프롬프트 실무</option>
                    <option value="eda">FAB 데이터 EDA</option>
                    <option value="hackathon">해커톤 집중 개발</option>
                    <option value="mentoring">멘토링 & 디버깅</option>
                    <option value="pitching">릴레이 피칭 & 시연</option>
                    <option value="award">시상 & 피드백</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    소요 시간 (분 단위) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={5}
                      max={300}
                      step={5}
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMinutes: Math.max(5, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500 pr-10"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-mono">분</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Summary */}
              <div>
                <label className="block font-bold text-slate-200 mb-1.5">핵심 개요 (Summary)</label>
                <textarea
                  rows={2}
                  placeholder="모듈의 주요 활동 및 목표 요약을 적어주세요."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Row 4: Objectives Dynamic List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>핵심 학습 목표 (Learning Objectives)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, objectives: [...formData.objectives, ''] })
                    }
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>목표 추가</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.objectives.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 w-5 text-right">{i + 1}.</span>
                      <input
                        type="text"
                        placeholder={`학습 목표 #${i + 1}`}
                        value={obj}
                        onChange={(e) => {
                          const next = [...formData.objectives];
                          next[i] = e.target.value;
                          setFormData({ ...formData, objectives: next });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      />
                      {formData.objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.objectives.filter((_, idx) => idx !== i);
                            setFormData({ ...formData, objectives: next });
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                          title="삭제"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Hands-on Tasks Dynamic List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>실습 과제 및 팀 액션 아이템</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, handsOnTasks: [...formData.handsOnTasks, ''] })
                    }
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>과제 추가</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.handsOnTasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 w-5 text-right">·</span>
                      <input
                        type="text"
                        placeholder={`실습 과제 #${i + 1}`}
                        value={task}
                        onChange={(e) => {
                          const next = [...formData.handsOnTasks];
                          next[i] = e.target.value;
                          setFormData({ ...formData, handsOnTasks: next });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                      {formData.handsOnTasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.handsOnTasks.filter((_, idx) => idx !== i);
                            setFormData({ ...formData, handsOnTasks: next });
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                          title="삭제"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 6: Recommended Prompts Dynamic List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    <span>추천 프롬프트 템플릿 (선택 사항)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        recommendedPrompts: [...formData.recommendedPrompts, ''],
                      })
                    }
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>프롬프트 추가</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.recommendedPrompts.map((prompt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="font-mono text-slate-500 w-5 text-right pt-2">{i + 1}.</span>
                      <textarea
                        rows={2}
                        placeholder={`프롬프트 템플릿 #${i + 1}`}
                        value={prompt}
                        onChange={(e) => {
                          const next = [...formData.recommendedPrompts];
                          next[i] = e.target.value;
                          setFormData({ ...formData, recommendedPrompts: next });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = formData.recommendedPrompts.filter((_, idx) => idx !== i);
                          setFormData({ ...formData, recommendedPrompts: next });
                        }}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 mt-1"
                        title="삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 7: Instructor Notes */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>강사 전용 현장 지도 팁 / 티칭 노트 (선택 사항)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 비전공자 교육생들이 어려워하는 경우 ~을 먼저 안내하세요."
                  value={formData.instructorNotes}
                  onChange={(e) => setFormData({ ...formData, instructorNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {editingSessionId ? '수정 내용 저장' : '새 모듈 생성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
