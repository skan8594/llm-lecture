import { CurriculumSession, LectureMaterial } from '../types';

export const DEFAULT_CURRICULUM_SESSIONS: CurriculumSession[] = [
  {
    id: 'session-orientation',
    durationMinutes: 20,
    title: '오리엔테이션 & 생성형 AI 기반 반도체 제조 혁신',
    category: 'orientation',
    summary: '반도체 8대 공정의 복잡도 증가와 엔지니어 업무 생산성 혁신을 위한 최신 LLM(Claude/GPT/Gemini) 활용 트렌드 및 워크숍 진행 룰 소개',
    objectives: [
      '반도체 제조(FAB) 분야에서 생성형 AI 도입의 실효성과 글로벌 선진사 적용 사례 이해',
      '수율 분석, 계측, FDC 센서 이상 감지 등 핵심 업무 병목(Pain Points) 파악',
      '팀별 워크스페이스 접속, 실습 플랫폼 인터페이스 및 평가 기준 숙지',
    ],
    handsOnTasks: [
      '각 조별 워크스페이스 입장 (URL: ?team=1 ~ 32)',
      '팀명 및 슬로건, 팀원 역할(발표/프롬프트/코드) 등록',
      '제공되는 8종 FAB 샘플 데이터셋 구조 확인',
    ],
    recommendedPrompts: [
      '당신은 반도체 수율 분석 15년 차 시니어 엔지니어입니다. 300mm 웨이퍼 전면 결함 맵 데이터에서 CMP 스크래치와 포토 공정 브릿지 결함을 분류하기 위한 핵심 데이터 피처 5가지를 도출하고 설명해주세요.',
    ],
    instructorNotes: '참가자 전원이 소속 조 워크스페이스에 접속했는지 현황판에서 확인하고, 접속 안내를 지원합니다.',
    isCompleted: false,
  },
  {
    id: 'session-prompting',
    durationMinutes: 30,
    title: '반도체 엔지니어를 위한 고급 프롬프트 엔지니어링',
    category: 'prompting',
    summary: '단순 질의응답을 넘어 엔지니어링 수준의 정밀한 결과물(파이썬 스크립트, SQL 쿼리, 웹 대시보드)을 뽑아내는 실전 프롬프트 패턴 실습',
    objectives: [
      'Role-Persona, Context, Task, Constraint, Output Schema 5단계 프롬프트 설계법 마스터',
      'Few-Shot 예시와 Chain-of-Thought(생각의 사슬)를 활용한 반도체 불량 원인 추론 정확도 향상',
      '정형 데이터(CSV/JSON) 자동 파싱 및 시각화 코드 직접 생성 기법 습득',
    ],
    handsOnTasks: [
      '반도체 결함 분류 및 FDC 센서 알람 필터링 프롬프트 작성',
      '프롬프트 실행 결과를 플랫폼 내 코드 샌드박스에서 즉시 디버깅 & 테스트',
      '1차 개별 코드 제출(Code Tweet) 피드에 등록해보기',
    ],
    recommendedPrompts: [
      '다음 입력 CSV 로그는 식각 챔버의 RF Source/Bias Power, Pressure(mTorr), ESC Temperature 센서 시계열입니다. 진공 압력이 15mTorr 이상으로 급증하고 Bias Power가 270W를 초과하는 이상 헌팅 구간을 탐지하여 타임스탬프와 알람 등급(WARNING/CRITICAL)을 JSON으로 반환하는 파이썬 코드를 작성하세요.',
    ],
    instructorNotes: '프롬프트에 제약조건(예: 외부 라이브러리 없이 실행 가능한 순수 HTML/JS or Python 표준 모듈)을 명시하는 법을 강조해주세요.',
    isCompleted: false,
  },
  {
    id: 'session-eda',
    durationMinutes: 35,
    title: 'FAB 공정/수율 데이터셋 EDA & 이상감지 자동화',
    category: 'eda',
    summary: '플랫폼에 탑재된 8대 반도체 실무 데이터셋(웨이퍼 결함맵, 노광 오버레이, 식각 FDC, EDS 빈맵 등)을 활용한 EDA 및 시각화 파이프라인 구축',
    objectives: [
      '공정 도메인별 6대 생산성 카테고리(수율, 공정최적화, 설비FDC, 계측QA, 물류Q-Time, 안전) 분석',
      'CSV 데이터를 기반으로 대화형 차트(웨이퍼 맵 히트맵, 산점도, 공정 트렌드 차트) 자동 생성',
      '기존 수작업 엑셀 분석 대비 80% 이상의 시간 단축 성과 지표 산출',
    ],
    handsOnTasks: [
      '제공된 샘플 데이터셋 중 1~2개 선택하여 데이터 전처리 프롬프트 작성',
      '웨이퍼 결함 분포 또는 오버레이 오차 벡터를 시각화하는 인터랙티브 대시보드 컴포넌트 구현',
      '데이터셋 매니저에서 추가 필요 컬럼이나 커스텀 CSV 데이터 업로드 실습',
    ],
    recommendedPrompts: [
      '첨부된 300mm 웨이퍼 결함 좌표(die_x, die_y, pos_x_mm, pos_y_mm, defect_class)를 활용해, HTML5 Canvas로 300mm 원형 웨이퍼 외곽선과 다이 그리드를 그리고 결함 클래스(Scratch=Red, Bridge=Orange, Particle=Cyan)별로 다른 색상 점을 찍어 마우스 호버 시 툴팁을 표시하는 단일 파일 HTML/JS 대시보드를 작성해줘.',
    ],
    instructorNotes: '참가자들이 데이터 시각화 결과물 예시 탭(결과물 대시보드 예시)을 참고하도록 유도하면 개발 속도가 크게 향상됩니다.',
    isCompleted: false,
  },
  {
    id: 'session-hackathon',
    durationMinutes: 45,
    title: '팀별 도메인 과제 기획 & 프롬프트 집중 개발',
    category: 'hackathon',
    summary: '조별로 현업의 실무 Pain Point를 1개 정의하고, LLM 프롬프팅을 통해 브라우저 샌드박스에서 즉시 동작하는 프로토타입 완성',
    objectives: [
      '조별 브레인스토밍을 통한 해결 문제(Problem Statement) 및 기대효과 수치화',
      '복합 프롬프트 체이닝을 통한 완성도 높은 웹 인터페이스 및 분석 알고리즘 구현',
      '플랫폼 코드 런너(Python, JS, HTML, SQL)를 통한 실시간 기능 동작 확인 및 최종 제출',
    ],
    handsOnTasks: [
      '팀 워크스페이스 [팀 정보 및 기획안] 탭에서 기획안 및 기대효과 작성',
      '팀 대표 코드 작성 및 워크스페이스 [코드 구현 & 실시간 런너]에서 테스트',
      '최종 제출 완료 버튼 클릭 및 Firestore 동기화 확인',
    ],
    recommendedPrompts: [
      '우리 팀은 "포토 공정 스캐너 오버레이 오차 자동 보정 및 샷별 잔여오차 트렌드 모니터링"을 주제로 선정했습니다. 기존 일일 2시간 소요되던 엑셀 분석을 5분으로 단축하는 기획안 요약문과 기대효과를 전문 반도체 엔지니어 용어로 3줄로 작성해주세요.',
    ],
    instructorNotes: '취합 현황을 모니터링하며 미제출 조를 호명하거나 찾아가 프롬프트 에러 디버깅을 적극 지원합니다.',
    isCompleted: false,
  },
  {
    id: 'session-pitching',
    durationMinutes: 35,
    title: '팀별 릴레이 라이브 피칭 & 실시간 상호 평가 (Peer Review)',
    category: 'pitching',
    summary: '강사용 발표 무대(Team Presentation Stage)를 대형 프로젝터에 띄우고, 각 조별 릴레이 발표 및 전원 실시간 투표 진행',
    objectives: [
      '참가 조의 반도체 생산성 혁신 아이디어 및 구현물 공유',
      '실시간 코드 런너를 통한 라이브 시연 및 질문 답변',
      '혁신성(Innovation), 실무적용성(Practicality), 완성도(Completeness) 다면 평가',
    ],
    handsOnTasks: [
      '강사의 호명에 따라 팀 발표 진행 (발표 타이머 가동)',
      '청중(참가자 전원)은 모바일 또는 PC에서 즉시 해당 팀에 투표 및 피드백 태그 전달',
      '투표 현황 실시간 집계 반영 확인',
    ],
    recommendedPrompts: [
      '3분 스피치용 발표 대본을 작성해주세요: 1) 배경 및 Pain Point (30초), 2) LLM 프롬프트 해결 전략 및 기술적 포인트 (1분), 3) 실시간 라이브 코드 시연 (1분), 4) 기대 생산성 및 사내 확산 효과 (30초).',
    ],
    instructorNotes: '강사용 상단의 [발표 무대] 버튼을 누르고 전체화면으로 띄워 진행합니다. 팀 전환 시 타이머가 자동 연동됩니다.',
    isCompleted: false,
  },
  {
    id: 'session-award',
    durationMinutes: 15,
    title: '결과 집계, 우수 혁신팀 시상식 & 총평',
    category: 'award',
    summary: '실시간 투표 및 동료 평가 점수를 기반으로 포디움 시상식 진행 및 반도체 현업 적용 확산을 위한 강사 총평',
    objectives: [
      '실시간 순위(Leaderboard Podium) 공개 및 우수작 축하',
      '수상팀들의 차별화된 프롬프트 기법 분석 및 시사점 도출',
      '사내 보안 가이드라인 준수 및 실제 FAB 현업 배치 전략 공유',
    ],
    handsOnTasks: [
      '실시간 순위 탭에서 1~3위 수상팀 발표 감상',
      '우수 코드 복사 및 향후 실무 활용을 위한 백업(JSON 내보내기)',
      '워크숍 설문 참여',
    ],
    recommendedPrompts: [
      '이번 반도체 생산성 해커톤에서 도출된 상위 우수 아이디어 3건을 우리 사업부 현업 보안 규정에 맞춰 프라이빗 LLM 서버에 배포하기 위한 4단계 실행 로드맵을 작성해주세요.',
    ],
    instructorNotes: '상단 [투표 마감] 버튼을 눌러 추가 투표를 마감한 후 [🏆 실시간 순위] 탭을 프로젝터에 띄워 드라마틱하게 공개합니다.',
    isCompleted: false,
  },
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
`,
  },
];
