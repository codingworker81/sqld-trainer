import { useRef } from 'react';
import type { TouchEventHandler } from 'react';

const SWIPE_THRESHOLD_PX = 80;

interface UseSwipeOptions {
  enabled: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

interface SwipeHandlers {
  onTouchStart: TouchEventHandler;
  onTouchMove: TouchEventHandler;
  onTouchEnd: TouchEventHandler;
}

/** 뒷면에서 좌/우 스와이프로 틀림/맞힘을 평가한다(80px 이상 이동 시).
 * 세로 스크롤과 충돌하지 않도록, 가로 이동이 세로 이동보다 뚜렷할 때만
 * preventDefault로 스크롤을 막는다. */
export function useSwipe({ enabled, onSwipeLeft, onSwipeRight }: UseSwipeOptions): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);
  const isHorizontal = useRef(false);

  const onTouchStart: TouchEventHandler = (e) => {
    if (!enabled) return;
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    isHorizontal.current = false;
  };

  const onTouchMove: TouchEventHandler = (e) => {
    if (!enabled || !start.current) return;
    const t = e.touches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      isHorizontal.current = true;
      e.preventDefault();
    }
  };

  const onTouchEnd: TouchEventHandler = (e) => {
    if (!enabled || !start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    start.current = null;
    if (!isHorizontal.current || Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }
    if (dx < 0) onSwipeLeft();
    else onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
