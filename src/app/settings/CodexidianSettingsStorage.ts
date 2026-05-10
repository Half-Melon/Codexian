import { CODEXIDIAN_SETTINGS_PATH } from '../../core/bootstrap/StoragePaths';
import { normalizeHiddenProviderCommands } from '../../core/providers/commands/hiddenCommands';
import {
  getSharedEnvironmentVariables,
  inferEnvironmentSnippetScope,
  resolveEnvironmentSnippetScope,
} from '../../core/providers/providerEnvironment';
import type { VaultFileAdapter } from '../../core/storage/VaultFileAdapter';
import {
  CHAT_VIEW_PLACEMENTS,
  type ChatViewPlacement,
  type CodexidianSettings,
  type EnvironmentScope,
  type EnvSnippet,
  type ProviderConfigMap,
} from '../../core/types/settings';
import {
  getCodexProviderSettings,
  updateCodexProviderSettings,
} from '../../providers/codex/settings';
import { DEFAULT_CODEXIDIAN_SETTINGS } from './defaultSettings';

export {
  CODEXIDIAN_SETTINGS_PATH,
};

export type StoredCodexidianSettings = CodexidianSettings;

function isChatViewPlacement(value: unknown): value is ChatViewPlacement {
  return typeof value === 'string'
    && (CHAT_VIEW_PLACEMENTS as readonly string[]).includes(value);
}

function normalizeChatViewPlacement(value: unknown): ChatViewPlacement {
  if (isChatViewPlacement(value)) {
    return value;
  }

  return DEFAULT_CODEXIDIAN_SETTINGS.chatViewPlacement;
}

function normalizeProviderConfigs(value: unknown): ProviderConfigMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const result: ProviderConfigMap = {};
  for (const [providerId, config] of Object.entries(value as Record<string, unknown>)) {
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      result[providerId] = { ...(config as Record<string, unknown>) };
    }
  }
  return result;
}

function isEnvironmentScope(value: unknown): value is EnvironmentScope {
  return value === 'shared' || (typeof value === 'string' && value.startsWith('provider:'));
}

function normalizeContextLimits(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'number' && Number.isFinite(entry) && entry > 0) {
      result[key] = entry;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeEnvSnippets(value: unknown): EnvSnippet[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const snippets: EnvSnippet[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string'
      || typeof candidate.name !== 'string'
      || typeof candidate.description !== 'string'
      || typeof candidate.envVars !== 'string'
    ) {
      continue;
    }

    snippets.push({
      id: candidate.id,
      name: candidate.name,
      description: candidate.description,
      envVars: candidate.envVars,
      scope: resolveEnvironmentSnippetScope(
        candidate.envVars,
        isEnvironmentScope(candidate.scope)
          ? candidate.scope
          : inferEnvironmentSnippetScope(candidate.envVars),
      ),
      contextLimits: normalizeContextLimits(candidate.contextLimits),
    });
  }

  return snippets;
}

export class CodexidianSettingsStorage {
  constructor(private adapter: VaultFileAdapter) {}

  async load(): Promise<StoredCodexidianSettings> {
    if (!(await this.adapter.exists(CODEXIDIAN_SETTINGS_PATH))) {
      return this.getDefaults();
    }

    const content = await this.adapter.read(CODEXIDIAN_SETTINGS_PATH);
    const stored = JSON.parse(content) as Record<string, unknown>;
    const hiddenProviderCommands = normalizeHiddenProviderCommands(stored.hiddenProviderCommands);
    const envSnippets = normalizeEnvSnippets(stored.envSnippets);
    const providerConfigs = normalizeProviderConfigs(stored.providerConfigs);
    const chatViewPlacement = normalizeChatViewPlacement(stored.chatViewPlacement);
    const normalizedSettings = {
      ...stored,
      sharedEnvironmentVariables: getSharedEnvironmentVariables(stored),
      envSnippets,
      hiddenProviderCommands,
      providerConfigs,
      chatViewPlacement,
    };

    const merged = {
      ...this.getDefaults(),
      ...normalizedSettings,
    } as StoredCodexidianSettings;

    updateCodexProviderSettings(
      merged as unknown as Record<string, unknown>,
      getCodexProviderSettings(normalizedSettings),
    );

    if (
      stored.chatViewPlacement !== chatViewPlacement
      || JSON.stringify(envSnippets) !== JSON.stringify(stored.envSnippets ?? [])
    ) {
      await this.save(merged);
    }

    return merged;
  }

  async save(settings: StoredCodexidianSettings): Promise<void> {
    const content = JSON.stringify(
      settings,
      null,
      2,
    );
    await this.adapter.write(CODEXIDIAN_SETTINGS_PATH, content);
  }

  async exists(): Promise<boolean> {
    return this.adapter.exists(CODEXIDIAN_SETTINGS_PATH);
  }

  async update(updates: Partial<StoredCodexidianSettings>): Promise<void> {
    const current = await this.load();
    await this.save({ ...current, ...updates });
  }

  async setLastModel(model: string, isCustom: boolean): Promise<void> {
    if (isCustom) {
      await this.update({ lastCustomModel: model });
      return;
    }

    const current = await this.load();
    current.savedProviderModel = {
      ...(current.savedProviderModel ?? {}),
      codex: model,
    };
    if (current.settingsProvider === 'codex') {
      current.model = model;
    }
    await this.save(current);
  }

  async setLastEnvHash(hash: string): Promise<void> {
    const current = await this.load();
    updateCodexProviderSettings(
      current as unknown as Record<string, unknown>,
      { environmentHash: hash },
    );
    await this.save(current);
  }

  private getDefaults(): StoredCodexidianSettings {
    return DEFAULT_CODEXIDIAN_SETTINGS;
  }
}
