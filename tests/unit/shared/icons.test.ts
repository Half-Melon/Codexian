/** @jest-environment jsdom */

import {
  createProviderIconSvg,
  OPENAI_PROVIDER_ICON,
} from '@/shared/icons';

describe('createProviderIconSvg', () => {
  it('renders path-based provider icons with currentColor fill', () => {
    const svg = createProviderIconSvg(OPENAI_PROVIDER_ICON, {
      className: 'test-icon',
      height: 12,
      width: 12,
    });

    expect(svg.getAttribute('viewBox')).toBe(OPENAI_PROVIDER_ICON.viewBox);
    expect(svg.getAttribute('width')).toBe('12');
    expect(svg.getAttribute('height')).toBe('12');
    expect(svg.classList.contains('codexian-provider-icon')).toBe(true);
    expect(svg.classList.contains('test-icon')).toBe(true);

    const path = svg.querySelector('path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('fill')).toBe('currentColor');
  });

  it('does not depend on activeDocument.createSvg for the root svg', () => {
    const globals = globalThis as typeof globalThis & { activeDocument?: Document };
    const originalActiveDocument = globals.activeDocument;
    Object.defineProperty(globalThis, 'activeDocument', {
      configurable: true,
      value: {
        ...document,
        createElementNS: document.createElementNS.bind(document),
        importNode: document.importNode.bind(document),
        createSvg: () => {
          throw new DOMException(
            "Failed to execute 'appendChild' on 'Node': Only one element on document allowed.",
            'HierarchyRequestError',
          );
        },
      },
    });

    try {
      const svg = createProviderIconSvg(OPENAI_PROVIDER_ICON);

      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg.querySelector('path')).not.toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'activeDocument', {
        configurable: true,
        value: originalActiveDocument,
      });
    }
  });
});
