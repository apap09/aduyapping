import { useEffect, useState } from 'react';

// Performance Mode: nyala = gameplay full 2D (ringan). Default mati = tampilan 2.5D.
const KEY = 'yr_perf';
const listeners = new Set();
let enabled = readPref();

function readPref() {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function setPerfMode(on) {
  enabled = !!on;
  try {
    localStorage.setItem(KEY, enabled ? 'on' : 'off');
  } catch {
    /* penyimpanan diblokir */
  }
  listeners.forEach((fn) => fn(enabled));
}

/** Hook: [performanceModeNyala, setPerformanceMode] */
export function usePerfMode() {
  const [on, setOn] = useState(enabled);
  useEffect(() => {
    listeners.add(setOn);
    return () => listeners.delete(setOn);
  }, []);
  return [on, setPerfMode];
}
