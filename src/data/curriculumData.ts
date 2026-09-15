import { CurriculumSession, LectureMaterial } from '../types';

export const DEFAULT_CURRICULUM_SESSIONS: CurriculumSession[] = [
  {
    "id": "mobile-1",
    "durationMinutes": 15,
    "title": "접속·첫 프롬프트",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "접속·첫 프롬프트"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "샘플 메모: ETCH-A 14시 점검 예정, 담당자 확인 필요. 사실과 확인할 사항을 구분해줘."
    ],
    "instructorNotes": "15분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-2",
    "durationMinutes": 25,
    "title": "인수인계 요약",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "인수인계 요약"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "기록: 09:10 압력 알람, 09:15 담당자 전달, 원인 미확인, 10:00 재확인 예정. 상태·조치·다음 확인으로 요약해줘. 없는 사실을 추가하지 마."
    ],
    "instructorNotes": "25분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-3",
    "durationMinutes": 30,
    "title": "계측 표의 이상 항목 찾기",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "계측 표의 이상 항목 찾기"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "교육용 기준은 값 > 15. CSV:\nid,value\nA,14\nB,15\nC,16\nD,\nE,18\n초과와 결측치를 나눠줘. 검증 기준: 초과 C/E, 결측 D. 현업 기준으로 사용하지 마."
    ],
    "instructorNotes": "30분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-4",
    "durationMinutes": 20,
    "title": "AI 답변 오류 검증",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "AI 답변 오류 검증"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "원문 A=14 B=15 C=16, 초과는 >15, 원인 미확인. 답변: B/C 초과, 센서 고장 원인, A 미측정. 오류 3개를 근거와 함께 수정해줘."
    ],
    "instructorNotes": "20분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-5",
    "durationMinutes": 10,
    "title": "휴식",
    "category": "orientation",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "휴식"
    ],
    "handsOnTasks": [
      "10분 휴식"
    ],
    "recommendedPrompts": [],
    "instructorNotes": "10분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-6",
    "durationMinutes": 25,
    "title": "재사용 스킬 만들기",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "재사용 스킬 만들기"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "인수인계 요약 스킬을 목적·입력·절차·출력·검증으로 작성해줘. 추측 금지, 누락 질문 규칙을 포함해. 정상 메모와 빈 메모에 적용해줘. 이 명세를 새 AI 대화에 붙여넣어 재사용하겠다."
    ],
    "instructorNotes": "25분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-7",
    "durationMinutes": 25,
    "title": "에이전트 흐름 체험",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "에이전트 흐름 체험"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "입력 A=14 B=17, 기준 >15. 분석→원본 검증→보고 순서로 한 단계씩 수행하고 매 단계 내 승인을 기다려줘. 외부 도구 연결 없는 대화형 에이전트 체험이다. 실제 자동화에는 별도 도구 연결이 필요하다."
    ],
    "instructorNotes": "25분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-8",
    "durationMinutes": 20,
    "title": "팀 업무 적용안 제출",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "팀 업무 적용안 제출"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "우리 업무 [업무]의 입력·프롬프트·결과·검증·사람 확인 지점을 작성해줘. 시간 절감은 실측과 예상을 구분하고 측정하지 않은 값은 미측정으로 표시해."
    ],
    "instructorNotes": "20분 진행. 샘플 데이터만 사용하며 결과를 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "mobile-9",
    "durationMinutes": 10,
    "title": "대표 사례와 마무리",
    "category": "prompting",
    "summary": "휴대폰으로 예시를 복사하고 AI 답변을 원문과 대조합니다.",
    "objectives": [
      "대표 사례와 마무리"
    ],
    "handsOnTasks": [
      "예시를 AI 앱에 붙여넣기",
      "원문과 비교하여 누락·추측·계산 오류 수정",
      "검증된 결과와 사용한 프롬프트 제출"
    ],
    "recommendedPrompts": [
      "내 업무에 적용할 과제 1개, 필요한 입력, 검증 방법, 다음 학습 내용을 정리하도록 질문해줘."
    ],
    "instructorNotes": "대표 2~3팀만 공유합니다.",
    "isCompleted": false
  }
];

