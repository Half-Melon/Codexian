const mockRenderEnvironmentSettingsSection = jest.fn();
const mockSetLocale = jest.fn((_locale: string) => true);

interface MockButtonComponent {
  text: string;
  onClickCallback: (() => Promise<void> | void) | null;
  setButtonText: jest.MockedFunction<(value: string) => MockButtonComponent>;
  onClick: jest.MockedFunction<(callback: () => Promise<void> | void) => MockButtonComponent>;
}

interface MockDropdownComponent {
  addOption: jest.MockedFunction<(value: string, label: string) => MockDropdownComponent>;
  setValue: jest.MockedFunction<(value: string) => MockDropdownComponent>;
  onChange: jest.MockedFunction<(callback: (value: string) => Promise<void> | void) => MockDropdownComponent>;
}

interface MockToggleComponent {
  setValue: jest.MockedFunction<(value: boolean) => MockToggleComponent>;
  onChange: jest.MockedFunction<(callback: (value: boolean) => Promise<void> | void) => MockToggleComponent>;
}

interface MockSliderComponent {
  value: number;
  onChangeCallback: ((value: number) => Promise<void> | void) | null;
  setLimits: jest.MockedFunction<(min: number, max: number, step: number) => MockSliderComponent>;
  setValue: jest.MockedFunction<(value: number) => MockSliderComponent>;
  setDynamicTooltip: jest.MockedFunction<() => MockSliderComponent>;
  onChange: jest.MockedFunction<(callback: (value: number) => Promise<void> | void) => MockSliderComponent>;
}

interface MockTextComponent {
  value: string;
  placeholder: string;
  onChangeCallback: ((value: string) => Promise<void> | void) | null;
  inputEl: MockElement;
  setPlaceholder: jest.MockedFunction<(value: string) => MockTextComponent>;
  setValue: jest.MockedFunction<(value: string) => MockTextComponent>;
  onChange: jest.MockedFunction<(callback: (value: string) => Promise<void> | void) => MockTextComponent>;
}

interface MockSettingEntry {
  name: string;
  desc: string;
  heading: boolean;
  buttons: MockButtonComponent[];
  textAreas: MockTextComponent[];
  sliders: MockSliderComponent[];
}

interface MockElement {
  style: Record<string, string>;
  value: string;
  rows: number;
  cols: number;
  createDiv: jest.MockedFunction<(options?: unknown) => MockElement>;
  createEl: jest.MockedFunction<(tag: string, options?: unknown) => MockElement>;
  createSpan: jest.MockedFunction<(options?: unknown) => MockElement>;
  empty: jest.Mock;
  addClass: jest.Mock;
  toggleClass: jest.Mock;
  addEventListener: jest.Mock;
  setText: jest.Mock;
}

const createdSettings: MockSettingEntry[] = [];

function createElement(): MockElement {
  const element = {
    style: {},
    value: '',
    rows: 0,
    cols: 0,
    createDiv: jest.fn((_options?: unknown) => createElement()),
    createEl: jest.fn((_tag: string, _options?: unknown) => createElement()),
    createSpan: jest.fn((_options?: unknown) => createElement()),
    empty: jest.fn(),
    addClass: jest.fn(),
    toggleClass: jest.fn(),
    addEventListener: jest.fn(),
    setText: jest.fn(),
  };

  return element;
}

function createButtonComponent(): MockButtonComponent {
  const component = {} as MockButtonComponent;
  component.text = '';
  component.onClickCallback = null;
  component.setButtonText = jest.fn((value: string) => {
    component.text = value;
    return component;
  });
  component.onClick = jest.fn((callback: () => Promise<void> | void) => {
    component.onClickCallback = callback;
    return component;
  });
  return component;
}

function createDropdownComponent(): MockDropdownComponent {
  const component = {} as MockDropdownComponent;
  component.addOption = jest.fn((_value: string, _label: string) => component);
  component.setValue = jest.fn((_value: string) => component);
  component.onChange = jest.fn((_callback: (value: string) => Promise<void> | void) => component);
  return component;
}

