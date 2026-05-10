import { createMockEl } from '@test/helpers/mockElement';

import type { ProviderCapabilities, ProviderChatUIConfig } from '@/core/providers/types';
import type { UsageInfo } from '@/core/types';
import {
  ContextUsageMeter,
  createInputToolbar,
  ExternalContextSelector,
  ModelSelector,
  PermissionToggle,
  ServiceTierToggle,
  ThinkingBudgetSelector,
} from '@/features/chat/ui/InputToolbar';
import {
  DEFAULT_CODEX_PRIMARY_MODEL,
  DEFAULT_CODEX_PRIMARY_MODEL_LABEL,
} from '@/providers/codex/types/models';

jest.mock('obsidian', () => ({
  Notice: jest.fn(),
  setIcon: jest.fn(),
}));

const EFFORT_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'XHigh' },
];

function makeUsage(overrides: Partial<UsageInfo> = {}): UsageInfo {
  return {
    inputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    contextWindow: 200000,
    contextTokens: 0,
    percentage: 0,
    ...overrides,
  };
}

function createCapabilities(overrides: Partial<ProviderCapabilities> = {}): ProviderCapabilities {
  return {
    providerId: 'codex',
    supportsPersistentRuntime: true,
    supportsNativeHistory: true,
    supportsPlanMode: true,
    supportsRewind: true,
    supportsFork: true,
    supportsProviderCommands: true,
    supportsImageAttachments: true,
    supportsInstructionMode: true,
    reasoningControl: 'effort',
    ...overrides,
  };
}

function createUIConfig(overrides: Partial<ProviderChatUIConfig> = {}): ProviderChatUIConfig {
  return {
    getModelOptions: jest.fn(() => [
      { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', description: 'Fast' },
      { value: DEFAULT_CODEX_PRIMARY_MODEL, label: DEFAULT_CODEX_PRIMARY_MODEL_LABEL, description: 'Latest' },
      { value: 'custom-codex-model', label: 'custom-codex-model', description: 'Custom model' },
    ]),
    ownsModel: jest.fn((model: string) => model.startsWith('gpt-') || model === 'custom-codex-model'),
    isAdaptiveReasoningModel: jest.fn(() => true),
    getReasoningOptions: jest.fn(() => EFFORT_OPTIONS),
    getDefaultReasoningValue: jest.fn(() => 'medium'),
    getContextWindowSize: jest.fn(() => 200000),
    isDefaultModel: jest.fn((model: string) => model.startsWith('gpt-')),
    applyModelDefaults: jest.fn(),
    normalizeModelVariant: jest.fn((model: string) => model),
    getCustomModelIds: jest.fn(() => new Set<string>()),
    getPermissionModeToggle: jest.fn(() => ({
      inactiveValue: 'normal',
      inactiveLabel: 'Safe',
      activeValue: 'yolo',
      activeLabel: 'YOLO',
      planValue: 'plan',
      planLabel: 'Plan',
    })),
    getServiceTierToggle: jest.fn((settings: Record<string, unknown>) => (
      settings.model === DEFAULT_CODEX_PRIMARY_MODEL
        ? {
          inactiveValue: 'default',
          inactiveLabel: 'Standard',
          activeValue: 'fast',
          activeLabel: 'Fast',
        }
        : null
    )),
    ...overrides,
  };
}

function createCallbacks(overrides: Record<string, unknown> = {}) {
  let settings = {
    model: DEFAULT_CODEX_PRIMARY_MODEL,
    thinkingBudget: 'medium',
    effortLevel: 'medium',
    serviceTier: 'default',
    permissionMode: 'normal',
  };
  const callbacks = {
    onModelChange: jest.fn(async (model: string) => { settings = { ...settings, model }; }),
    onModeChange: jest.fn(),
    onThinkingBudgetChange: jest.fn(async (thinkingBudget: string) => { settings = { ...settings, thinkingBudget }; }),
    onEffortLevelChange: jest.fn(async (effortLevel: string) => { settings = { ...settings, effortLevel }; }),
    onServiceTierChange: jest.fn(async (serviceTier: string) => { settings = { ...settings, serviceTier }; }),
    onPermissionModeChange: jest.fn(async (permissionMode: string) => { settings = { ...settings, permissionMode }; }),
    getSettings: jest.fn(() => settings),
    getEnvironmentVariables: jest.fn(() => ''),
    getUIConfig: jest.fn(() => createUIConfig()),
    getCapabilities: jest.fn(() => createCapabilities()),
    setSettings: (next: Partial<typeof settings>) => { settings = { ...settings, ...next }; },
    ...overrides,
  };
  return callbacks;
}

function findByClass(root: any, className: string): any | undefined {
  if (root.hasClass?.(className)) return root;
  for (const child of root.children || []) {
    const found = findByClass(child, className);
    if (found) return found;
  }
  return undefined;
}

function findAllByClass(root: any, className: string): any[] {
  const results: any[] = [];
  const visit = (node: any) => {
    if (node.hasClass?.(className)) results.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return results;
}

describe('ModelSelector', () => {
  it('renders Codex models and updates on selection', async () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();
    new ModelSelector(parentEl, callbacks as any);

    expect(findByClass(parentEl, 'codexian-model-label')?.textContent).toBe(DEFAULT_CODEX_PRIMARY_MODEL_LABEL);

    const options = findAllByClass(parentEl, 'codexian-model-option');
    const customOption = options.find(option => option.children.some((child: any) => child.textContent === 'custom-codex-model'));
    customOption?.click();
    await Promise.resolve();

    expect(callbacks.onModelChange).toHaveBeenCalledWith('custom-codex-model');
    expect(findByClass(parentEl, 'codexian-model-label')?.textContent).toBe('custom-codex-model');
  });
});

describe('ThinkingBudgetSelector', () => {
  it('shows Codex effort controls for adaptive reasoning', () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();

    new ThinkingBudgetSelector(parentEl, callbacks as any);

    expect(findByClass(parentEl, 'codexian-thinking-effort')?.style.display).toBe('');
    expect(findByClass(parentEl, 'codexian-thinking-budget')?.style.display).toBe('none');
    expect(findByClass(parentEl, 'codexian-thinking-current')?.textContent).toBe('Medium');
  });

  it('hides reasoning controls when the provider exposes no reasoning control', () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks({
      getCapabilities: jest.fn(() => createCapabilities({ reasoningControl: 'none' })),
    });

    new ThinkingBudgetSelector(parentEl, callbacks as any);

    expect(findByClass(parentEl, 'codexian-thinking-effort')?.style.display).toBe('none');
    expect(findByClass(parentEl, 'codexian-thinking-budget')?.style.display).toBe('none');
  });
});

