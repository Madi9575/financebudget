import { useEffect, useRef, useState } from 'react';

interface UseIdleLockOptions {
  enabled: boolean;
  timeoutMs: number;
  onTimeout: () => void;
  events?: string[];
}

const DEFAULT_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

export function useIdleLock({ enabled, timeoutMs, onTimeout, events = DEFAULT_EVENTS }: UseIdleLockOptions) {
  const [remaining, setRemaining] = useState(timeoutMs);
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    };

    if (!enabled) {
      clear();
      lastActivityRef.current = null;
      return;
    }

    lastActivityRef.current = Date.now();
    setRemaining(timeoutMs);

    const fireTimeout = () => {
      onTimeoutRef.current();
    };

    const reset = () => {
      lastActivityRef.current = Date.now();
      setRemaining(timeoutMs);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(fireTimeout, timeoutMs);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const last = lastActivityRef.current ?? Date.now();
        const sinceLast = Date.now() - last;
        if (sinceLast >= timeoutMs) {
          onTimeoutRef.current();
        }
      } else {
        reset();
      }
    };

    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);

    tickRef.current = window.setInterval(() => {
      const last = lastActivityRef.current;
      if (last === null) return;
      const sinceLast = Date.now() - last;
      const left = Math.max(0, timeoutMs - sinceLast);
      setRemaining(left);
      if (sinceLast >= timeoutMs) {
        onTimeoutRef.current();
      }
    }, 1000);

    timerRef.current = window.setTimeout(fireTimeout, timeoutMs);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, reset));
      document.removeEventListener('visibilitychange', handleVisibility);
      clear();
    };
  }, [enabled, timeoutMs, events]);

  return { remaining };
}