function createToggleComponent(): MockToggleComponent {
  const component = {} as MockToggleComponent;
  component.setValue = jest.fn((_value: boolean) => component);
  component.onChange = jest.fn((_callback: (value: boolean) => Promise<void> | void) => component);
  return component;
}

function createSliderComponent(): MockSliderComponent {
  const component = {} as MockSliderComponent;
  component.value = 0;
  component.onChangeCallback = null;
  component.setLimits = jest.fn((_min: number, _max: number, _step: number) => component);
  component.setValue = jest.fn((value: number) => {
    component.value = value;
    return component;
  });
  component.setDynamicTooltip = jest.fn(() => component);
  component.onChange = jest.fn((callback: (value: number) => Promise<void> | void) => {
    component.onChangeCallback = callback;
    return component;
  });
  return component;
}

function createTextComponent(): MockTextComponent {
  const component = {} as MockTextComponent;
  component.value = '';
  component.placeholder = '';
  component.onChangeCallback = null;
  component.inputEl = createElement();
  component.setPlaceholder = jest.fn((value: string) => {
    component.placeholder = value;
    return component;
  });
  component.setValue = jest.fn((value: string) => {
    component.value = value;
    component.inputEl.value = value;
    return component;
  });
  component.onChange = jest.fn((callback: (value: string) => Promise<void> | void) => {
    component.onChangeCallback = callback;
    return component;
  });
  return component;
}

jest.mock('obsidian', () => {
  class MockPluginSettingTab {
    app: unknown;
    plugin: unknown;
    containerEl = createElement();

    constructor(app: unknown, plugin: unknown) {
      this.app = app;
      this.plugin = plugin;
    }
  }

  class MockSetting {
    entry: MockSettingEntry;

    constructor(_container: unknown) {
      this.entry = {
        name: '',
        desc: '',
        heading: false,
        buttons: [],
        textAreas: [],
        sliders: [],
      };
      createdSettings.push(this.entry);
    }

    setName(name: string) {
      this.entry.name = name;
      return this;
    }

    setDesc(desc: string) {
      this.entry.desc = desc;
      return this;
    }

    setHeading() {
      this.entry.heading = true;
      return this;
    }

    addButton(callback: (button: MockButtonComponent) => void) {
      const component = createButtonComponent();
      this.entry.buttons.push(component);
      callback(component);
      return this;
    }

    addDropdown(callback: (dropdown: MockDropdownComponent) => void) {
      callback(createDropdownComponent());
      return this;
    }

    addSlider(callback: (slider: MockSliderComponent) => void) {
      const component = createSliderComponent();
      this.entry.sliders.push(component);
      callback(component);
      return this;
    }

    addText(callback: (text: MockTextComponent) => void) {
      callback(createTextComponent());
      return this;
    }

    addTextArea(callback: (text: MockTextComponent) => void) {
      const component = createTextComponent();
      this.entry.textAreas.push(component);
      callback(component);
      return this;
    }

    addToggle(callback: (toggle: MockToggleComponent) => void) {
      callback(createToggleComponent());
      return this;
    }
  }

  return {
    Notice: jest.fn(),
    PluginSettingTab: MockPluginSettingTab,
    Setting: MockSetting,
  };
});

jest.mock('@/core/providers/ProviderRegistry', () => ({
  ProviderRegistry: {
    getRegisteredProviderIds: jest.fn(() => []),
    getProviderDisplayName: jest.fn((id: string) => id),
    getChatUIConfig: jest.fn(() => ({
      getModelOptions: jest.fn(() => []),
      getCustomModelIds: jest.fn(() => []),
    })),
  },
}));

jest.mock('@/core/providers/ProviderWorkspaceRegistry', () => ({
  ProviderWorkspaceRegistry: {
    getSettingsTabRenderer: jest.fn(),
  },
}));

