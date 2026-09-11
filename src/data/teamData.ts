import { TeamActivity, CodeSubmission, ProductivityCategory } from '../types';

export function createDefaultTeam(teamNumber: number): TeamActivity {
  return {
    id: `team-${teamNumber}`,
    teamNumber,
    teamName: '',
    slogan: '',
    category: undefined,
    isRegistered: false,
    presentationMinutes: 3,
    presentationStatus: 'waiting',
    totalTeamVotes: 0,
    peerScore: 0,
    members: [],
    feedbackTags: {
      innovation: 0,
      practicality: 0,
      presentation: 0,
      promptQuality: 0,
    },
  };
}

/**
 * 팀이 실제로 접속하여 팀 정보(기획안)를 등록했거나 코드를 제출했는지 엄격하게 판별
 */
export function isTeamSubmitted(team: TeamActivity, submissions?: CodeSubmission[]): boolean {
  if (!team) return false;

  // 1. 실제 코드 제출물이 존재하는 경우
  if (submissions && submissions.some((s) => {
    const match = String(s.team).match(/\d+/);
    return match ? parseInt(match[0], 10) === team.teamNumber : false;
  })) {
    return true;
  }

  // 2. 대표 제출물 ID가 연결된 경우
  if (team.representativeSubmissionId && team.representativeSubmissionId.trim().length > 0) {
    return true;
  }

  // 3. 사용자가 직접 접속하여 등록(isRegistered)을 완료하고 실질적인 팀 정보나 코드를 작성한 경우
  if (team.isRegistered) {
    if (team.teamName && team.teamName.trim().length > 0 && team.teamName !== `제 ${team.teamNumber} 조` && team.teamName !== `제 ${team.teamNumber}조`) {
      return true;
    }
    if (team.slogan && team.slogan.trim().length > 0) return true;
    if (team.problemStatement && team.problemStatement.trim().length > 0) return true;
    if (team.code && team.code.trim().length > 0) return true;
  }

  return false;
}

export function getInitialTeams(count: number = 32): TeamActivity[] {
  return Array.from({ length: count }, (_, i) => createDefaultTeam(i + 1));
}

export const INITIAL_32_TEAMS: TeamActivity[] = getInitialTeams(32);
export const INITIAL_15_TEAMS: TeamActivity[] = INITIAL_32_TEAMS;
export const INITIAL_SUBMISSIONS: CodeSubmission[] = [];
