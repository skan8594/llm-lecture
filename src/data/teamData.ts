import { TeamActivity, CodeSubmission, ProductivityCategory } from '../types';

const DEFAULT_CATEGORIES: ProductivityCategory[] = [
  'excel_automation',
  'email_document',
  'data_analysis',
  'cs_support',
  'internal_tools',
  'workflow_macro',
  'excel_automation',
  'email_document',
  'data_analysis',
  'cs_support',
  'internal_tools',
  'workflow_macro',
  'excel_automation',
  'email_document',
  'data_analysis',
];

export const INITIAL_15_TEAMS: TeamActivity[] = Array.from({ length: 15 }, (_, i) => {
  const teamNumber = i + 1;
  return {
    id: `team-${teamNumber}`,
    teamNumber,
    teamName: `${teamNumber}조`,
    slogan: '',
    category: DEFAULT_CATEGORIES[i] || 'workflow_macro',
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
});

export const INITIAL_SUBMISSIONS: CodeSubmission[] = [];
