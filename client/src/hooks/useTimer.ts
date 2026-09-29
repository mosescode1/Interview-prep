"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(initialSeconds: number = 0, countDown: boolean = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        const next = countDown ? s - 1 : s + 1;
        if (countDown && next <= 0) {
          setRunning(false);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, countDown]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((s?: number) => {
    setSeconds(s ?? initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  const formatted = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return { seconds, formatted, running, start, pause, reset };
}
