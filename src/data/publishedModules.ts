import { CurriculumSession } from '../types';
import { DEFAULT_CURRICULUM_SESSIONS, OPTIONAL_CURRICULUM_SESSIONS } from './curriculumData';

export const courseModules = [...DEFAULT_CURRICULUM_SESSIONS, ...OPTIONAL_CURRICULUM_SESSIONS];
const modulesById = new Map(courseModules.map(module => [module.id, module]));

// Only identifiers and completion flags leave the static course bundle.
export function publicationState(sessions: CurriculumSession[]) {
  const seen = new Set<string>();
  return sessions.map(({ id, isCompleted }) => {
    if (!modulesById.has(id) || seen.has(id)) throw new Error(`정적 교안에 없는 모듈 또는 중복된 모듈: ${id}`);
    seen.add(id);
    return { id, isCompleted: Boolean(isCompleted) };
  });
}

export function visibleModules(value: unknown): CurriculumSession[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap(item => {
    const id = item && typeof item.id === 'string' ? item.id : '';
    const module = modulesById.get(id);
    if (!module || seen.has(id)) return [];
    seen.add(id);
    return [{ ...module, isCompleted: item.isCompleted === true }];
  });
}
