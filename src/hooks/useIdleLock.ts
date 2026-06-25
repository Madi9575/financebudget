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
  const lastActivityRef = useRef(Date.now());
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }

    const reset = () => {
      lastActivityRef.current = Date.now();
      setRemaining(timeoutMs);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const sinceLast = Date.now() - lastActivityRef.current;
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
      const sinceLast = Date.now() - lastActivityRef.current;
      const left = Math.max(0, timeoutMs - sinceLast);
      setRemaining(left);
      if (sinceLast >= timeoutMs) {
        onTimeoutRef.current();
      }
    }, 1000);

    timerRef.current = window.setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, reset));
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [enabled, timeoutMs, events]);

  return { remaining };
}