export const OPTIONAL_CURRICULUM_SESSIONS: CurriculumSession[] = [
  {
    "id": "agent-1",
    "title": "에이전트 ① 요구사항·도구 계약",
    "summary": "입력과 완료 조건을 정하고 도구 호출 규격을 만듭니다.",
    "handsOnTasks": [
      "5분: 인수인계 에이전트 목표 정의",
      "10분: read_measurements / classify / draft_report 입출력 작성",
      "10분: 정상·결측·경계값 테스트 정의",
      "5분: 계약 검토"
    ],
    "durationMinutes": 30,
    "category": "hackathon",
    "objectives": [
      "도구별 입력·출력 표와 테스트 3건"
    ],
    "recommendedPrompts": [
      "인수인계 에이전트를 설계해줘. 교육용 데이터 A=14 B=15 C=16 D=결측, 초과 기준 >15. read_measurements, classify, draft_report 도구의 입력 JSON과 출력 JSON, 실패 조건을 정의해줘. 기대 결과는 C만 초과, D는 확인 필요다. 데이터 읽기는 읽기 전용, 최종 보고는 사람 승인 후 완료한다. 아직 코드를 만들지 말고 계약부터 확인받아."
    ],
    "instructorNotes": "에이전트 ①→②→③ 순서로 선택합니다. 생성 HTML은 학생이 실행하며 실제 실행 결과와 설명을 구분합니다.",
    "isCompleted": false
  },
  {
    "id": "agent-2",
    "title": "에이전트 ② 실행 가능한 HTML 프로토타입",
    "summary": "설계한 도구를 JavaScript 함수로 구현하고 호출 기록을 확인합니다.",
    "handsOnTasks": [
      "5분: 앞 모듈 계약 붙여넣기",
      "10분: 단일 HTML 생성",
      "10분: 실행·단계 버튼 조작",
      "5분: 결과와 도구 기록 비교"
    ],
    "durationMinutes": 30,
    "category": "hackathon",
    "objectives": [
      "동작하는 HTML과 단계별 호출 기록"
    ],
    "recommendedPrompts": [
      "단일 HTML로 교육용 에이전트 프로토타입을 만들어줘. CSS/JS 포함, 외부 라이브러리·API 키·서버 없이 실행. A=14 B=15 C=16 D=빈값, 초과 >15를 기본 입력으로 제공. read_measurements→classify→draft_report를 실제 JS 함수로 구현해 각 단계 버튼, 상태, 입력/출력 로그, 재시작 버튼을 제공해줘. 최종 보고는 승인 버튼을 누른 뒤 표시해. D는 오류로 분리하고 C만 초과. 휴대폰 한 열 화면, 큰 버튼. LLM이 자동으로 도구를 선택하는 자율 에이전트가 아니라 고정 순서 도구 실행 프로토타입임을 표시해."
    ],
    "instructorNotes": "에이전트 ①→②→③ 순서로 선택합니다. 생성 HTML은 학생이 실행하며 실제 실행 결과와 설명을 구분합니다.",
    "isCompleted": false
  },
  {
    "id": "agent-3",
    "title": "에이전트 ③ 실패·수정·재검증",
    "summary": "오류를 의도적으로 넣고 원인을 찾아 재실행합니다.",
    "handsOnTasks": [
      "5분: 빈 입력·문자·경계값 넣기",
      "10분: 로그와 기대값 비교",
      "10분: 수정 프롬프트로 HTML 갱신",
      "5분: 동일 테스트 재실행"
    ],
    "durationMinutes": 30,
    "category": "hackathon",
    "objectives": [
      "실패 기록·수정 HTML·재시험 결과"
    ],
    "recommendedPrompts": [
      "앞서 만든 HTML을 점검하자. 테스트: 전체 빈 입력은 보고 금지, 값 15는 정상, 16은 초과, abc는 입력 오류, 승인 전 최종 보고 금지. 각 테스트의 실제 결과를 내가 제공할 때까지 기다려. 실패하면 원인과 최소 수정안을 설명하고 수정된 전체 HTML을 반환해. 같은 테스트를 다시 수행할 체크리스트도 제공해. 네가 실제 실행하지 않은 테스트를 통과했다고 주장하지 마."
    ],
    "instructorNotes": "에이전트 ①→②→③ 순서로 선택합니다. 생성 HTML은 학생이 실행하며 실제 실행 결과와 설명을 구분합니다.",
    "isCompleted": false
  },
  {
    "id": "extra-1",
    "title": "업무 문서에서 체크리스트 만들기",
    "summary": "짧은 작업 메모를 실행 가능한 확인 항목으로 바꿉니다.",
    "handsOnTasks": [
      "5분: 샘플 읽기",
      "10분: 체크리스트 생성",
      "10분: 누락과 추측 검증",
      "5분: 결과 제출"
    ],
    "durationMinutes": 30,
    "category": "hackathon",
    "objectives": [
      "근거가 연결된 체크리스트"
    ],
    "recommendedPrompts": [
      "교육용 메모: 점검 전 담당자 확인, 측정값 기록, 기준 초과 시 담당자 보고, 원인 미확인 시 추가 확인. 이를 순서·확인 증거·담당 확인 항목으로 정리해줘. 원문에 없는 장비 조작 절차는 추가하지 마. 담당자가 없으면 미정으로 표시해."
    ],
    "instructorNotes": "완료 결과물을 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "extra-2",
    "title": "두 버전 보고서 비교",
    "summary": "수정 내역과 확인할 질문을 분리합니다.",
    "handsOnTasks": [
      "5분: 두 문서 읽기",
      "10분: 차이 추출",
      "10분: 근거 검증",
      "5분: 질문 작성"
    ],
    "durationMinutes": 30,
    "category": "hackathon",
    "objectives": [
      "변경 비교표·확인 질문"
    ],
    "recommendedPrompts": [
      "교육용 보고 v1: 알람 3건, 원인 미확인, 재점검 14시. v2: 알람 2건, 원인 미확인, 재점검 15시. 추가된 사실·변경된 사실·변경되지 않은 사실을 표로 작성해줘. 건수 감소 이유는 추측하지 말고 확인 질문으로 남겨줘."
    ],
    "instructorNotes": "완료 결과물을 원문과 대조합니다.",
    "isCompleted": false
  },
  {
    "id": "extra-3",
    "title": "HTML 업무 대시보드 만들기",
    "summary": "검증 가능한 작은 표와 필터를 직접 조작합니다.",
    "handsOnTasks": [
      "5분: KPI와 기준 정의",
      "10분: HTML 생성",
      "10분: 필터·경계값 검증",
      "5분: 결과 제출"
    ],
    "durationMinutes": 30,
    "category": "hackathon",
    "objectives": [
      "단일 HTML과 기대값 대조 결과"
    ],
    "recommendedPrompts": [
      "단일 HTML/CSS/JS로 교육용 계측 대시보드를 만들어줘. A=14 B=15 C=16 D=결측, 기준 >15. 전체/정상/초과/결측 필터, 건수 카드, 원본 표를 넣어줘. 초과 C 1건, 결측 D 1건을 확인할 수 있어야 해. 외부 CDN·React·서버 없이 실행하며 모바일 한 열과 44px 이상 버튼을 사용해."
    ],
    "instructorNotes": "완료 결과물을 원문과 대조합니다.",
    "isCompleted": false
  }
];

