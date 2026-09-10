/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId, useRef } from 'react';
import { CodeSubmission, TrainingSessionConfig, TeamActivity, ProductivityCategory, SampleDataset } from './types';
import { PresenterDashboard } from './components/PresenterDashboard';
import { ParticipantTeamView } from './components/ParticipantTeamView';
import { SubmissionModal } from './components/SubmissionModal';
import { TeamPresentationStage } from './components/TeamPresentationStage';
import { INITIAL_15_TEAMS, INITIAL_SUBMISSIONS, createDefaultTeam, isTeamSubmitted } from './data/teamData';
import { getInitialDatasets } from './data/sampleDatasets';
import { Users, Laptop, ArrowRight, ExternalLink, Sparkles, Database } from 'lucide-react';
import {
  DEFAULT_SESSION_ID,
  subscribeToSubmissions,
  subscribeToTeams,
  subscribeToDatasets,
  subscribeToSessionConfig,
  saveSubmissionToFirebase,
  updateTeamInFirebase,
  saveDatasetToFirebase,
  recordVoteInFirebase,
  updateSessionConfigInFirebase,
  seedSessionIfEmpty,
  testConnection,
} from './utils/firebase';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';

// Helper to parse team from URL:
// ?team=0 -> Presenter (강사용)
// ?team=1, 2, ... -> Participant (1조, 2조, ...)
// /team0 -> Presenter
// /team1, /team2, ... -> Participant
// #team0 -> Presenter
// #team1, #team2, ... -> Participant
function parseTeamFromLocation(): number | null {
  if (typeof window === 'undefined') return 0;

  // 1. Query parameter ?team=...
  const params = new URLSearchParams(window.location.search);
  const teamParam = params.get('team');
  if (teamParam !== null) {
    const clean = teamParam.toLowerCase().replace('team', '').replace('조', '');
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 0) return num;
  }

  // 2. Pathname /team0 ... /team99
  const pathMatch = window.location.pathname.match(/\/team(\d+)(?:\/|$)/i);
  if (pathMatch) {
    const num = parseInt(pathMatch[1], 10);
    if (!isNaN(num) && num >= 0) return num;
  }

  // 3. Hash #team0 ... #team99
  const hashMatch = window.location.hash.match(/#team(\d+)(?:\/|$)/i);
  if (hashMatch) {
    const num = parseInt(hashMatch[1], 10);
    if (!isNaN(num) && num >= 0) return num;
  }

  return null;
}

