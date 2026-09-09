/**
 * Utility functions for standardized team nomenclature
 * Format: "제 1 조", "제 2 조", etc. (Without using '분임조')
 * Supports dynamic team counts.
 */

export function getTeamNumber(team: string | number | undefined | null): number {
  if (team === undefined || team === null) return 1;
  if (typeof team === 'number') return team;
  const match = String(team).match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export function formatTeamName(team: string | number | undefined | null): string {
  if (!team || team === 'ALL') return '전체 팀';
  const num = getTeamNumber(team);
  if (num > 0) {
    return `제 ${num} 조`;
  }
  return String(team);
}

export function formatTeamHandle(team: string | number | undefined | null): string {
  const num = getTeamNumber(team);
  return `@team_${String(num).padStart(2, '0')}`;
}
