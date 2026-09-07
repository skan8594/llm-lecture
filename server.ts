import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_SUBMISSIONS } from './src/data/seedSubmissions.ts';
import { CodeSubmission, TrainingSessionConfig, TeamAsset } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// In-memory state for training session
let sessionConfig: TrainingSessionConfig = {
  totalTargetTeams: 15,
  trainingTitle: '2026 신입사원 LLM 업무 생산성 극대화 해커톤 & 코드 쇼케이스',
  instructorName: 'AI 교육 디렉터',
  isVotingOpen: true,
  submissionDeadlineMinutes: 30,
  sessionStartTime: Date.now(),
};

let submissions: CodeSubmission[] = [...INITIAL_SUBMISSIONS];
let teamAssets: Record<number, TeamAsset[]> = {};

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// ==================== API ROUTES ====================

// 1. Session status & metrics
app.get('/api/session', (req, res) => {
  const totalSubmissions = submissions.length;
  const totalVotes = submissions.reduce((acc, cur) => acc + cur.votes, 0);
  
  // Calculate team submission breakdown
  const teamStats: Record<string, number> = {};
  for (let i = 1; i <= 15; i++) {
    teamStats[`${i}조`] = 0;
  }
  submissions.forEach(sub => {
    if (sub.team) {
      teamStats[sub.team] = (teamStats[sub.team] || 0) + 1;
    }
  });

  const submittedTeams = Object.values(teamStats).filter(c => c > 0).length;

  res.json({
    config: sessionConfig,
    stats: {
      totalSubmissions,
      totalTarget: sessionConfig.totalTargetTeams,
      submittedTeams,
      submissionRate: Math.min(100, Math.round((submittedTeams / sessionConfig.totalTargetTeams) * 100)),
      totalVotes,
      teamStats,
    },
  });
});

// 2. Submissions list
app.get('/api/submissions', (req, res) => {
  res.json({ submissions });
});

// 3. New submission from mobile/web
app.post('/api/submissions', (req, res) => {
  const {
    authorName,
    employeeId,
    team,
    department,
    title,
    category,
    promptUsed,
    language,
    code,
    productivityImpact,
    description,
    sampleInput,
  } = req.body;

  if (!authorName || !title || !code) {
    return res.status(400).json({ error: '필수 항목(이름, 제목, 코드)을 모두 입력해주세요.' });
  }

  const newSub: CodeSubmission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    authorName: String(authorName).trim(),
    employeeId: employeeId ? String(employeeId).trim() : `2026-${Math.floor(1000 + Math.random() * 9000)}`,
    team: team || '자율조',
    department: department || '신입사원',
    title: String(title).trim(),
    category: category || 'internal_tools',
    promptUsed: promptUsed ? String(promptUsed).trim() : 'LLM을 활용한 업무 생산성 자동화 코드 생성',
    language: language || 'javascript',
    code: String(code).trim(),
    productivityImpact: productivityImpact || '주당 약 2~4시간 업무 절감 기대',
    description: description || 'LLM으로 개발한 업무 생산성 향상 코드입니다.',
    createdAt: Date.now(),
    votes: 0,
    voterIds: [],
    sampleInput: sampleInput || '',
  };

  submissions.unshift(newSub);

  res.status(201).json({ success: true, submission: newSub });
});

// 4. Vote on a submission
app.post('/api/submissions/:id/vote', (req, res) => {
  if (!sessionConfig.isVotingOpen) {
    return res.status(403).json({ error: '현재 투표가 종료되었거나 일시 중지 상태입니다.' });
  }

  const { id } = req.params;
  const { voterToken, reactionType } = req.body;
  const token = voterToken || 'anonymous-voter';

  const sub = submissions.find(s => s.id === id);
  if (!sub) {
    return res.status(404).json({ error: '해당 제출 코드를 찾을 수 없습니다.' });
  }

  if (!sub.reactions) {
    sub.reactions = { productivity: 0, prompt: 0, practical: 0, ui: 0 };
  }

  const hasVoted = sub.voterIds.includes(token);
  if (hasVoted) {
    // Toggle off vote
    sub.voterIds = sub.voterIds.filter(v => v !== token);
    sub.votes = Math.max(0, sub.votes - 1);
  } else {
    // Vote up
    sub.voterIds.push(token);
    sub.votes += 1;
    if (reactionType && sub.reactions[reactionType as keyof typeof sub.reactions] !== undefined) {
      sub.reactions[reactionType as keyof typeof sub.reactions] += 1;
    } else {
      sub.reactions.productivity += 1;
    }
  }

  res.json({
    success: true,
    id: sub.id,
    votes: sub.votes,
    hasVoted: !hasVoted,
    reactions: sub.reactions,
  });
});

// 5. Admin: toggle voting status
app.post('/api/admin/toggle-voting', (req, res) => {
  const { open } = req.body;
  sessionConfig.isVotingOpen = typeof open === 'boolean' ? open : !sessionConfig.isVotingOpen;
  res.json({ success: true, isVotingOpen: sessionConfig.isVotingOpen });
});

// 6. Admin: reset to clean state
app.post('/api/admin/reset', (req, res) => {
  submissions = [...INITIAL_SUBMISSIONS];
  teamAssets = {};
  sessionConfig.isVotingOpen = true;
  res.json({ success: true, count: submissions.length });
});

