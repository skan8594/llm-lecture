export type CodeLanguage = 'html' | 'javascript' | 'python' | 'sql' | 'json';

export type ProductivityCategory = 
  | 'excel_automation'     // 엑셀/데이터 자동화
  | 'email_document'       // 이메일/문서 요약 및 작성
  | 'data_analysis'        // 데이터 분석 및 시각화
  | 'cs_support'           // CS/고객 응대 자동화
  | 'internal_tools'       // 사내 업무 도구 및 유틸리티
  | 'workflow_macro';      // 반복 업무 매크로

export interface CodeSubmission {
  id: string;
  authorName?: string;     // 조 단위 식별 (예: 1조)
  employeeId?: string;
  team: string;            // 소속 조 (예: 3조)
  department?: string;
  title: string;           // 과제/자동화 제목
  category?: ProductivityCategory;
  promptUsed: string;      // LLM에 입력한 프롬프트
  language: CodeLanguage;
  code: string;            // 생성된 코드
  productivityImpact: string; // 기대 생산성 효과 (예: 주당 4시간 단축)
  description?: string;     // 동작 설명
  createdAt?: number;
  submittedAt?: number;
  votes: number;
  voterIds?: string[];      // 중복 투표 방지용
  sampleInput?: string;    // 실행용 샘플 입력값
  reactions?: {
    productivity?: number;  // ⚡ 압도적 생산성
    prompt?: number;        // 💡 기발한 프롬프트
    practical?: number;     // 🛠️ 실무 즉시 적용
    ui?: number;            // 🎨 직관적 인터페이스
    fast?: number;
    creative?: number;
    wellPrompted?: number;
  };
}

export interface TrainingSessionConfig {
  totalTargetTeams: number; // 15개 조
  trainingTitle: string;
  instructorName: string;
  isVotingOpen: boolean;
  submissionDeadlineMinutes: number;
  sessionStartTime: number;
}

export interface VotePayload {
  submissionId: string;
  voterToken: string;
  direction?: 'up' | 'down';
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
}

export interface TeamMember {
  name: string;
  employeeId: string;
  department: string;
  role?: '팀장' | '발표자' | '프롬프트 엔지니어' | '코드 검증' | '기획' | '팀원';
}

export interface TeamActivity {
  id: string;                      // e.g. "team-1"
  teamNumber: number;              // 1 ~ 15
  teamName: string;                // e.g. "1조 · 스마트 엑셀 자동화팀"
  slogan: string;                  // e.g. "수작업 0%, 신입사원 칼퇴 100%"
  category?: ProductivityCategory;
  members?: TeamMember[];
  problemStatement?: string;        // 해결한 업무 Pain Point (Before)
  llmPromptStrategy?: string;       // LLM 프롬프트 및 해결 전략
  code?: string;                    // 즉시 라이브 시연 가능한 코드
  language?: CodeLanguage;
  sampleInput?: string;            // 시연용 샘플 인풋
  productivityImpact?: string;      // 기대 생산성 효과 (After)
  representativeSubmissionId?: string; // 연결된 개별 제출물 ID
  presentationStatus: 'waiting' | 'presenting' | 'completed';
  presentationMinutes: number;     // 발표 배정 시간 (기본 3분 또는 5분)
  totalTeamVotes: number;
  peerScore: number;               // 평균 점수 (1~100)
  feedbackTags: {
    innovation: number;            // 🚀 혁신성
    practicality: number;          // 🛠️ 실무 적용성
    presentation: number;          // 🎤 발표력
    promptQuality: number;         // 💡 프롬프트 완성도
  };
}

export interface TeamAsset {
  id: string;
  teamNumber: number;          // 1 ~ 15
  title: string;               // 애셋/자료 제목
  fileName?: string;           // 파일명
  fileType: 'image' | 'code' | 'document' | 'data' | 'link' | 'note';
  fileSize?: string;           // 파일 크기 (예: "124 KB")
  dataUrl?: string;            // 파일/이미지 data URL (Base64)
  content?: string;            // 코드/프롬프트/텍스트 메모 내용
  uploadedBy?: string;         // 소속 조 (예: 1조)
  createdAt: number;           // 생성 시각
}
