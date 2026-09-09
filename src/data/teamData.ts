import { TeamActivity, CodeSubmission, ProductivityCategory } from '../types';

const DEFAULT_CATEGORIES: ProductivityCategory[] = [
  'yield_defect',
  'process_optimization',
  'equipment_fdc',
  'metrology_qa',
  'lot_logistics',
  'utility_safety',
];

export function createDefaultTeam(teamNumber: number): TeamActivity {
  return {
    id: `team-${teamNumber}`,
    teamNumber,
    teamName: `제 ${teamNumber} 조`,
    slogan: '',
    category: DEFAULT_CATEGORIES[(teamNumber - 1) % DEFAULT_CATEGORIES.length],
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

export function getInitialTeams(count: number = 15): TeamActivity[] {
  return Array.from({ length: count }, (_, i) => createDefaultTeam(i + 1));
}

export const INITIAL_15_TEAMS: TeamActivity[] = getInitialTeams(15);
export const INITIAL_SUBMISSIONS: CodeSubmission[] = [];