// 7. Team Assets: Get assets for a specific team
app.get('/api/teams/:teamNumber/assets', (req, res) => {
  const teamNum = parseInt(req.params.teamNumber, 10);
  if (isNaN(teamNum) || teamNum < 1 || teamNum > 15) {
    return res.status(400).json({ error: '유효하지 않은 조 번호입니다.' });
  }
  res.json({ assets: teamAssets[teamNum] || [] });
});

// 8. Team Assets: Upload/Share an asset within a specific team
app.post('/api/teams/:teamNumber/assets', (req, res) => {
  const teamNum = parseInt(req.params.teamNumber, 10);
  if (isNaN(teamNum) || teamNum < 1 || teamNum > 15) {
    return res.status(400).json({ error: '유효하지 않은 조 번호입니다.' });
  }

  const { title, fileName, fileType = 'document', fileSize, dataUrl, content, uploadedBy } = req.body;
  if (!title && !fileName) {
    return res.status(400).json({ error: '애셋 제목 또는 파일명을 입력해주세요.' });
  }

  const newAsset: TeamAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    teamNumber: teamNum,
    title: (title || fileName || '자료').trim(),
    fileName,
    fileType,
    fileSize,
    dataUrl,
    content,
    uploadedBy: (uploadedBy || '팀원').trim(),
    createdAt: Date.now(),
  };

  if (!teamAssets[teamNum]) {
    teamAssets[teamNum] = [];
  }
  teamAssets[teamNum].unshift(newAsset);

  res.status(201).json({ success: true, asset: newAsset });
});

// 9. Team Assets: Delete an asset
app.delete('/api/teams/:teamNumber/assets/:assetId', (req, res) => {
  const teamNum = parseInt(req.params.teamNumber, 10);
  const { assetId } = req.params;

  if (teamAssets[teamNum]) {
    teamAssets[teamNum] = teamAssets[teamNum].filter((a) => a.id !== assetId);
  }

  res.json({ success: true });
});

// 7. Gemini API: Generate productivity code helper for participants
app.post('/api/gemini/generate-code', async (req, res) => {
  try {
    const { userPrompt, language = 'javascript', category = 'excel_automation' } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: '프롬프트를 입력해주세요.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY가 설정되지 않았습니다. Settings > Secrets에서 키를 등록해주세요.',
      });
    }

    const systemInstruction = `당신은 90명 신입사원 대상 LLM 업무 생산성 교육의 AI 코딩 멘토입니다.
신입사원이 입력한 업무 요구사항을 바탕으로, 즉시 구동 가능한 고품질의 실무 자동화 코드를 작성해야 합니다.
지원 언어/타입:
- 'html': 브라우저에서 바로 렌더링되고 작동하는 단일 파일 HTML/CSS/JavaScript 미니 웹 위젯 (인라인 스타일, 모던 다크 UI, 폼 입력과 실시간 계산/출력).
- 'javascript': console.log()로 풍부한 실행 결과와 표(console.table)를 보여주는 Node/브라우저 스크립트.
- 'python': 데이터 전처리, 통계, 업무 루틴 계산 등을 수행하고 터미널 표준출력(print)으로 깔끔하게 포맷팅하는 스크립트.

JSON 형식으로 응답하세요:
{
  "title": "자동화 도구 제목 (간결한 한국어)",
  "language": "${language}",
  "code": "실제 구동 가능한 순수 코드 문자열 (마크다운 백틱 제외)",
  "productivityImpact": "구체적인 생산성 절감 수치 (예: 주당 5시간 단축, 수작업 90% 자동화)",
  "description": "2~3문장의 핵심 동작 원리 및 비즈니스 효과 설명"
}`;

    const promptText = `요청 업무: ${userPrompt}\n선호 언어: ${language}\n업무 분야: ${category}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Gemini generate code error:', error);
    res.status(500).json({ error: error.message || 'AI 코드 생성 중 오류가 발생했습니다.' });
  }
});

// 8. Gemini API: AI Code Review & Feedback for instructor / trainees
app.post('/api/gemini/review-code', async (req, res) => {
  try {
    const { title, promptUsed, code, language } = req.body;
    if (!code) {
      return res.status(400).json({ error: '분석할 코드가 없습니다.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY가 설정되지 않았습니다.',
      });
    }

    const systemInstruction = `당신은 대기업 신입사원 LLM 해커톤의 수석 심사위원입니다.
제출된 프롬프트와 생성 코드를 평가하여 JSON으로 반환하세요.
{
  "score": 92, // 100점 만점
  "productivityScore": 95, // 실무 생산성 점수
  "promptEngineeringScore": 90, // LLM 프롬프트 작성 역량 점수
  "codeQualityScore": 91, // 코드 완성도 점수
  "summary": "1~2문장의 핵심 총평",
  "strengths": ["강점1", "강점2"],
  "improvements": ["개선 팁1", "개선 팁2"],
  "expectedTimeSaved": "월간 예상 절감 시간 (예: 약 20시간/월)"
}`;

    const promptText = `제목: ${title}\n사용 프롬프트: ${promptUsed}\n언어: ${language}\n코드:\n${code.slice(0, 3000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    res.json({ success: true, review: parsed });
  } catch (error: any) {
    console.error('Gemini review code error:', error);
    res.status(500).json({ error: error.message || '코드 리뷰 생성 중 오류가 발생했습니다.' });
  }
});

// ==================== VITE & PRODUCTION SETUP ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
