import type { AppSessionStorage, AppTabManagerState } from '../providers/types';
import type { VaultFileAdapter } from '../storage/VaultFileAdapter';

/**
 * Minimal shared app storage contract.
 *
 * This interface covers only the storage concerns that are shared across
 * all providers: Codexidian settings, tab manager state, and session metadata.
 *
 * Provider-specific storage surfaces (skills, agents, and runtime settings)
 * live behind provider-owned modules.
 */
export interface SharedAppStorage {
  initialize(): Promise<{ codexidian: Record<string, unknown> }>;
  saveCodexidianSettings(settings: Record<string, unknown>): Promise<void>;
  setTabManagerState(state: AppTabManagerState): Promise<void>;
  getTabManagerState(): Promise<AppTabManagerState | null>;
  sessions: AppSessionStorage;
  getAdapter(): VaultFileAdapter;
}
