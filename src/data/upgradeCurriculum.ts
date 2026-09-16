import { DEFAULT_CURRICULUM_SESSIONS, OPTIONAL_CURRICULUM_SESSIONS } from './curriculumData';
import { CurriculumSession } from '../types';

const legacyPrompts: Record<string, string[]> = {
  "mobile-1": [
    "샘플 메모: ETCH-A 14시 점검 예정, 담당자 확인 필요. 사실과 확인할 사항을 구분해줘."
  ],
  "mobile-2": [
    "기록: 09:10 압력 알람, 09:15 담당자 전달, 원인 미확인, 10:00 재확인 예정. 상태·조치·다음 확인으로 요약해줘. 없는 사실을 추가하지 마."
  ],
  "mobile-3": [
    "교육용 기준은 값 > 15. CSV:\nid,value\nA,14\nB,15\nC,16\nD,\nE,18\n초과와 결측치를 나눠줘. 검증 기준: 초과 C/E, 결측 D. 현업 기준으로 사용하지 마."
  ],
  "mobile-4": [
    "원문 A=14 B=15 C=16, 초과는 >15, 원인 미확인. 답변: B/C 초과, 센서 고장 원인, A 미측정. 오류 3개를 근거와 함께 수정해줘."
  ],
  "mobile-6": [
    "인수인계 요약 스킬을 목적·입력·절차·출력·검증으로 작성해줘. 추측 금지, 누락 질문 규칙을 포함해. 정상 메모와 빈 메모에 적용해줘. 이 명세를 새 AI 대화에 붙여넣어 재사용하겠다."
  ],
  "mobile-7": [
    "입력 A=14 B=17, 기준 >15. 분석→원본 검증→보고 순서로 한 단계씩 수행하고 매 단계 내 승인을 기다려줘. 외부 도구 연결 없는 대화형 에이전트 체험이다. 실제 자동화에는 별도 도구 연결이 필요하다."
  ],
  "mobile-8": [
    "우리 업무 [업무]의 입력·프롬프트·결과·검증·사람 확인 지점을 작성해줘. 시간 절감은 실측과 예상을 구분하고 측정하지 않은 값은 미측정으로 표시해."
  ],
  "mobile-9": [
    "내 업무에 적용할 과제 1개, 필요한 입력, 검증 방법, 다음 학습 내용을 정리하도록 질문해줘."
  ],
  "agent-1": [
    "인수인계 에이전트를 설계해줘. 교육용 데이터 A=14 B=15 C=16 D=결측, 초과 기준 >15. read_measurements, classify, draft_report 도구의 입력 JSON과 출력 JSON, 실패 조건을 정의해줘. 기대 결과는 C만 초과, D는 확인 필요다. 데이터 읽기는 읽기 전용, 최종 보고는 사람 승인 후 완료한다. 아직 코드를 만들지 말고 계약부터 확인받아."
  ],
  "agent-2": [
    "단일 HTML로 교육용 에이전트 프로토타입을 만들어줘. CSS/JS 포함, 외부 라이브러리·API 키·서버 없이 실행. A=14 B=15 C=16 D=빈값, 초과 >15를 기본 입력으로 제공. read_measurements→classify→draft_report를 실제 JS 함수로 구현해 각 단계 버튼, 상태, 입력/출력 로그, 재시작 버튼을 제공해줘. 최종 보고는 승인 버튼을 누른 뒤 표시해. D는 오류로 분리하고 C만 초과. 휴대폰 한 열 화면, 큰 버튼. LLM이 자동으로 도구를 선택하는 자율 에이전트가 아니라 고정 순서 도구 실행 프로토타입임을 표시해."
  ],
  "agent-3": [
    "앞서 만든 HTML을 점검하자. 테스트: 전체 빈 입력은 보고 금지, 값 15는 정상, 16은 초과, abc는 입력 오류, 승인 전 최종 보고 금지. 각 테스트의 실제 결과를 내가 제공할 때까지 기다려. 실패하면 원인과 최소 수정안을 설명하고 수정된 전체 HTML을 반환해. 같은 테스트를 다시 수행할 체크리스트도 제공해. 네가 실제 실행하지 않은 테스트를 통과했다고 주장하지 마."
  ],
  "extra-1": [
    "교육용 메모: 점검 전 담당자 확인, 측정값 기록, 기준 초과 시 담당자 보고, 원인 미확인 시 추가 확인. 이를 순서·확인 증거·담당 확인 항목으로 정리해줘. 원문에 없는 장비 조작 절차는 추가하지 마. 담당자가 없으면 미정으로 표시해."
  ],
  "extra-2": [
    "교육용 보고 v1: 알람 3건, 원인 미확인, 재점검 14시. v2: 알람 2건, 원인 미확인, 재점검 15시. 추가된 사실·변경된 사실·변경되지 않은 사실을 표로 작성해줘. 건수 감소 이유는 추측하지 말고 확인 질문으로 남겨줘."
  ],
  "extra-3": [
    "단일 HTML/CSS/JS로 교육용 계측 대시보드를 만들어줘. A=14 B=15 C=16 D=결측, 기준 >15. 전체/정상/초과/결측 필터, 건수 카드, 원본 표를 넣어줘. 초과 C 1건, 결측 D 1건을 확인할 수 있어야 해. 외부 CDN·React·서버 없이 실행하며 모바일 한 열과 44px 이상 버튼을 사용해."
  ]
};

// Upgrade only exact shipped defaults; retain instructor-authored content and selection.
export function upgradeCurriculum<T extends Pick<CurriculumSession, 'id' | 'recommendedPrompts'>>(sessions: T[]): T[] {
  const defaults = [...DEFAULT_CURRICULUM_SESSIONS, ...OPTIONAL_CURRICULUM_SESSIONS];
  return sessions.map(session => {
    const current = defaults.find(item => item.id === session.id);
    const knownPrompts = current && (
      JSON.stringify(session.recommendedPrompts) === JSON.stringify(legacyPrompts[session.id]) ||
      JSON.stringify(session.recommendedPrompts) === JSON.stringify(current.recommendedPrompts)
    );
    if (!current || !knownPrompts) return session;
    const legacyMinutes: Record<string, number> = {
      'mobile-1': 15, 'mobile-2': 25, 'mobile-3': 30, 'mobile-4': 20,
      'mobile-5': 10, 'mobile-6': 25, 'mobile-7': 25, 'mobile-8': 20,
      'mobile-9': 10, 'agent-1': 30, 'agent-2': 30, 'agent-3': 30,
      'extra-1': 30, 'extra-2': 30, 'extra-3': 30,
    };
    const minutes = (session as Partial<CurriculumSession>).durationMinutes;
    const useCurrentTime = minutes === legacyMinutes[session.id] || (session.id === 'mobile-8' && minutes === 30);
    return {
      ...session, recommendedPrompts: current.recommendedPrompts,
      ...(useCurrentTime ? { durationMinutes: current.durationMinutes, handsOnTasks: current.handsOnTasks, instructorNotes: current.instructorNotes } : {}),
    };
  });
}
