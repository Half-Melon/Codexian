export type DisplayMode = 'block' | 'flex' | 'contents' | 'inline' | 'inline-flex';

const DISPLAY_CLASSES: Record<DisplayMode, string> = {
  block: 'codexian-display-block',
  contents: 'codexian-display-contents',
  flex: 'codexian-display-flex',
  inline: 'codexian-display-inline',
  'inline-flex': 'codexian-display-inline-flex',
};

export function hideElement(el: HTMLElement | null | undefined): void {
  if (!el) return;
  for (const className of Object.values(DISPLAY_CLASSES)) {
    el.removeClass?.(className);
    el.classList?.remove(className);
  }
  el.addClass?.('codexian-hidden');
  el.classList?.add('codexian-hidden');
}

export function showElement(
  el: HTMLElement | null | undefined,
  mode?: DisplayMode,
): void {
  if (!el) return;
  el.removeClass?.('codexian-hidden');
  el.classList?.remove('codexian-hidden');
  for (const className of Object.values(DISPLAY_CLASSES)) {
    el.removeClass?.(className);
    el.classList?.remove(className);
  }
  if (mode) {
    el.addClass?.(DISPLAY_CLASSES[mode]);
    el.classList?.add(DISPLAY_CLASSES[mode]);
  }
}

export function setElementVisible(
  el: HTMLElement | null | undefined,
  visible: boolean,
  mode?: DisplayMode,
): void {
  if (visible) {
    showElement(el, mode);
  } else {
    hideElement(el);
  }
}

export function isElementVisible(el: Element | null | undefined): boolean {
  if (!el) return false;
  if (typeof el.hasClass === 'function') {
    return !el.hasClass('codexian-hidden');
  }
  if (el.classList) {
    return !el.classList.contains('codexian-hidden');
  }
  return (el as HTMLElement).style?.display !== 'none';
}

export function createActiveDocumentFragment(): DocumentFragment {
  return (activeDocument as Document & { createFragment: () => DocumentFragment }).createFragment();
}

export function runAsync(
  action: () => Promise<void>,
  onError?: (error: unknown) => void,
): void {
  void action().catch((error: unknown) => {
    onError?.(error);
  });
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function stringifySafe(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  try {
    return JSON.stringify(value) ?? fallback;
  } catch {
    return fallback;
  }
}
