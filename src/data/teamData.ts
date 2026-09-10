import { TeamActivity, CodeSubmission, ProductivityCategory } from '../types';

export function createDefaultTeam(teamNumber: number): TeamActivity {
  return {
    id: `team-${teamNumber}`,
    teamNumber,
    teamName: `제 ${teamNumber} 조`,
    slogan: '',
    // 카테고리는 임의로 분배하지 않음: 접속하여 팀 정보를 직접 입력한 경우에만 설정됨
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
 * 팀이 실제로 접속하여 팀 정보(기획안)나 코드를 제출했는지 판별
 */
export function isTeamSubmitted(team: TeamActivity, submissions?: CodeSubmission[]): boolean {
  if (team.isRegistered) return true;
  if (team.slogan && team.slogan.trim().length > 0) return true;
  if (team.problemStatement && team.problemStatement.trim().length > 0) return true;
  if (team.code && team.code.trim().length > 0) return true;
  if (team.category) return true;
  if (team.representativeSubmissionId) return true;
  if (submissions && submissions.some((s) => {
    const match = String(s.team).match(/\d+/);
    return match ? parseInt(match[0], 10) === team.teamNumber : false;
  })) {
    return true;
  }
  return false;
}

export function getInitialTeams(count: number = 32): TeamActivity[] {
  return Array.from({ length: count }, (_, i) => createDefaultTeam(i + 1));
}

export const INITIAL_32_TEAMS: TeamActivity[] = getInitialTeams(32);
export const INITIAL_15_TEAMS: TeamActivity[] = INITIAL_32_TEAMS;
export const INITIAL_SUBMISSIONS: CodeSubmission[] = [];
