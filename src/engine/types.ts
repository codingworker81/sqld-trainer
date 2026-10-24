export type ReviewResult = 'again' | 'hard' | 'good';
export type Box = 0 | 1 | 2 | 3 | 4 | 5;

/** The Leitner-relevant slice of a card's review state. Engine-pure: no
 * wrongNote/bookmark fields here — those live on src/db's ReviewState,
 * which extends this. */
export interface LeitnerState {
  cardId: string;
  box: Box;
  dueDate: string; // YYYY-MM-DD, Asia/Seoul
  lastReviewedAt: string; // YYYY-MM-DD, Asia/Seoul
  correctStreak: number;
  lapseCount: number;
}

export function createNewCardState(cardId: string, today: string): LeitnerState {
  return {
    cardId,
    box: 0,
    dueDate: today,
    lastReviewedAt: today,
    correctStreak: 0,
    lapseCount: 0,
  };
}

/** Subset of Settings the session engine needs. */
export interface SessionSettings {
  newCardLimit: number;
  sessionSize: number;
  examDate: string; // YYYY-MM-DD
}