describe('PermissionToggle', () => {
  it('toggles Codex permission mode between safe and yolo', async () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();
    new PermissionToggle(parentEl, callbacks as any);

    expect(findByClass(parentEl, 'codexian-permission-label')?.textContent).toBe('Safe');

    findByClass(parentEl, 'codexian-toggle-switch')?.click();
    await Promise.resolve();

    expect(callbacks.onPermissionModeChange).toHaveBeenCalledWith('yolo');
    expect(findByClass(parentEl, 'codexian-permission-label')?.textContent).toBe('YOLO');
  });

  it('renders plan mode as a label when plan mode is active', () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();
    callbacks.setSettings({ permissionMode: 'plan' });

    new PermissionToggle(parentEl, callbacks as any);

    expect(findByClass(parentEl, 'codexian-permission-label')?.textContent).toBe('Plan');
    expect(findByClass(parentEl, 'codexian-toggle-switch')?.style.display).toBe('none');
  });
});

describe('ServiceTierToggle', () => {
  it('shows fast-mode toggle for the primary Codex model', async () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();

    new ServiceTierToggle(parentEl, callbacks as any);

    const button = findByClass(parentEl, 'codexian-service-tier-button');
    expect(button).toBeDefined();
    button?.click();
    await Promise.resolve();

    expect(callbacks.onServiceTierChange).toHaveBeenCalledWith('fast');
  });

  it('hides fast-mode toggle when the model has no service tier config', () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();
    callbacks.setSettings({ model: 'gpt-5.4-mini' });

    new ServiceTierToggle(parentEl, callbacks as any);

    expect(findByClass(parentEl, 'codexian-service-tier-toggle')?.style.display).toBe('none');
  });
});

describe('ExternalContextSelector', () => {
  it('adds, tracks, and clears external context paths programmatically', () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();
    const selector = new ExternalContextSelector(parentEl, callbacks as any);
    const onChange = jest.fn();
    selector.setOnChange(onChange);

    const result = selector.addExternalContext('/tmp');

    expect(result.success).toBe(true);
    expect(selector.getExternalContexts()).toContain('/tmp');
    expect(onChange).toHaveBeenCalledWith(['/tmp']);

    selector.clearExternalContexts([]);
    expect(selector.getExternalContexts()).toEqual([]);
  });
});

describe('ContextUsageMeter', () => {
  it('shows context usage and warning state', () => {
    const parentEl = createMockEl();
    const meter = new ContextUsageMeter(parentEl);

    meter.update(makeUsage({ contextTokens: 180000, percentage: 90 }));

    const container = findByClass(parentEl, 'codexian-context-meter');
    expect(container?.style.display).toBe('flex');
    expect(container?.hasClass('warning')).toBe(true);
    expect(findByClass(parentEl, 'codexian-context-meter-percent')?.textContent).toBe('90%');
  });

  it('hides when usage is empty', () => {
    const parentEl = createMockEl();
    const meter = new ContextUsageMeter(parentEl);

    meter.update(null);

    expect(findByClass(parentEl, 'codexian-context-meter')?.style.display).toBe('none');
  });
});

describe('createInputToolbar', () => {
  it('creates the Codex-only toolbar components', () => {
    const parentEl = createMockEl();
    const callbacks = createCallbacks();

    const toolbar = createInputToolbar(parentEl, callbacks as any);

    expect(toolbar.modelSelector).toBeInstanceOf(ModelSelector);
    expect(toolbar.thinkingBudgetSelector).toBeInstanceOf(ThinkingBudgetSelector);
    expect(toolbar.externalContextSelector).toBeInstanceOf(ExternalContextSelector);
    expect(toolbar.permissionToggle).toBeInstanceOf(PermissionToggle);
    expect(toolbar.serviceTierToggle).toBeInstanceOf(ServiceTierToggle);
    expect(Object.keys(toolbar)).not.toContain('mcpServerSelector');
  });
});
