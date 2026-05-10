import { createMockEl } from '@test/helpers/mockElement';

import type { ProviderCommandDropdownConfig } from '@/core/providers/commands/ProviderCommandCatalog';
import type { ProviderCommandEntry } from '@/core/providers/commands/ProviderCommandEntry';
import {
  SlashCommandDropdown,
  type SlashCommandDropdownCallbacks,
} from '@/shared/components/SlashCommandDropdown';

jest.mock('@/core/commands/builtInCommands', () => ({
  getBuiltInCommandsForDropdown: jest.fn((providerId?: string) => {
    const all = [
      { id: 'builtin:clear', name: 'clear', description: 'Start a new conversation', content: '' },
      { id: 'builtin:add-dir', name: 'add-dir', description: 'Add external context directory', content: '', argumentHint: 'path/to/directory' },
      { id: 'builtin:resume', name: 'resume', description: 'Resume a previous conversation', content: '', supportsNativeHistory: true },
      { id: 'builtin:fork', name: 'fork', description: 'Fork entire conversation to new session', content: '', supportsFork: true },
    ];
    if (!providerId) return all;
    if (providerId === 'codex') {
      return all;
    }
    return all;
  }),
}));

function createMockInput(): any {
  return {
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    focus: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
}

function createMockCallbacks(overrides: Partial<SlashCommandDropdownCallbacks> = {}): SlashCommandDropdownCallbacks {
  return {
    onSelect: jest.fn(),
    onHide: jest.fn(),
    ...overrides,
  };
}

function getRenderedItems(containerEl: any): { name: string; description: string }[] {
  const dropdownEl = containerEl.children.find(
    (c: any) => c.hasClass('codexian-slash-dropdown')
  );
  if (!dropdownEl) return [];
  const items = dropdownEl.querySelectorAll('.codexian-slash-item');
  return items.map((item: any) => {
    const nameSpan = item.children.find((c: any) => c.hasClass('codexian-slash-name'));
    const descDiv = item.children.find((c: any) => c.hasClass('codexian-slash-desc'));
    return {
      name: nameSpan?.textContent ?? '',
      description: descDiv?.textContent ?? '',
    };
  });
}

function getRenderedCommandNames(containerEl: any): string[] {
  return getRenderedItems(containerEl).map(i => i.name);
}

const CODEX_SLASH_CONFIG: ProviderCommandDropdownConfig = {
  providerId: 'codex',
  triggerChars: ['/'],
  builtInPrefix: '/',
  skillPrefix: '/',
  commandPrefix: '/',
};

const CODEX_CONFIG: ProviderCommandDropdownConfig = {
  providerId: 'codex',
  triggerChars: ['/', '$'],
  builtInPrefix: '/',
  skillPrefix: '$',
  commandPrefix: '/',
};

const CODEX_SLASH_ENTRIES: ProviderCommandEntry[] = [
  {
    id: 'cmd-review', providerId: 'codex', kind: 'command', name: 'review',
    description: 'Review code', content: '', scope: 'vault', source: 'user',
    isEditable: true, isDeletable: true, displayPrefix: '/', insertPrefix: '/',
  },
  {
    id: 'skill-deploy', providerId: 'codex', kind: 'skill', name: 'deploy',
    description: 'Deploy app', content: '', scope: 'vault', source: 'user',
    isEditable: true, isDeletable: true, displayPrefix: '/', insertPrefix: '/',
  },
];

const CODEX_ENTRIES: ProviderCommandEntry[] = [
  {
    id: 'codex-skill-analyze', providerId: 'codex', kind: 'skill', name: 'analyze',
    description: 'Analyze code', content: '', scope: 'vault', source: 'user',
    isEditable: true, isDeletable: true, displayPrefix: '$', insertPrefix: '$',
  },
];

const CODEX_WORKFLOW_ENTRIES: ProviderCommandEntry[] = [
  {
    id: 'codexian-workflow-health-check',
    providerId: 'codex',
    kind: 'command',
    name: 'kb-health-check',
    description: 'Run health check',
    content: '使用 health-check，运行一次知识库健康检查。',
    scope: 'builtin',
    source: 'builtin',
    isEditable: false,
    isDeletable: false,
    displayPrefix: '/',
    insertPrefix: '/',
  },
];

describe('SlashCommandDropdown - provider catalog', () => {
  let containerEl: any;
  let inputEl: any;
  let callbacks: SlashCommandDropdownCallbacks;

  beforeEach(() => {
    containerEl = createMockEl();
    inputEl = createMockInput();
    callbacks = createMockCallbacks();
  });

  describe('Codex provider (/ trigger)', () => {
    it('shows provider entries on / trigger', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_SLASH_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_SLASH_CONFIG, getProviderEntries }
      );

      inputEl.value = '/';
      inputEl.selectionStart = 1;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      // Built-ins + Codex entries (all use / prefix)
      expect(names).toContain('/clear');
      expect(names).toContain('/review');
      expect(names).toContain('/deploy');

      dropdown.destroy();
    });

    it('displays Codex entries with / prefix', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_SLASH_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_SLASH_CONFIG, getProviderEntries }
      );

      inputEl.value = '/rev';
      inputEl.selectionStart = 4;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      expect(names).toContain('/review');

      dropdown.destroy();
    });
  });

  describe('Codex provider (/ and $ triggers)', () => {
    it('shows Codex skills on $ trigger', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = '$';
      inputEl.selectionStart = 1;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      expect(names).toContain('$analyze');
      // Built-ins should NOT show on $ trigger
      expect(names).not.toContain('clear');

      dropdown.destroy();
    });

    it('shows built-ins + skills on / trigger at position 0', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = '/';
      inputEl.selectionStart = 1;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      expect(names).toContain('/clear');
      expect(names).toContain('$analyze');

      dropdown.destroy();
    });

    it('includes Codex-compatible built-ins in the Codex dropdown', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = '/';
      inputEl.selectionStart = 1;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      expect(names).toContain('/clear');
      expect(names).toContain('/add-dir');
      expect(names).toContain('/resume');
      expect(names).toContain('/fork');

      dropdown.destroy();
    });

    it('inserts $name for Codex skill selection', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = '$';
      inputEl.selectionStart = 1;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate selecting the first (only) item via handleKeydown Enter
      const event = { key: 'Enter', preventDefault: jest.fn() } as any;
      dropdown.handleKeydown(event);

      // Input should now contain $analyze
      expect(inputEl.value).toContain('$analyze');

      dropdown.destroy();
    });

    it('inserts full prompt content for Codexian knowledge workflow commands', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_WORKFLOW_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = '/kb-health';
      inputEl.selectionStart = 10;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const event = { key: 'Enter', preventDefault: jest.fn() } as any;
      dropdown.handleKeydown(event);

      expect(inputEl.value).toBe('使用 health-check，运行一次知识库健康检查。 ');
      expect(callbacks.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'kb-health-check',
          content: '使用 health-check，运行一次知识库健康检查。',
        }),
      );

      dropdown.destroy();
    });
  });

  describe('provider switch', () => {
    it('resets cached entries on provider switch', async () => {
      const slashEntries = jest.fn().mockResolvedValue(CODEX_SLASH_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_SLASH_CONFIG, getProviderEntries: slashEntries }
      );

      // Fetch Codex entries
      inputEl.value = '/';
      inputEl.selectionStart = 1;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(slashEntries).toHaveBeenCalledTimes(1);

      // Switch provider
      const skillEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      dropdown.setProviderCatalog(CODEX_CONFIG, skillEntries);

      inputEl.value = '$';
      inputEl.selectionStart = 1;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(skillEntries).toHaveBeenCalledTimes(1);

      dropdown.destroy();
    });
  });

  describe('mid-sentence trigger detection', () => {
    it('opens Codex $ trigger mid-sentence', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = 'some text $';
      inputEl.selectionStart = 11;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      expect(names).toContain('$analyze');

      dropdown.destroy();
    });

    it('opens Codex / trigger mid-sentence', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_SLASH_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_SLASH_CONFIG, getProviderEntries }
      );

      inputEl.value = 'check this /';
      inputEl.selectionStart = 12;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      expect(names).toContain('/review');

      dropdown.destroy();
    });

    it('does not show built-ins mid-sentence', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = 'some text /';
      inputEl.selectionStart = 11;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      const names = getRenderedCommandNames(containerEl);
      // Mid-sentence: provider entries only, no built-ins
      expect(names).not.toContain('/clear');
      expect(names).not.toContain('/add-dir');

      dropdown.destroy();
    });

    it('does not open trigger without preceding whitespace', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = 'word$';
      inputEl.selectionStart = 5;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(dropdown.isVisible()).toBe(false);

      dropdown.destroy();
    });

    it('inserts correctly at mid-sentence position', async () => {
      const getProviderEntries = jest.fn().mockResolvedValue(CODEX_ENTRIES);
      const dropdown = new SlashCommandDropdown(
        containerEl, inputEl, callbacks, { providerConfig: CODEX_CONFIG, getProviderEntries }
      );

      inputEl.value = 'prefix $';
      inputEl.selectionStart = 8;
      dropdown.handleInputChange();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Select the item
      const event = { key: 'Enter', preventDefault: jest.fn() } as any;
      dropdown.handleKeydown(event);

      // Should replace $analyze at the mid-sentence position
      expect(inputEl.value).toBe('prefix $analyze ');

      dropdown.destroy();
    });
  });

});
