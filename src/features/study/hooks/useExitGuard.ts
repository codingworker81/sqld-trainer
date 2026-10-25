import { useEffect, useRef, useState } from 'react';

/**
 * 학습 세션 중 뒤로 가기(또는 탭 닫기)를 가로채 확인 모달을 띄운다.
 * 이 앱은 HashRouter의 선언형 Routes API를 쓰기 때문에 데이터 라우터 전용
 * useBlocker를 쓸 수 없어, history 트랩(더미 엔트리 push + popstate 감지)
 * 으로 구현한다.
 */
export function useExitGuard(active: boolean) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const armed = useRef(false);

  useEffect(() => {
    if (!active) return;

    window.history.pushState(null, '', window.location.href);
    armed.current = true;

    function onPopState() {
      if (!armed.current) return;
      window.history.pushState(null, '', window.location.href);
      setConfirmOpen(true);
    }

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!armed.current) return;
      e.preventDefault();
      e.returnValue = '';
    }

    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [active]);

  function disarm() {
    armed.current = false;
    setConfirmOpen(false);
  }

  return {
    confirmOpen,
    closeConfirm: () => setConfirmOpen(false),
    // 화면에 보이는 "나가기" 버튼 등, 뒤로 가기가 아닌 경로로도 같은
    // 확인창을 띄우고 싶을 때 쓴다.
    openConfirm: () => setConfirmOpen(true),
    disarm,
  };
}
