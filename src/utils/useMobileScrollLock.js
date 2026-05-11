import { useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 639px)';

export function useMobileScrollLock(active = true, { lockTouch = false } = {}) {
  useEffect(() => {
    if (!active || typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const body = document.body;
    const root = document.documentElement;
    let restore = null;

    const lock = () => {
      if (restore) return;

      const prevBodyOverflow = body.style.overflow;
      const prevRootOverflow = root.style.overflow;
      const prevBodyOverscroll = body.style.overscrollBehaviorY;
      const prevRootOverscroll = root.style.overscrollBehaviorY;
      const prevBodyTouchAction = body.style.touchAction;

      body.style.overflow = 'hidden';
      root.style.overflow = 'hidden';
      body.style.overscrollBehaviorY = 'none';
      root.style.overscrollBehaviorY = 'none';
      if (lockTouch) body.style.touchAction = 'none';

      restore = () => {
        body.style.overflow = prevBodyOverflow;
        root.style.overflow = prevRootOverflow;
        body.style.overscrollBehaviorY = prevBodyOverscroll;
        root.style.overscrollBehaviorY = prevRootOverscroll;
        body.style.touchAction = prevBodyTouchAction;
        restore = null;
      };
    };

    const unlock = () => {
      if (restore) restore();
    };

    const sync = () => {
      if (mediaQuery.matches) lock();
      else unlock();
    };

    sync();
    mediaQuery.addEventListener('change', sync);

    return () => {
      mediaQuery.removeEventListener('change', sync);
      unlock();
    };
  }, [active, lockTouch]);
}
