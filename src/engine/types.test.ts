import { describe, it, expect } from 'vitest';
import { createNewCardState } from './types';

describe('createNewCardState', () => {
  it('creates a Box 0 state due today', () => {
    const state = createNewCardState('u01-a-001', '2026-10-24');
    expect(state).toEqual({
      cardId: 'u01-a-001',
      box: 0,
      dueDate: '2026-10-24',
      lastReviewedAt: '2026-10-24',
      correctStreak: 0,
      lapseCount: 0,
    });
  });
});
