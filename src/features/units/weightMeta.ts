import type { Unit } from '../../content/schema';

export const WEIGHT_LABEL: Record<Unit['weight'], string> = {
  high: '높음',
  mid: '중간',
  low: '낮음',
};

export const WEIGHT_BADGE_CLASS: Record<Unit['weight'], string> = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  mid: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};
