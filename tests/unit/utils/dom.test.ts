import { createActiveDocumentFragment } from '@/utils/dom';

describe('dom utilities', () => {
  describe('createActiveDocumentFragment', () => {
    const originalCreateFragment = globalThis.createFragment;

    afterEach(() => {
      if (originalCreateFragment) {
        Object.defineProperty(globalThis, 'createFragment', {
          configurable: true,
          value: originalCreateFragment,
        });
      } else {
        delete (globalThis as { createFragment?: typeof createFragment }).createFragment;
      }
    });

    it('uses activeDocument.createFragment when available', () => {
      const fragment = { marker: 'document-helper-fragment' } as unknown as DocumentFragment;
      const createFragmentMock = jest.fn(() => fragment);
      Object.defineProperty(globalThis, 'activeDocument', {
        configurable: true,
        value: {
          createFragment: createFragmentMock,
        },
      });

      expect(createActiveDocumentFragment()).toBe(fragment);
      expect(createFragmentMock).toHaveBeenCalledTimes(1);
    });

    it('uses Obsidian global createFragment when activeDocument helper is unavailable', () => {
      const fragment = { marker: 'global-fragment' } as unknown as DocumentFragment;
      const createFragmentMock = jest.fn(() => fragment);
      Object.defineProperty(globalThis, 'activeDocument', {
        configurable: true,
        value: {
          createDocumentFragment: jest.fn(),
        },
      });
      Object.defineProperty(globalThis, 'createFragment', {
        configurable: true,
        value: createFragmentMock,
      });

      expect(createActiveDocumentFragment()).toBe(fragment);
      expect(createFragmentMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to activeDocument.createDocumentFragment', () => {
      delete (globalThis as { createFragment?: typeof createFragment }).createFragment;
      const fragment = { marker: 'document-fragment' } as unknown as DocumentFragment;
      const createDocumentFragmentMock = jest.fn(() => fragment);
      Object.defineProperty(globalThis, 'activeDocument', {
        configurable: true,
        value: {
          createDocumentFragment: createDocumentFragmentMock,
        },
      });

      expect(createActiveDocumentFragment()).toBe(fragment);
      expect(createDocumentFragmentMock).toHaveBeenCalledTimes(1);
    });
  });
});
