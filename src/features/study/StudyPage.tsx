import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllCards, getCardsByUnit, getUnits } from '../../content';
import type { Card, Unit } from '../../content/schema';
import { getAllStates, getSettings, saveReview, type ReviewState } from '../../db';
import { buildDailySession, buildUnitSession, chunkBySessionSize, requeueAgain } from '../../engine/session';
import { todayInSeoul } from '../../engine/date';
import type { ReviewResult } from '../../engine/types';
import { FLIP_CARD_TYPES } from './cardTypeMeta';
import { CardFrame } from './components/CardFrame';
import { CardRenderer } from './components/CardRenderer';
import { SessionResult } from './components/SessionResult';
import { ExitConfirmDialog } from './components/ExitConfirmDialog';
import { useExitGuard } from './hooks/useExitGuard';

type Phase = 'loading' | 'studying' | 'result' | 'empty';

export default function StudyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'unit' ? 'unit' : 'daily';
  const unitIdParam = searchParams.get('unitId') ?? undefined;

  const [phase, setPhase] = useState<Phase>('loading');
  const [units, setUnits] = useState<Unit[]>([]);
  const [chunks, setChunks] = useState<Card[][]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [queue, setQueue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(false);

  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [boxUpCount, setBoxUpCount] = useState(0);

  const todayRef = useRef(todayInSeoul());
  const initialStatesRef = useRef<Record<string, ReviewState>>({});
  const firstAttemptIdsRef = useRef<Set<string>>(new Set());
  const cardStartRef = useRef<number>(Date.now());

  const exitGuard = useExitGuard(phase === 'studying');

  const startChunk = useCallback((chunk: Card[]) => {
    setQueue(chunk);
    setIndex(0);
    setFlipped(false);
    setGraded(false);
    setSessionTotal(0);
    setSessionCorrect(0);
    setBoxUpCount(0);
    firstAttemptIdsRef.current = new Set();
    cardStartRef.current = Date.now();
    setPhase('studying');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = todayRef.current;
      const allUnits = getUnits();
      const [states, settings] = await Promise.all([getAllStates(), getSettings()]);
      if (cancelled) return;

      initialStatesRef.current = states;
      setUnits(allUnits);

      const fullQueue =
        mode === 'unit' && unitIdParam
          ? buildUnitSession(getCardsByUnit(unitIdParam), states, unitIdParam, today)
          : buildDailySession(getAllCards(), states, allUnits, settings, today);

      if (fullQueue.length === 0) {
        setPhase('empty');
        return;
      }

      const builtChunks = chunkBySessionSize(fullQueue, settings.sessionSize);
      setChunks(builtChunks);
      setChunkIndex(0);
      startChunk(builtChunks[0]);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, unitIdParam, startChunk]);

  // 평가 1건 기록: 이 세션에서 그 카드를 처음 보는 경우에만 DB에 반영한다.
  // requeue돼 같은 세션에서 두 번째로 보는 경우는 연습일 뿐 Box를 바꾸지
  // 않는다(PRD 6절 "세션 안에서 맞혀도 Box가 올라가지 않는다").
  const recordEvaluation = useCallback(async (card: Card, result: ReviewResult) => {
    setSessionTotal((n) => n + 1);
    if (result === 'good') setSessionCorrect((n) => n + 1);

    if (firstAttemptIdsRef.current.has(card.id)) return;
    firstAttemptIdsRef.current.add(card.id);

    const elapsedMs = Date.now() - cardStartRef.current;
    const prevBox = initialStatesRef.current[card.id]?.box ?? 0;
    const newState = await saveReview({
      cardId: card.id,
      result,
      today: todayRef.current,
      mode: 'daily',
      elapsedMs,
    });
    if (newState.box > prevBox) setBoxUpCount((n) => n + 1);
  }, []);

  function goNext(updatedQueue: Card[]) {
    const nextIndex = index + 1;
    if (nextIndex >= updatedQueue.length) {
      setPhase('result');
      return;
    }
    setIndex(nextIndex);
    setFlipped(false);
    setGraded(false);
    cardStartRef.current = Date.now();
  }

  async function handleManualEvaluate(result: ReviewResult) {
    const card = queue[index];
    if (!card) return;
    await recordEvaluation(card, result);
    const updatedQueue = result === 'again' ? requeueAgain(queue, index, card) : queue;
    if (result === 'again') setQueue(updatedQueue);
    goNext(updatedQueue);
  }

  async function handleAutoGrade(result: ReviewResult) {
    const card = queue[index];
    if (!card) return;
    await recordEvaluation(card, result);
    if (result === 'again') setQueue(requeueAgain(queue, index, card));
    setGraded(true);
  }

  function handleNext() {
    goNext(queue);
  }

  function handleFlip() {
    setFlipped(true);
  }

  function handleContinueChunk() {
    const nextChunkIndex = chunkIndex + 1;
    setChunkIndex(nextChunkIndex);
    startChunk(chunks[nextChunkIndex]);
  }

  function handleGoHome() {
    exitGuard.disarm();
    navigate('/');
  }

  useEffect(() => {
    if (phase !== 'studying' || exitGuard.confirmOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      const card = queue[index];
      if (!card) return;
      const isFlip = FLIP_CARD_TYPES.has(card.type);

      if (isFlip && !flipped && e.key === ' ') {
        e.preventDefault();
        handleFlip();
        return;
      }
      if (isFlip && flipped && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault();
        const result: ReviewResult = e.key === '1' ? 'again' : e.key === '2' ? 'hard' : 'good';
        void handleManualEvaluate(result);
        return;
      }
      if (!isFlip && graded && e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, flipped, graded, index, queue, exitGuard.confirmOpen]);

  if (phase === 'loading') {
    return <div className="flex h-dvh items-center justify-center text-slate-500">불러오는 중…</div>;
  }

  if (phase === 'empty') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-slate-600 dark:text-slate-300">오늘 학습할 카드가 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          홈으로
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="h-dvh safe-bottom">
        <SessionResult
          total={sessionTotal}
          correctCount={sessionCorrect}
          boxUpCount={boxUpCount}
          hasMore={chunkIndex + 1 < chunks.length}
          onContinue={handleContinueChunk}
          onGoHome={handleGoHome}
        />
      </div>
    );
  }

  const card = queue[index];
  if (!card) return null;
  const unit = units.find((u) => u.id === card.unitId);

  return (
    <div className="h-dvh safe-bottom">
      <CardFrame card={card} unit={unit} position={index + 1} total={queue.length}>
        <CardRenderer
          card={card}
          flipped={flipped}
          graded={graded}
          onFlip={handleFlip}
          onManualEvaluate={(r) => void handleManualEvaluate(r)}
          onAutoGrade={(r) => void handleAutoGrade(r)}
          onNext={handleNext}
        />
      </CardFrame>
      {exitGuard.confirmOpen && (
        <ExitConfirmDialog onContinue={exitGuard.closeConfirm} onStop={handleGoHome} />
      )}
    </div>
  );
}