export default function App() {
  // Clear any legacy mock data cached in browser localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('llm_hackathon_submissions_data');
      localStorage.removeItem('llm_hackathon_teams_data');
    } catch (e) {}
  }

  // URL-based Team Routing: 0 = Presenter (강사용 team0), 1..15 = Participant (1조..15조 team1..15), null = Team Selector
  const [currentTeamNumber, setCurrentTeamNumber] = useState<number | null>(parseTeamFromLocation);

  const navigateToTeam = (teamNum: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('team', String(teamNum));
    window.history.pushState({ team: teamNum }, '', url.toString());
    setCurrentTeamNumber(teamNum);
  };

  // Submissions state with LocalStorage persistence for GitHub Pages static environment
  const [submissions, setSubmissions] = useState<CodeSubmission[]>(() => {
    // Clear legacy keys if present
    try {
      localStorage.removeItem('llm_hackathon_v2_submissions');
      localStorage.removeItem('llm_hackathon_v2_teams');
      localStorage.removeItem('llm_hackathon_submissions_data');
      localStorage.removeItem('llm_hackathon_teams_data');
    } catch (e) {}

    const cached = localStorage.getItem('semiconductor_mfg_v1_submissions');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_SUBMISSIONS;
  });

  // Normalization helper: ensures unsubmitted teams have no arbitrary category
  const sanitizeTeam = (t: TeamActivity, subs: CodeSubmission[]): TeamActivity => {
    const hasSub = isTeamSubmitted(t, subs);
    if (!hasSub) {
      return { ...t, category: undefined, isRegistered: false };
    }
    return { ...t, isRegistered: true };
  };

  // Teams state with LocalStorage persistence (up to 32 teams)
  const [teams, setTeams] = useState<TeamActivity[]>(() => {
    const cached = localStorage.getItem('semiconductor_mfg_v1_teams');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((t: TeamActivity) => {
            const hasSub = isTeamSubmitted(t);
            return hasSub ? { ...t, isRegistered: true } : { ...t, category: undefined, isRegistered: false };
          });
          if (cleaned.length < 32) {
            const existingNumbers = new Set(cleaned.map((t: TeamActivity) => t.teamNumber));
            const additions: TeamActivity[] = [];
            for (let i = 1; i <= 32; i++) {
              if (!existingNumbers.has(i)) {
                additions.push(createDefaultTeam(i));
              }
            }
            return [...cleaned, ...additions].sort((a, b) => a.teamNumber - b.teamNumber);
          }
          return cleaned;
        }
      } catch (e) {}
    }
    return INITIAL_15_TEAMS;
  });

  // Semiconductor Sample Datasets state with LocalStorage persistence & server sync
  const [datasets, setDatasets] = useState<SampleDataset[]>(() => {
    const defaults = getInitialDatasets();
    const cachedV2 = localStorage.getItem('semiconductor_mfg_v2_datasets');
    if (cachedV2) {
      try {
        const parsed = JSON.parse(cachedV2);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const cachedV1 = localStorage.getItem('semiconductor_mfg_v1_datasets');
    if (cachedV1) {
      try {
        const parsed = JSON.parse(cachedV1);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultIds = new Set(defaults.map((d) => d.id));
          const customAdded = parsed.filter((item: SampleDataset) => !defaultIds.has(item.id) && !item.id.startsWith('dataset-wafer-defect'));
          return [...defaults, ...customAdded];
        }
      } catch (e) {}
    }
    return defaults;
  });

  const [sessionConfig, setSessionConfig] = useState<TrainingSessionConfig>({
    totalTargetTeams: 32,
    trainingTitle: '반도체 제조 혁신 LLM 생산성 극대화 발표회',
    instructorName: '반도체 AI 디렉터',
    isVotingOpen: true,
    submissionDeadlineMinutes: 30,
    sessionStartTime: Date.now(),
  });

  // Client unique voter token
  const [voterToken, setVoterToken] = useState<string>('');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  // Presentation Stage states
  const [isTeamPresentationOpen, setIsTeamPresentationOpen] = useState<boolean>(false);
  const [currentPresentationTeamIndex, setCurrentPresentationTeamIndex] = useState<number>(0);

  // Modal states
  const [selectedSubmission, setSelectedSubmission] = useState<CodeSubmission | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Firebase Session ID (Defaults to 2026onboarding)
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      if (sessionParam) return sessionParam;
      return localStorage.getItem('semiconductor_active_session_id') || DEFAULT_SESSION_ID;
    }
    return DEFAULT_SESSION_ID;
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);

  // Realtime Firebase Firestore synchronization for 2026onboarding
  useEffect(() => {
    let unsubSubs: (() => void) | undefined;
    let unsubTeams: (() => void) | undefined;
    let unsubDatasets: (() => void) | undefined;
    let unsubConfig: (() => void) | undefined;

    testConnection()
      .then((connected) => {
        setIsFirebaseConnected(connected);
        return seedSessionIfEmpty(
          sessionId,
          INITIAL_15_TEAMS,
          INITIAL_SUBMISSIONS,
          getInitialDatasets(),
          sessionConfig
        );
      })
      .then(() => {
        unsubSubs = subscribeToSubmissions(sessionId, (remoteSubs) => {
          if (remoteSubs && remoteSubs.length > 0) {
            setSubmissions(remoteSubs);
            setSelectedSubmission((prev) => {
              if (!prev) return null;
              return remoteSubs.find((s) => s.id === prev.id) || prev;
            });
          }
        });

        unsubTeams = subscribeToTeams(sessionId, (remoteTeams) => {
          if (remoteTeams && remoteTeams.length > 0) {
            const sanitized = remoteTeams.map((t) => sanitizeTeam(t, submissions));
            if (sanitized.length < 32) {
              const existingNumbers = new Set(sanitized.map((t) => t.teamNumber));
              const additions: TeamActivity[] = [];
              for (let i = 1; i <= 32; i++) {
                if (!existingNumbers.has(i)) {
                  const newT = createDefaultTeam(i);
                  additions.push(newT);
                  updateTeamInFirebase(sessionId, newT).catch(() => {});
                }
              }
              const merged = [...sanitized, ...additions].sort((a, b) => a.teamNumber - b.teamNumber);
              setTeams(merged);
            } else {
              setTeams(sanitized);
            }
          }
        });

        unsubDatasets = subscribeToDatasets(sessionId, (remoteDatasets) => {
          if (remoteDatasets && remoteDatasets.length > 0) {
            setDatasets(remoteDatasets);
          }
        });

        unsubConfig = subscribeToSessionConfig(sessionId, (remoteConfig) => {
          if (remoteConfig) {
            setSessionConfig(remoteConfig);
          }
        });
      })
      .catch((err) => {
        console.warn('Firebase sync notice:', err);
      });

    return () => {
      if (unsubSubs) unsubSubs();
      if (unsubTeams) unsubTeams();
      if (unsubDatasets) unsubDatasets();
      if (unsubConfig) unsubConfig();
    };
  }, [sessionId]);

  // Persist teams and submissions to localStorage for GitHub Pages compatibility
  useEffect(() => {
    try {
      localStorage.setItem('semiconductor_mfg_v1_submissions', JSON.stringify(submissions));
    } catch (e) {}
  }, [submissions]);

  useEffect(() => {
    try {
      localStorage.setItem('semiconductor_mfg_v1_teams', JSON.stringify(teams));
    } catch (e) {}
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem('semiconductor_mfg_v2_datasets', JSON.stringify(datasets));
    } catch (e) {}
  }, [datasets]);

  // Sync datasets from server on load if available
  useEffect(() => {
    fetch('/api/datasets')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.datasets && Array.isArray(data.datasets) && data.datasets.length > 0) {
          setDatasets(data.datasets);
        }
      })
      .catch(() => {});
  }, []);

  // Sync with browser navigation & URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTeamNumber(parseTeamFromLocation());
    };
    window.addEventListener('popstate', handlePopState);

    // Initialize or load voter token
    let token = localStorage.getItem('llm_hackathon_voter_token');
    if (!token) {
      token = 'voter-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('llm_hackathon_voter_token', token);
    }
    setVoterToken(token);

    // Load voted ids cache
    const cachedVoted = localStorage.getItem('llm_hackathon_voted_ids');
    if (cachedVoted) {
      try {
        setVotedIds(new Set(JSON.parse(cachedVoted)));
      } catch {}
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch submissions and session status from server (if server exists, else gracefully fallback)
  const fetchData = useCallback(async () => {
    try {
      const [subsRes, sessionRes] = await Promise.all([
        fetch('/api/submissions').catch(() => null),
        fetch('/api/session').catch(() => null),
      ]);

      if (subsRes && subsRes.ok) {
        const subsData = await subsRes.json();
        if (subsData.submissions && Array.isArray(subsData.submissions)) {
          setSubmissions(subsData.submissions);

          setSelectedSubmission((prev) => {
            if (!prev) return null;
            return subsData.submissions.find((s: CodeSubmission) => s.id === prev.id) || prev;
          });
        }
      }

      if (sessionRes && sessionRes.ok) {
        const sessData = await sessionRes.json();
        if (sessData.config) {
          setSessionConfig(sessData.config);
        }
      }
    } catch (e) {
      // In GitHub Pages (static), API fetch is not available, relying on local state
    }
  }, []);

  // Polling every 3 seconds (graceful fallback on static hosting)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle Voting with optional reaction (Strict: 1 vote per person per item)
  const handleVote = async (id: string, reactionType?: string) => {
    if (!sessionConfig.isVotingOpen) {
      alert('현재 투표가 마감되었거나 일시 중지 상태입니다.');
      return;
    }

    const voteKey = reactionType ? `sub_reaction_${id}_${reactionType}` : id;
    const currentlyVoted = votedIds.has(voteKey);
    const newVoted = new Set(votedIds);

    if (currentlyVoted) {
      newVoted.delete(voteKey);
    } else {
      newVoted.add(voteKey);
    }
    setVotedIds(newVoted);
    localStorage.setItem('llm_hackathon_voted_ids', JSON.stringify(Array.from(newVoted)));

    const delta = currentlyVoted ? -1 : 1;

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newVotes = reactionType ? s.votes : Math.max(0, s.votes + delta);
          let updatedReactions = { ...(s.reactions || { fast: 0, creative: 0, practical: 0, wellPrompted: 0 }) };
          if (reactionType && (updatedReactions as any)[reactionType] !== undefined) {
            (updatedReactions as any)[reactionType] = Math.max(
              0,
              ((updatedReactions as any)[reactionType] || 0) + delta
            );
          }
          return {
            ...s,
            votes: newVotes,
            reactions: updatedReactions,
          };
        }
        return s;
      })
    );

    // Also update team total votes if main vote
    if (!reactionType) {
      const targetSub = submissions.find((s) => s.id === id);
      if (targetSub && targetSub.team) {
        setTeams((prev) =>
          prev.map((t) => {
            if (`${t.teamNumber}조` === targetSub.team || t.teamName === targetSub.team) {
              return {
                ...t,
                totalTeamVotes: Math.max(0, t.totalTeamVotes + delta),
              };
            }
            return t;
          })
        );
      }
    }

    // Sync to Firestore for 2026onboarding
    const currentSub = submissions.find((s) => s.id === id);
    const newVotesTotal = Math.max(0, (currentSub?.votes || 0) + delta);
    recordVoteInFirebase(sessionId, id, voterToken, newVotesTotal).catch(() => {});

    // Try API call if backend is active
    try {
      const res = await fetch(`/api/submissions/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterToken, reactionType }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, votes: data.votes, reactions: data.reactions || s.reactions } : s))
          );
        }
      }
    } catch (e) {
      // Offline / GitHub Pages local persistence active
    }
  };

  // Handle Team Presentation Scoring (Strict: 1 vote per person per item)
  const handleScoreTeam = (
    teamId: string,
    category?: 'innovation' | 'practicality' | 'presentation' | 'promptQuality'
  ) => {
    const voteKey = category ? `team_${teamId}_${category}` : `team_${teamId}_heart`;
    const currentlyVoted = votedIds.has(voteKey);
    const newVoted = new Set(votedIds);

    if (currentlyVoted) {
      newVoted.delete(voteKey);
    } else {
      newVoted.add(voteKey);
    }
    setVotedIds(newVoted);
    localStorage.setItem('llm_hackathon_voted_ids', JSON.stringify(Array.from(newVoted)));

    const delta = currentlyVoted ? -1 : 1;

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const currentFeedbacks = t.feedbackTags || {
            innovation: 0,
            practicality: 0,
            presentation: 0,
            promptQuality: 0,
          };
          const updatedTeam: TeamActivity = {
            ...t,
            totalTeamVotes: Math.max(0, t.totalTeamVotes + delta),
            feedbackTags: category
              ? {
                  ...currentFeedbacks,
                  [category]: Math.max(0, (currentFeedbacks[category] || 0) + delta),
                }
              : currentFeedbacks,
          };
          updateTeamInFirebase(sessionId, updatedTeam).catch(() => {});
          return updatedTeam;
        }
        return t;
      })
    );
  };

  // Handle Update Team Presentation Status
  const handleUpdateTeamStatus = (
    teamId: string,
    status: 'waiting' | 'presenting' | 'completed'
  ) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const updated = { ...t, presentationStatus: status };
          updateTeamInFirebase(sessionId, updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );
  };

  // Handle Starting Team Presentation Stage
  const handleStartTeamPresentation = (teamIndex: number) => {
    setCurrentPresentationTeamIndex(teamIndex);
    setIsTeamPresentationOpen(true);
    // Mark this team as presenting
    const targetTeam = teams[teamIndex];
    if (targetTeam) {
      handleUpdateTeamStatus(targetTeam.id, 'presenting');
    }
  };

  // Handle New Submission from participant
  const handleSubmitSubmission = async (newSubData: Partial<CodeSubmission>): Promise<boolean> => {
    const newSubmission: CodeSubmission = {
      id: 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      title: newSubData.title || '신규 반도체 개선 과제',
      category: (newSubData.category as ProductivityCategory) || 'yield_defect',
      department: newSubData.department || '공정기술팀',
      authorName: newSubData.authorName || '제조혁신 엔지니어',
      employeeId: newSubData.employeeId || '2026' + Math.floor(1000 + Math.random() * 9000),
      team: newSubData.team || '1조',
      language: (newSubData.language as any) || 'javascript',
      code: newSubData.code || '',
      promptUsed: newSubData.promptUsed || '',
      productivityImpact: newSubData.productivityImpact || '수율 개선 및 분석 시간 단축',
      sampleInput: newSubData.sampleInput || '',
      submittedAt: Date.now(),
      votes: 0,
      reactions: { productivity: 0, prompt: 0, practical: 0, ui: 0, fast: 0, creative: 0, wellPrompted: 0 },
    };

    // Save to Firestore
    saveSubmissionToFirebase(sessionId, newSubmission).catch(() => {});

    setSubmissions((prev) => {
      const existingIdx = prev.findIndex((s) => s.team === newSubmission.team);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...newSubmission,
          id: updated[existingIdx].id,
          votes: updated[existingIdx].votes,
          reactions: updated[existingIdx].reactions,
        };
        return updated;
      }
      return [newSubmission, ...prev];
    });

    setTeams((prev) =>
      prev.map((t) => {
        if (`${t.teamNumber}조` === newSubmission.team || String(t.teamNumber) === newSubmission.team) {
          const updated: TeamActivity = {
            ...t,
            code: newSubmission.code,
            language: newSubmission.language,
            productivityImpact: newSubmission.productivityImpact,
            llmPromptStrategy: newSubmission.promptUsed,
            category: newSubmission.category || t.category,
            representativeSubmissionId: newSubmission.id,
            isRegistered: true,
            submittedAt: t.submittedAt || Date.now(),
          };
          updateTeamInFirebase(sessionId, updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );

    // Try API call if backend server exists
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubData),
      });
    } catch (e) {
      // GitHub Pages static mode: local state updated
    }
    return true;
  };

  // Update Team Planning Info (from Participant Team View Tab 1)
  const handleUpdateTeamInfo = (teamNum: number, updatedFields: Partial<TeamActivity>) => {
    setTeams((prev) => {
      const existingIdx = prev.findIndex((t) => t.teamNumber === teamNum);
      const isRegistered = true;
      const submittedAt = Date.now();
      if (existingIdx !== -1) {
        const copy = [...prev];
        const updated: TeamActivity = {
          ...copy[existingIdx],
          ...updatedFields,
          isRegistered,
          submittedAt: copy[existingIdx].submittedAt || submittedAt,
        };
        copy[existingIdx] = updated;
        updateTeamInFirebase(sessionId, updated).catch(() => {});
        return copy;
      } else {
        const newTeam: TeamActivity = {
          ...createDefaultTeam(teamNum),
          ...updatedFields,
          isRegistered,
          submittedAt,
        };
        updateTeamInFirebase(sessionId, newTeam).catch(() => {});
        return [...prev, newTeam];
      }
    });
  };

  // Admin: Toggle Voting Status
  const handleToggleVoting = async () => {
    const updated = !sessionConfig.isVotingOpen;
    setSessionConfig((prev) => ({ ...prev, isVotingOpen: updated }));
    updateSessionConfigInFirebase(sessionId, { ...sessionConfig, isVotingOpen: updated }).catch(() => {});
    try {
      await fetch('/api/admin/toggle-voting', { method: 'POST' });
    } catch (e) {}
  };

  // Admin: Reset Data to clean initial state
  const handleResetData = async () => {
    if (window.confirm('모든 제출물과 점수를 초기화하고 첫 화면 상태로 리셋하시겠습니까?')) {
      setSubmissions(INITIAL_SUBMISSIONS);
      setTeams(INITIAL_15_TEAMS);
      localStorage.removeItem('semiconductor_mfg_v1_submissions');
      localStorage.removeItem('semiconductor_mfg_v1_teams');
      localStorage.removeItem('llm_hackathon_v2_submissions');
      localStorage.removeItem('llm_hackathon_v2_teams');
      localStorage.removeItem('llm_hackathon_submissions_data');
      localStorage.removeItem('llm_hackathon_teams_data');
      localStorage.removeItem('llm_hackathon_voted_ids');
      setVotedIds(new Set());
      try {
        await fetch('/api/admin/reset', { method: 'POST' });
      } catch (e) {}
    }
  };

  // Instructor: Add new CSV Dataset
  const handleAddDataset = async (newDatasetData: Omit<SampleDataset, 'id' | 'uploadedAt'>) => {
    const localId = `dataset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const localItem: SampleDataset = {
      ...newDatasetData,
      id: localId,
      uploadedAt: Date.now(),
    };
    setDatasets((prev) => [localItem, ...prev]);
    saveDatasetToFirebase(sessionId, localItem).catch(() => {});

    try {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDatasetData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.dataset) {
          setDatasets((prev) => prev.map((d) => (d.id === localId ? data.dataset : d)));
        }
      }
    } catch (err) {
      console.warn('Dataset API sync fallback:', err);
    }
  };

  // Instructor: Delete Dataset
  const handleDeleteDataset = async (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Dataset delete API fallback:', err);
    }
  };

  // Instructor: Reset Datasets to initial semiconductor sample datasets
  const handleResetDatasets = async () => {
    const defaults = getInitialDatasets();
    setDatasets(defaults);
    try {
      await fetch('/api/datasets/reset', { method: 'POST' });
    } catch (err) {}
  };

  // Export JSON for GitHub Pages offline/static backup
  const handleExportJson = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      trainingTitle: sessionConfig.trainingTitle,
      teams,
      submissions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `llm_hackathon_32teams_data_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON to restore data
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.teams && Array.isArray(data.teams)) {
          setTeams(data.teams);
        }
        if (data.submissions && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
        alert('성공적으로 데이터를 복원했습니다!');
      } catch (err) {
        alert('유효하지 않은 JSON 파일 형식입니다.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Selected Submission Navigation for stage presentation
  const currentIdx = selectedSubmission
    ? submissions.findIndex((s) => s.id === selectedSubmission.id)
    : -1;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < submissions.length - 1;

  const handleNext = () => {
    if (hasNext) setSelectedSubmission(submissions[currentIdx + 1]);
  };
  const handlePrev = () => {
    if (hasPrev) setSelectedSubmission(submissions[currentIdx - 1]);
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Hidden File Input for Data Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* Main View based on URL Team Parameter (team0 for Presenter, team1..15 for Participants) */}
      {currentTeamNumber === 0 ? (
        <PresenterDashboard
          teams={teams}
          submissions={submissions}
          datasets={datasets}
          onAddDataset={handleAddDataset}
          onDeleteDataset={handleDeleteDataset}
          onResetDatasets={handleResetDatasets}
          onSelectSubmission={(sub) => setSelectedSubmission(sub)}
          onVote={handleVote}
          onVoteTeam={handleScoreTeam}
          votedIds={votedIds}
          isVotingOpen={sessionConfig.isVotingOpen}
          onToggleVoting={handleToggleVoting}
          onResetData={handleResetData}
          onStartTeamPresentation={handleStartTeamPresentation}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          firebaseConnected={isFirebaseConnected}
          sessionId={sessionId}
          onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        />
      ) : currentTeamNumber !== null && currentTeamNumber >= 1 ? (
        <ParticipantTeamView
          teamNumber={currentTeamNumber}
          team={
            teams.find((t) => t.teamNumber === currentTeamNumber) ||
            createDefaultTeam(currentTeamNumber)
          }
          submissions={submissions}
          datasets={datasets}
          onSubmit={handleSubmitSubmission}
          onVote={handleVote}
          votedIds={votedIds}
          isVotingOpen={sessionConfig.isVotingOpen}
          onSelectSubmission={(sub) => setSelectedSubmission(sub)}
          onUpdateTeamInfo={(fields) => handleUpdateTeamInfo(currentTeamNumber, fields)}
          firebaseConnected={isFirebaseConnected}
          sessionId={sessionId}
          onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        />
      ) : (
        /* Team Selection Gateway (when no team is specified in URL) */
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="max-w-6xl w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>팀별 전용 URL 분리 시스템 (총 32개 조)</span>
                </div>
                <button
                  onClick={() => setIsFirebaseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono">Firebase: {sessionId}</span>
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                반도체 제조 혁신 LLM 생산성 해커톤
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                접속하실 조(팀) 또는 강사용 종합 대시보드를 선택해주세요.
                선택 시 해당 전용 URL로 연결됩니다.
              </p>
            </div>

            {/* Instructor Entry Card */}
            <div
              onClick={() => navigateToTeam(0)}
              className="p-4 sm:p-5 rounded-2xl bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-700/60 hover:border-indigo-500 cursor-pointer transition-all shadow-xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      강사용 종합 대시보드
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      team0
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    전체 팀 실시간 현황, 랭킹, 발표 모드, 투표 제어
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>입장하기</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Teams Selection Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-300">
                    팀별 교육생 워크스페이스
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    취합 완료: {teams.filter((t) => isTeamSubmitted(t, submissions)).length} / 32팀
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  최대 32개 조 (제출 기준 실시간 취합)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {teams.map((t) => {
                  const hasSubmitted = isTeamSubmitted(t, submissions);
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigateToTeam(t.teamNumber)}
                      className={`p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between gap-1.5 group border ${
                        hasSubmitted
                          ? 'bg-slate-900 border-emerald-600/60 hover:border-emerald-400 ring-1 ring-emerald-500/20'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            hasSubmitted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.teamNumber}
                        </span>
                        {hasSubmitted ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/80">
                            제출완료
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-500">
                            미제출
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                          제 {t.teamNumber} 조
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {hasSubmitted ? t.teamName : '접속하여 등록'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 15 Teams Interactive Presentation Stage Modal */}
      {isTeamPresentationOpen && (
        <TeamPresentationStage
          teams={teams}
          submissions={submissions}
          currentTeamIndex={currentPresentationTeamIndex}
          onSelectTeamIndex={(idx) => {
            setCurrentPresentationTeamIndex(idx);
            const t = teams[idx];
            if (t) handleUpdateTeamStatus(t.id, 'presenting');
          }}
          onClose={() => setIsTeamPresentationOpen(false)}
          onUpdateTeamStatus={handleUpdateTeamStatus}
          onScoreTeam={handleScoreTeam}
          votedIds={votedIds}
        />
      )}

      {/* Detail & Live Runner Modal */}
      <SubmissionModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onVote={handleVote}
        hasVoted={selectedSubmission ? votedIds.has(selectedSubmission.id) : false}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={hasNext}
        hasPrev={hasPrev}
        isVotingOpen={sessionConfig.isVotingOpen}
      />

      {/* Firebase Realtime Connection & Session Management Modal */}
      <FirebaseStatusModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        sessionId={sessionId}
        onUpdateSessionId={(newId) => {
          setSessionId(newId);
          localStorage.setItem('semiconductor_active_session_id', newId);
          setIsFirebaseModalOpen(false);
        }}
        submissionsCount={submissions.length}
        teamsCount={teams.length}
        datasetsCount={datasets.length}
        isConnected={isFirebaseConnected}
        onForceSync={() => {
          testConnection().then((ok) => setIsFirebaseConnected(ok));
        }}
      />
    </div>
  );
}