jest.mock('@/features/settings/ui/EnvironmentSettingsSection', () => ({
  renderEnvironmentSettingsSection: (...args: unknown[]) => mockRenderEnvironmentSettingsSection(...args),
}));

jest.mock('@/i18n/i18n', () => ({
  getAvailableLocales: jest.fn(() => ['en']),
  getLocaleDisplayName: jest.fn(() => 'English'),
  setLocale: (locale: string) => mockSetLocale(locale),
  t: (key: string) => key,
}));

import { CodexidianSettingTab } from '@/features/settings/CodexidianSettings';

function createPlugin() {
  return {
    settings: {
      locale: 'en',
      tabBarPosition: 'input',
      maxTabs: 3,
      chatViewPlacement: 'right-sidebar',
      enableAutoScroll: true,
      deferMathRenderingDuringStreaming: true,
      enableAutoTitleGeneration: false,
      titleGenerationModel: '',
      userName: '',
      systemPrompt: '',
      excludedTags: [],
      mediaFolder: 'attachments',
      keyboardNavigation: {
        scrollUpKey: 'w',
        scrollDownKey: 's',
        focusInputKey: 'i',
      },
      knowledgeWorkflow: {
        batchSize: 5,
        summaryTemplate: 'existing summary template',
        conceptTemplate: 'existing concept template',
        archiveRules: 'existing archive rules',
        archiveLogTemplate: 'existing archive log',
      },
    },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    initializeKnowledgeWorkflow: jest.fn().mockResolvedValue(undefined),
    getAllViews: jest.fn(() => []),
    getView: jest.fn(() => null),
  };
}

describe('CodexidianSettingTab', () => {
  beforeEach(() => {
    createdSettings.length = 0;
    jest.clearAllMocks();
  });

  it('renders the knowledge workflow initializer in settings', async () => {
    const plugin = createPlugin();
    const tab = new CodexidianSettingTab({} as any, plugin as any);

    tab.display();

    const setting = createdSettings.find(entry => entry.name === '初始化知识库工作流');
    expect(setting).toBeDefined();
    expect(setting!.desc).toContain('new/raw/wiki/outputs');
    expect(setting!.buttons).toHaveLength(1);
    expect(setting!.buttons[0].text).toBe('初始化');

    await setting!.buttons[0].onClickCallback?.();

    expect(plugin.initializeKnowledgeWorkflow).toHaveBeenCalledTimes(1);
  });

  it('renders configurable knowledge workflow templates', async () => {
    const plugin = createPlugin();
    const tab = new CodexidianSettingTab({} as any, plugin as any);

    tab.display();

    const summarySetting = createdSettings.find(entry => entry.name === '摘要模板');
    const conceptSetting = createdSettings.find(entry => entry.name === '概念模板');
    const archiveRulesSetting = createdSettings.find(entry => entry.name === '归档分类规则');
    const archiveLogSetting = createdSettings.find(entry => entry.name === '归档日志模板');

    expect(summarySetting?.textAreas[0].value).toBe('existing summary template');
    expect(conceptSetting?.textAreas[0].value).toBe('existing concept template');
    expect(archiveRulesSetting?.textAreas[0].value).toBe('existing archive rules');
    expect(archiveLogSetting?.textAreas[0].value).toBe('existing archive log');

    await summarySetting!.textAreas[0].onChangeCallback?.('updated summary template');

    expect(plugin.settings.knowledgeWorkflow.summaryTemplate).toBe('updated summary template');
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it('renders configurable knowledge workflow batch size', async () => {
    const plugin = createPlugin();
    const tab = new CodexidianSettingTab({} as any, plugin as any);

    tab.display();

    const batchSetting = createdSettings.find(entry => entry.name === '每批最大来源数');
    expect(batchSetting?.sliders[0].value).toBe(5);

    await batchSetting!.sliders[0].onChangeCallback?.(8);

    expect(plugin.settings.knowledgeWorkflow.batchSize).toBe(8);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });
});
