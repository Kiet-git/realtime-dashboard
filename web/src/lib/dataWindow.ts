import { ChartPoint } from "@/types";

/**
 * Appends a point to a fixed-size sliding window and returns a NEW array.
 * Keeping the window capped (instead of letting arrays grow unbounded) is
 * what keeps a real-time chart from degrading after the tab has been open
 * for hours - this is the core "big data" concern for streaming UIs: you
 * never render more points than the chart can usefully show.
 */
export function pushToWindow(
  window: ChartPoint[],
  point: ChartPoint,
  maxSize: number
): ChartPoint[] {
  const next = window.length >= maxSize ? window.slice(window.length - maxSize + 1) : window.slice();
  next.push(point);
  return next;
}

/**
 * Leading+trailing throttle: guarantees the callback fires at most once per
 * `wait` ms, but still fires on the *last* call in a burst so the UI never
 * shows visibly stale data. Used to decouple socket message frequency
 * (which can be very high) from React re-render frequency.
 */
export function throttle<T extends (...args: never[]) => void>(fn: T, wait: number): T {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const invoke = () => {
    last = Date.now();
    timeout = null;
    if (pendingArgs) {
      fn(...pendingArgs);
      pendingArgs = null;
    }
  };

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    pendingArgs = args;
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      invoke();
    } else if (!timeout) {
      timeout = setTimeout(invoke, remaining);
    }
  }) as T;
}

/** Downsamples a series for sparkline-scale rendering (e.g. small gauge trend lines). */
export function downsample(points: ChartPoint[], targetSize: number): ChartPoint[] {
  if (points.length <= targetSize) return points;
  const step = points.length / targetSize;
  const result: ChartPoint[] = [];
  for (let i = 0; i < targetSize; i++) {
    result.push(points[Math.floor(i * step)]);
  }
  return result;
}
