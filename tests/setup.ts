import { createMockEl } from '@test/helpers/mockElement';

function ensureCreateHelpers(target: any): any {
  if (!target) return target;

  target.createEl ??= function createEl(tag: string, options?: { cls?: string; text?: string; attr?: Record<string, string> }) {
    const el = this.createElement ? this.createElement(tag) : document.createElement(tag);
    if (options?.cls) el.className = options.cls;
    if (options?.text) el.textContent = options.text;
    if (options?.attr) {
      for (const [key, value] of Object.entries(options.attr)) {
        el.setAttribute(key, value);
      }
    }
    return el;
  };

  target.createDiv ??= function createDiv(options?: { cls?: string; text?: string; attr?: Record<string, string> }) {
    return this.createEl('div', options);
  };

  target.createSpan ??= function createSpan(options?: { cls?: string; text?: string; attr?: Record<string, string> }) {
    return this.createEl('span', options);
  };

  target.createSvg ??= function createSvg(tag: string) {
    const el = typeof this.createElementNS === 'function'
      ? this.createElementNS('http://www.w3.org/2000/svg', tag)
      : typeof this.createElement === 'function'
        ? this.createElement(tag)
        : createMockEl(tag);
    return ensureCreateHelpers(el);
  };

  target.createFragment ??= function createFragment(callback?: (el: DocumentFragment) => void) {
    const fragment = this.createDocumentFragment
      ? this.createDocumentFragment()
      : document.createDocumentFragment();
    callback?.(fragment);
    return fragment;
  };

  return target;
}

function installElementHelpers(): void {
  const proto = (globalThis as any).Element?.prototype;
  if (!proto) return;

  const syncDisplayClass = (el: HTMLElement, cls: string, visible: boolean) => {
    if (cls === 'codexian-hidden' && visible) {
      el.style.display = 'none';
    } else if (cls === 'codexian-hidden') {
      el.style.display = '';
    } else if (visible && cls.startsWith('codexian-display-')) {
      el.style.display = cls.slice('codexian-display-'.length);
    } else if (!visible && cls.startsWith('codexian-display-') && el.style.display === cls.slice('codexian-display-'.length)) {
      el.style.display = '';
    }
  };

  proto.addClass ??= function addClass(cls: string) {
    for (const className of cls.split(/\s+/).filter(Boolean)) {
      this.classList.add(className);
      syncDisplayClass(this, className, true);
    }
    return this;
  };
  proto.removeClass ??= function removeClass(cls: string) {
    for (const className of cls.split(/\s+/).filter(Boolean)) {
      this.classList.remove(className);
      syncDisplayClass(this, className, false);
    }
    return this;
  };
  proto.hasClass ??= function hasClass(cls: string) {
    return this.classList.contains(cls);
  };
  proto.toggleClass ??= function toggleClass(cls: string, force?: boolean) {
    this.classList.toggle(cls, force);
  };
  proto.empty ??= function empty() {
    this.replaceChildren();
  };
  proto.createEl ??= function createEl(tag: string, options?: { cls?: string; text?: string; attr?: Record<string, string> }) {
    const el = this.ownerDocument.createElement(tag);
    if (options?.cls) el.className = options.cls;
    if (options?.text) el.textContent = options.text;
    if (options?.attr) {
      for (const [key, value] of Object.entries(options.attr)) {
        el.setAttribute(key, value);
      }
    }
    this.appendChild(el);
    return el;
  };
  proto.createDiv ??= function createDiv(options?: { cls?: string; text?: string; attr?: Record<string, string> }) {
    return this.createEl('div', options);
  };
  proto.createSpan ??= function createSpan(options?: { cls?: string; text?: string; attr?: Record<string, string> }) {
    return this.createEl('span', options);
  };
  proto.setText ??= function setText(text: string) {
    this.textContent = text;
  };
  proto.setAttr ??= function setAttr(name: string, value: string) {
    this.setAttribute(name, value);
  };
}

