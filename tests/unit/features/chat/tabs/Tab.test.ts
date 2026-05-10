import '@/providers';

import { createMockEl } from '@test/helpers/mockElement';

import { ProviderRegistry } from '@/core/providers/ProviderRegistry';
import { ProviderWorkspaceRegistry } from '@/core/providers/ProviderWorkspaceRegistry';
import {
  createTab,
  getBlankTabModelOptions,
  initializeTabService,
  initializeTabUI,
} from '@/features/chat/tabs/Tab';
import { DEFAULT_CODEX_PRIMARY_MODEL } from '@/providers/codex/types/models';

jest.mock('@/features/chat/ui/FileContext', () => ({
  FileContextManager: jest.fn().mockImplementation(() => ({
    preScanExternalContexts: jest.fn(),
    setAgentService: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('@/features/chat/ui/ImageContext', () => ({
  ImageContextManager: jest.fn().mockImplementation(() => ({
    setEnabled: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('@/features/chat/ui/NavigationSidebar', () => ({
  NavigationSidebar: jest.fn().mockImplementation(() => ({
    updateVisibility: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('@/features/chat/ui/StatusPanel', () => ({
  StatusPanel: jest.fn().mockImplementation(() => ({
    mount: jest.fn(),
    updateTodos: jest.fn(),
    addBashOutput: jest.fn(),
    updateBashOutput: jest.fn(),
  })),
}));

jest.mock('@/shared/components/SlashCommandDropdown', () => ({
  SlashCommandDropdown: jest.fn().mockImplementation(() => ({
    setHiddenCommands: jest.fn(),
    setProviderCatalog: jest.fn(),
    resetSdkSkillsCache: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('@/features/chat/ui/InputToolbar', () => ({
  createInputToolbar: jest.fn().mockImplementation(() => ({
    modelSelector: { updateDisplay: jest.fn(), renderOptions: jest.fn() },
    modeSelector: { updateDisplay: jest.fn(), renderOptions: jest.fn() },
    thinkingBudgetSelector: { updateDisplay: jest.fn() },
    externalContextSelector: {
      setOnChange: jest.fn(),
      setPersistentPaths: jest.fn(),
      setOnPersistenceChange: jest.fn(),
      getExternalContexts: jest.fn().mockReturnValue([]),
    },
    permissionToggle: { updateDisplay: jest.fn(), setVisible: jest.fn() },
    serviceTierToggle: { updateDisplay: jest.fn() },
    contextUsageMeter: { update: jest.fn() },
  })),
}));

jest.mock('@/features/chat/services/BangBashService', () => ({
  BangBashService: jest.fn(),
}));

jest.mock('@/features/chat/ui/BangBashModeManager', () => ({
  BangBashModeManager: jest.fn(),
}));

jest.mock('@/features/chat/ui/InstructionModeManager', () => ({
  InstructionModeManager: jest.fn(),
}));

function createMockPlugin(overrides: Record<string, unknown> = {}) {
  return {
    app: {
      vault: {
        adapter: { basePath: '/vault' },
        on: jest.fn(() => ({ id: 'event-ref' })),
        offref: jest.fn(),
        getAbstractFileByPath: jest.fn(),
        getAllLoadedFiles: jest.fn(() => []),
        getFiles: jest.fn(() => []),
      },
      workspace: {
        getActiveFile: jest.fn(() => null),
      },
      metadataCache: {
        getFileCache: jest.fn(() => null),
      },
    },
    settings: {
      settingsProvider: 'codex',
      providerConfigs: {
        codex: { enabled: true, customModels: '' },
      },
      model: DEFAULT_CODEX_PRIMARY_MODEL,
      effortLevel: 'medium',
      serviceTier: 'default',
      thinkingBudget: 'medium',
      permissionMode: 'normal',
      savedProviderModel: { codex: DEFAULT_CODEX_PRIMARY_MODEL },
      savedProviderEffort: { codex: 'medium' },
      savedProviderServiceTier: { codex: 'default' },
      savedProviderThinkingBudget: { codex: 'medium' },
      savedProviderPermissionMode: { codex: 'normal' },
      hiddenProviderCommands: { codex: [] },
      persistentExternalContextPaths: [],
      excludedTags: [],
      ...((overrides.settings as Record<string, unknown> | undefined) ?? {}),
    },
    getActiveEnvironmentVariables: jest.fn(() => ''),
    getConversationById: jest.fn().mockResolvedValue(null),
    saveSettings: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;
}

function createRuntime() {
  return {
    providerId: 'codex',
    cleanup: jest.fn(),
    onReadyStateChange: jest.fn(() => jest.fn()),
    syncConversationState: jest.fn(),
    getCapabilities: jest.fn(() => ProviderRegistry.getCapabilities('codex')),
  };
}

function createConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conv-1',
    providerId: 'codex',
    title: 'Codex conversation',
    messages: [],
    sessionId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  ProviderWorkspaceRegistry.clear();
  (globalThis as any).ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
  }));
});

describe('getBlankTabModelOptions', () => {
  it('returns enabled Codex model options grouped as Codex', () => {
    const result = getBlankTabModelOptions({
      providerConfigs: { codex: { enabled: true } },
      settingsProvider: 'codex',
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: DEFAULT_CODEX_PRIMARY_MODEL, group: 'Codex' }),
      ]),
    );
  });
});

describe('createTab', () => {
  it('creates a blank Codex tab with Codex draft model', () => {
    const plugin = createMockPlugin();
    const tab = createTab({ plugin, containerEl: createMockEl() as any });

    expect(tab.lifecycleState).toBe('blank');
    expect(tab.providerId).toBe('codex');
    expect(tab.draftModel).toBe(DEFAULT_CODEX_PRIMARY_MODEL);
    expect(tab.conversationId).toBeNull();
    expect(tab.ui).not.toHaveProperty('mcpServerSelector');
  });

  it('creates a bound Codex tab for an existing conversation', () => {
    const plugin = createMockPlugin();
    const conversation = createConversation({ id: 'conv-bound' });

    const tab = createTab({ plugin, containerEl: createMockEl() as any, conversation });

    expect(tab.lifecycleState).toBe('bound_cold');
    expect(tab.providerId).toBe('codex');
    expect(tab.draftModel).toBeNull();
    expect(tab.conversationId).toBe('conv-bound');
  });
});

describe('initializeTabService', () => {
  it('creates a Codex runtime and syncs restored conversation state', async () => {
    const plugin = createMockPlugin();
    const conversation = createConversation({
      messages: [{ id: 'm1', role: 'user', content: 'hello', timestamp: Date.now() }],
      externalContextPaths: ['/workspace'],
    });
    const runtime = createRuntime();
    jest.spyOn(ProviderRegistry, 'createChatRuntime').mockReturnValue(runtime as any);
    const tab = createTab({ plugin, containerEl: createMockEl() as any, conversation });

    await initializeTabService(tab, plugin, conversation);

    expect(ProviderRegistry.createChatRuntime).toHaveBeenCalledWith({ plugin, providerId: 'codex' });
    expect(runtime.syncConversationState).toHaveBeenCalledWith(conversation, ['/workspace']);
    expect(tab.service).toBe(runtime);
    expect(tab.serviceInitialized).toBe(true);
    expect(tab.lifecycleState).toBe('bound_active');
  });
});

describe('initializeTabUI', () => {
  it('initializes Codex-only UI without legacy MCP selector wiring', () => {
    const plugin = createMockPlugin();
    const tab = createTab({ plugin, containerEl: createMockEl() as any });

    initializeTabUI(tab, plugin);

    expect(tab.ui.modelSelector).toBeDefined();
    expect(tab.ui.externalContextSelector).toBeDefined();
    expect(tab.ui.fileContextManager).toBeDefined();
    expect(tab.ui.imageContextManager).toBeDefined();
    expect(tab.ui).not.toHaveProperty('mcpServerSelector');
  });
});
