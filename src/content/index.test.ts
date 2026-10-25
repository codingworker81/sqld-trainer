import { describe, it, expect } from 'vitest';
import { getUnits, getSummary, getAllCards, getCardsByUnit } from './index';

describe('content loader', () => {
  it('loads all 19 units from units.json', () => {
    const units = getUnits();
    expect(units).toHaveLength(19);
    expect(units.map((u) => u.id)).toContain('u19');
  });

  it('loads each unit summary as non-empty markdown', () => {
    for (const unit of getUnits()) {
      const summary = getSummary(unit.id);
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain(unit.title);
    }
  });

  it('throws for an unknown unit id', () => {
    expect(() => getSummary('u99')).toThrow();
  });

  it('excludes _sample.json from shipped content', () => {
    // _sample.json is a validator fixture, not real card content, so the
    // loader (and the glob it relies on) must skip its ids even though
    // real uXX.json files (Stage 7) now ship alongside it.
    const ids = getAllCards().map((c) => c.id);
    expect(ids).not.toContain('u03-sample-001');
  });
});