const activeWindowMock = {
  setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
  clearTimeout: (...args: Parameters<typeof clearTimeout>) => clearTimeout(...args),
  setInterval: (...args: Parameters<typeof setInterval>) => setInterval(...args),
  clearInterval: (...args: Parameters<typeof clearInterval>) => clearInterval(...args),
  requestAnimationFrame: (cb: FrameRequestCallback) => {
    const raf = (globalThis as any).requestAnimationFrame;
    return typeof raf === 'function'
      ? raf(cb)
      : (setTimeout(() => cb(0), 0) as unknown as number);
  },
  cancelAnimationFrame: (id: number) => {
    const caf = (globalThis as any).cancelAnimationFrame;
    return typeof caf === 'function' ? caf(id) : clearTimeout(id);
  },
  get innerHeight() {
    return (globalThis as any).window?.innerHeight ?? 800;
  },
  get DOMParser() {
    return (globalThis as any).DOMParser;
  },
  get structuredClone() {
    return (globalThis as any).structuredClone;
  },
};

function installActiveGlobals(): void {
  const createFallbackDocument = () => ensureCreateHelpers((globalThis as any).document ?? {
    body: ensureCreateHelpers(createMockEl('body')),
    createElement: (tag: string) => createMockEl(tag),
    createElementNS: (_ns: string, tag: string) => createMockEl(tag),
    importNode: (node: Node) => node,
    createDocumentFragment: () => ({
      childNodes: [],
      appendChild: jest.fn(),
      insertBefore: jest.fn(),
    }),
  });

  Object.defineProperty(globalThis, 'activeDocument', {
    configurable: true,
    get() {
      const doc = (globalThis as any).document ?? createFallbackDocument();
      ensureCreateHelpers(doc);
      ensureCreateHelpers(doc.body);
      return doc;
    },
  });

  Object.defineProperty(globalThis, 'activeWindow', {
    configurable: true,
    get() {
      return activeWindowMock;
    },
  });

  const getActiveDocument = () =>
    (globalThis as typeof globalThis & {
      activeDocument: Document & {
        createFragment?: (callback?: (fragment: DocumentFragment) => void) => DocumentFragment;
      };
    }).activeDocument;

  const applyOptions = (
    el: HTMLElement,
    options?: { cls?: string; text?: string; attr?: Record<string, string> },
  ) => {
    if (options?.cls) el.className = options.cls;
    if (options?.text) el.textContent = options.text;
    if (options?.attr) {
      for (const [key, value] of Object.entries(options.attr)) {
        el.setAttribute(key, value);
      }
    }
    return el;
  };

  Object.defineProperties(globalThis, {
    createDiv: {
      configurable: true,
      value: (options?: { cls?: string; text?: string; attr?: Record<string, string> }) =>
        applyOptions(getActiveDocument().createElement('div'), options),
    },
    createEl: {
      configurable: true,
      value: (tag: string, options?: { cls?: string; text?: string; attr?: Record<string, string> }) =>
        applyOptions(getActiveDocument().createElement(tag), options),
    },
    createFragment: {
      configurable: true,
      value: (callback?: (fragment: DocumentFragment) => void) => {
        const doc = getActiveDocument();
        const fragment = typeof doc.createDocumentFragment === 'function'
          ? doc.createDocumentFragment()
          : document.createDocumentFragment();
        callback?.(fragment);
        return fragment;
      },
    },
    createSpan: {
      configurable: true,
      value: (options?: { cls?: string; text?: string; attr?: Record<string, string> }) =>
        applyOptions(getActiveDocument().createElement('span'), options),
    },
    createSvg: {
      configurable: true,
      value: (tag: string) =>
        getActiveDocument().createElementNS('http://www.w3.org/2000/svg', tag),
    },
  });
}

installElementHelpers();

beforeEach(() => {
  installElementHelpers();
  installActiveGlobals();
});
