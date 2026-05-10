import type { EventEmitter } from 'events';
import { createRequire } from 'module';

const nodeRequire = createRequire(__filename);
const eventsModule = nodeRequire('events') as EventsModule;

type SetMaxListeners = (n: number, ...eventTargets: EventTargetLike[]) => void;

type PatchableSetMaxListeners = SetMaxListeners & {
  __electronPatched?: boolean;
};

type EventTargetLike = EventTarget | EventEmitter;
type EventsModule = {
  setMaxListeners: PatchableSetMaxListeners;
};

function isAbortSignalLike(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  const t = target as Record<string, unknown>;

  return typeof t.aborted === 'boolean' &&
    typeof t.addEventListener === 'function' &&
    typeof t.removeEventListener === 'function';
}

/**
 * In Obsidian's Electron renderer, `new AbortController()` creates a browser-realm
 * AbortSignal that lacks Node.js's internal `kIsEventTarget` symbol. The SDK calls
 * `events.setMaxListeners(n, signal)` which throws because Node.js doesn't recognize
 * the browser AbortSignal as a valid EventTarget.
 *
 * Since setMaxListeners on AbortSignal only suppresses MaxListenersExceededWarning,
 * silently catching the error is safe.
 *
 * See: #143, #239, #284, #339, #342, #370, #374, #387
 */
export function patchSetMaxListenersForElectron(): void {
  const setMaxListeners = eventsModule.setMaxListeners;

  if (setMaxListeners.__electronPatched) return;

  const original = eventsModule.setMaxListeners;

  const patched = function patchedSetMaxListeners(this: unknown, ...args: unknown[]) {
    try {
      return original(args[0] as number, ...(args.slice(1) as EventTargetLike[]));
    } catch (error) {
      // Only swallow the Electron cross-realm AbortSignal error.
      // Duck-type check avoids depending on Node.js internal error message text.
      const eventTargets = args.slice(1);
      if (eventTargets.length > 0 && eventTargets.every(isAbortSignalLike)) {
        return;
      }
      throw error;
    }
  };
  (patched as PatchableSetMaxListeners).__electronPatched = true;

  eventsModule.setMaxListeners = patched as PatchableSetMaxListeners;
}