export const DEFAULT_LECTURE_MATERIALS: LectureMaterial[] = [
  {
    id: 'mat-main-lecture-guide',
    title: '2026 반도체 제조혁신 LLM 해커톤 전체 강의교안 및 운영가이드',
    fileName: '2026_반도체_생성형AI_제조혁신_강의교안.md',
    fileType: 'markdown',
    fileSize: '48.2 KB',
    uploadedAt: Date.now() - 3600000 * 4,
    uploadedBy: '강사 (수석 AI 엔지니어링 코치)',
    isSharedWithStudents: true,
    slideCount: 42,
    description: '반도체 제조 도메인 프롬프트 엔지니어링 원리, 6대 생산성 혁신 카테고리별 아키텍처 및 평가 루브릭이 포함된 핵심 교안입니다.',
    textContent: `# 2026 반도체 제조혁신 LLM 생산성 해커톤 강의교안

## 1. 교육 개요 및 배경
- **목적**: 반도체 FAB 엔지니어의 반복적 데이터 가공 및 일상 병목 업무를 최신 생성형 AI(LLM)와 프롬프트 엔지니어링으로 자동화
- **핵심 철학**: "코딩을 배우는 해커톤이 아니라, LLM을 지휘하여 실무 생산성을 10배 끌어올리는 혁신 워크숍"
- **대상**: 반도체 공정, 설비, 수율, 계측, 물류, 품질 신입/경력 엔지니어 (32개 조)

---

## 2. 6대 반도체 생산성 혁신 카테고리
1. **수율 분석 & 결함 개선 (Yield & Defect)**: 웨이퍼 결함 맵 spatial 패턴(Ring, Scratch, Bridge) 자동 클러스터링 및 D0 수율 상관분석
2. **공정 파라미터 최적화 (Process Optimization)**: Photo/Etch/Thin-Film/CMP 공정 인자 간의 Trade-off 분석 및 최적 레시피 역설계
3. **설비 예지보전 & FDC (Equipment & FDC)**: 진공 압력, RF 전력, ESC 온도 센서 시계열의 이상 징후(Hunting, Drift) 조기 탐지
4. **계측 & 품질 검사 자동화 (Metrology & QA)**: 포토 오버레이 오차 벡터, CD 임계선폭, 박막 두께 균일도(WIWNU) 자동 판정
5. **웨이퍼 물류 & 큐타임 (Lot Logistics & Q-Time)**: 공정 간 Q-Time 인터락 위험도 예측 및 FOUP 디스패칭 우선순위 최적화
6. **FAB 유틸리티 & 환경안전 (Utility & Safety)**: 특수가스(CF4, O2, Cl2) 누출 감지, 초순수(UPW) 저항률 모니터링

---

## 3. 엔지니어 필수 프롬프트 5단계 공식 (R-C-T-C-S)
1. **Role (역할 정의)**: "당신은 반도체 수율 분석 15년 차 시니어 엔지니어입니다."
2. **Context (맥락 및 도메인 지식)**: "우리는 300mm DRAM 제조 라인의 금속 배선 공정에서 CMP 슬러리 잔여물로 인한 스크래치 이슈를 추적 중입니다."
3. **Task (구체적 업무)**: "제공된 CSV 데이터를 읽고, 반경 110mm 이상 에지 영역의 결함 밀도(D0)를 계산한 뒤 HTML Canvas 차트로 그려주세요."
4. **Constraint (제약조건)**: "외부 CDN 라이브러리 설치 없이 단일 HTML 파일로 실행 가능해야 하며, 호버 시 결함 ID 툴팁이 표시되어야 합니다."
5. **Schema (출력 포맷)**: "결과는 마크다운 코드블록 내의 완전한 독립형 코드로만 반환하세요."

---

## 4. 라이브 시연 및 평가 루브릭
- **혁신성 (30%)**: 기존 방식의 한계를 LLM의 창의적 프롬프트로 뛰어넘었는가?
- **실무 적용성 (30%)**: 내일 당장 FAB 현업 라인에 가져가서 쓸 수 있는가?
- **발표력 & 시연 완성도 (20%)**: 3분 동안 명확한 핵심 전달 및 코드 라이브 시연 성공 여부
- **프롬프트 품질 (20%)**: 재현 가능하고 모듈화된 고수준의 엔지니어링 프롬프트를 구성했는가?

## 5. 스킬과 에이전트 만들기
- **스킬**: 특정 업무를 반복 실행할 수 있도록 목적, 입력, 절차, 출력 형식, 검증 규칙을 정리한 재사용 지침입니다.
- **에이전트**: 스킬과 도구를 순서대로 호출해 업무를 수행하는 실행 흐름입니다. 데이터 읽기, 분석, 결과 검증, 보고서 작성처럼 단계를 나눕니다.
- **실습 순서**: ① 반복 업무 선택 ② 입력·완료 조건 정의 ③ 스킬 명세 작성 ④ 에이전트 단계 설계 ⑤ 정상·오류 입력 테스트 ⑥ 사람 승인 지점 확인
- 운영 적용 전에는 외부 전송, 데이터 변경, 설비 제어 단계에 사람 승인 절차를 둡니다.
`,
  },
  {
    id: 'mat-dataset-handbook',
    title: 'FAB 실습 데이터셋 8종 활용 & 차트 시각화 코드 가이드북',
    fileName: 'FAB_데이터셋_기반_LLM_자동화_코드생성_가이드북.md',
    fileType: 'markdown',
    fileSize: '32.8 KB',
    uploadedAt: Date.now() - 3600000 * 3,
    uploadedBy: '강사 (수석 AI 엔지니어링 코치)',
    isSharedWithStudents: true,
    slideCount: 28,
    description: '웨이퍼 결함맵, 노광 오버레이, 이온주입 면저항 등 8종 CSV 컬럼 명세 및 LLM 입력용 샘플 템플릿입니다.',
    textContent: `# FAB 실습 데이터셋 8종 활용 & 차트 시각화 코드 가이드북

## 1. 8대 실습 데이터셋 개요
1. **wafer_300mm_defect_map_clusters.csv**: 165행 결함 좌표(Die X/Y, 물리 mm 좌표, Defect Class, Cluster Type)
2. **photo_scanner_overlay_metrology.csv**: 125행 노광 스캐너 X/Y 정합 오차(dx, dy, total vector nm)
3. **litho_fem_cd_metrology.csv**: 125행 노광 초점-도즈(FEM) 매트릭스 및 임계선폭(CD nm)
4. **eds_wafer_probe_bin_map.csv**: 150행 웨이퍼 다이별 EDS 프로브 테스트 Binning(Prime Pass, Leakage, Speed)
5. **ion_implant_sheet_resistance_map.csv**: 147행 49포인트 반경별 면저항(Rs ohm/sq) 및 편차율(%)
6. **etch_chamber_fdc_sensors.csv**: 140행 식각 챔버 4대 RF 파워, 압력, ESC 온도 센서 시계열
7. **cmp_thickness_metrology.csv**: 125행 CMP 박막 잔류 두께 및 면내 균일도(WIWNU %)
8. **fab_lot_qtime_tracking.csv**: 120행 공정 간 경과 시간 및 큐타임 상한 초과 인터락 로그

---

## 2. LLM에게 데이터 시각화 코드를 요청할 때 유용한 프롬프트
\`\`\`text
아래는 내가 가진 반도체 CSV 데이터의 헤더와 3개 행 샘플입니다:
[CSV 헤더 및 샘플 3줄 붙여넣기]

이 데이터를 파싱하여 다음 기능을 갖춘 인터랙티브 웹 애플리케이션(HTML/CSS/JS 단일 파일)을 작성해주세요:
1. X축을 다이 X좌표, Y축을 다이 Y좌표로 하는 결함 분포 산점도(Scatter Plot)
2. 결함 유형(Scratch, Particle, Ring)별 색상 구분 범례
3. 상단에 총 결함 수, 결함 밀도(D0), 수율(Pass %) 핵심 요약 카드
4. 특정 결함 유형만 토글하여 볼 수 있는 필터 버튼
\`\`\`

## 3. 실습 전 데이터 품질 체크리스트
1. CSV 헤더를 실제 파일과 대조하고, 컬럼명 대소문자와 구분자를 확인합니다.
2. 좌표 단위(mm), 계측 단위(nm/ohm/sq), 비율(%)을 프롬프트에 명시합니다.
3. 결측치·중복 행·이상치 처리 규칙을 코드 생성 전에 결정합니다.
4. 분석 결과의 표본 수, 필터 조건, 계산식을 원본 데이터와 대조합니다.
5. 실제 생산 데이터·개인정보·장비 식별자는 입력하지 않고 샘플 데이터로 검증합니다.
`,
  },
];
