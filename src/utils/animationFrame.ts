export interface ScheduledAnimationFrame {
  kind: 'raf' | 'timeout';
  id: number;
}

export function scheduleAnimationFrame(callback: () => void): ScheduledAnimationFrame {
  if (typeof activeWindow.requestAnimationFrame === 'function') {
    return {
      kind: 'raf',
      id: activeWindow.requestAnimationFrame(() => callback()),
    };
  }

  return {
    kind: 'timeout',
    id: activeWindow.setTimeout(callback, 16),
  };
}

export function cancelScheduledAnimationFrame(frame: ScheduledAnimationFrame): void {
  if (frame.kind === 'raf' && typeof activeWindow.cancelAnimationFrame === 'function') {
    activeWindow.cancelAnimationFrame(frame.id);
    return;
  }

  activeWindow.clearTimeout(frame.id);
}
