/**
 * Utility functions for standardized, formal team nomenclature
 * Format: "제 1 분임조", "제 2 분임조", ..., "제 15 분임조"
 */

export function getTeamNumber(team: string | number | undefined | null): number {
  if (team === undefined || team === null) return 1;
  if (typeof team === 'number') return team;
  const match = String(team).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export function formatTeamName(team: string | number | undefined | null): string {
  if (!team || team === 'ALL') return '전체 분임조';
  const num = getTeamNumber(team);
  if (num >= 1 && num <= 15) {
    return `제 ${num} 분임조`;
  }
  return String(team);
}

export function formatTeamHandle(team: string | number | undefined | null): string {
  const num = getTeamNumber(team);
  return `@team_${String(num).padStart(2, '0')}`;
}

export const ALL_15_TEAM_NAMES = Array.from({ length: 15 }, (_, i) => `제 ${i + 1} 분임조`);
