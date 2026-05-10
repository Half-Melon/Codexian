import type { ProviderConfigMap } from '../core/types/settings';
import { DEFAULT_CODEX_PROVIDER_SETTINGS } from './codex/settings';

export function getBuiltInProviderDefaultConfigs(): ProviderConfigMap {
  return {
    codex: {
      ...DEFAULT_CODEX_PROVIDER_SETTINGS,
      enabled: true,
      cliPath: '/Applications/Codex.app/Contents/Resources/codex',
    },
  };
}
