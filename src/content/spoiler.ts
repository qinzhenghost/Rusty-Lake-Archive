import type { SpoilerRule, UserProgress } from './schema';

export function canView(rule: SpoilerRule, progress: UserProgress, contentId?: string): boolean {
  if (contentId && progress.manualRevealIds?.includes(contentId)) return true;
  const completed = new Set(progress.completedGameIds);
  return rule.requiredCompletedGameIds.every((id) => completed.has(id));
}

export function visibility(rule: SpoilerRule, progress: UserProgress, contentId?: string): 'visible' | 'redacted' {
  return canView(rule, progress, contentId) ? 'visible' : 'redacted';
}
