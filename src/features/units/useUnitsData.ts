import { useEffect, useState } from 'react';
import { getUnits, getAllCards } from '../../content';
import type { Unit } from '../../content/schema';
import { getAllStates } from '../../db';
import { unitMastery } from '../../engine/mastery';

export interface UnitRow {
  unit: Unit;
  masteryPercent: number;
  learnedCount: number;
  totalCount: number;
}

export function useUnitsData() {
  const [rows, setRows] = useState<UnitRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const units = getUnits();
      const cards = getAllCards();
      const states = await getAllStates();
      if (cancelled) return;

      setRows(
        units.map((unit) => {
          const unitCards = cards.filter((c) => c.unitId === unit.id);
          const learnedCount = unitCards.filter((c) => states[c.id] !== undefined).length;
          return {
            unit,
            masteryPercent: Math.round(unitMastery(cards, states, unit.id)),
            learnedCount,
            totalCount: unitCards.length,
          };
        }),
      );
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return rows;
}
