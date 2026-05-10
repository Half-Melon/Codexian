import type { ProviderId } from '../../../core/providers/types';
import type CodexidianPlugin from '../../../main';
import { getEnhancedPath, parseEnvironmentVariables } from '../../../utils/env';
import { getVaultPath } from '../../../utils/path';
import type { InitializeResult } from './codexAppServerTypes';
import { buildCodexLaunchSpec } from './CodexLaunchSpecBuilder';
import type { CodexLaunchSpec } from './codexLaunchTypes';
import type { CodexRpcTransport } from './CodexRpcTransport';

const CODEX_APP_SERVER_CLIENT_INFO = Object.freeze({
  name: 'codexidian',
  version: '1.0.0',
});

export function getCodexAppServerWorkingDirectory(plugin: CodexidianPlugin): string {
  return getVaultPath(plugin.app) ?? process.cwd();
}

export function buildCodexAppServerEnvironment(
  plugin: CodexidianPlugin,
  providerId: ProviderId = 'codex',
): Record<string, string> {
  const customEnv = parseEnvironmentVariables(plugin.getActiveEnvironmentVariables(providerId));
  const baseEnv = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const enhancedPath = getEnhancedPath(customEnv.PATH);

  return {
    ...baseEnv,
    ...customEnv,
    PATH: enhancedPath,
  };
}

export function resolveCodexAppServerLaunchSpec(
  plugin: CodexidianPlugin,
  providerId: ProviderId = 'codex',
): CodexLaunchSpec {
  return buildCodexLaunchSpec({
    settings: plugin.settings as unknown as Record<string, unknown>,
    resolvedCliCommand: plugin.getResolvedProviderCliPath(providerId),
    hostVaultPath: getCodexAppServerWorkingDirectory(plugin),
    env: buildCodexAppServerEnvironment(plugin, providerId),
  });
}

export async function initializeCodexAppServerTransport(
  transport: CodexRpcTransport,
): Promise<InitializeResult> {
  const result = await transport.request<InitializeResult>('initialize', {
    clientInfo: CODEX_APP_SERVER_CLIENT_INFO,
    capabilities: { experimentalApi: true },
  });

  transport.notify('initialized');
  return result;
}
