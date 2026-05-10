import { QueryBackedTitleGenerationService } from '../../../core/auxiliary/QueryBackedTitleGenerationService';
import { resolveLocalePreference } from '../../../i18n/i18n';
import { getObsidianLocale } from '../../../i18n/obsidianLocale';
import type CodexianPlugin from '../../../main';
import { CodexAuxQueryRunner } from '../runtime/CodexAuxQueryRunner';
import { codexChatUIConfig } from '../ui/CodexChatUIConfig';

export class CodexTitleGenerationService extends QueryBackedTitleGenerationService {
  constructor(plugin: CodexianPlugin) {
    super({
      createRunner: () => new CodexAuxQueryRunner(plugin),
      resolveModel: () => {
        const settings = plugin.settings as unknown as Record<string, unknown>;
        const titleModel = typeof settings.titleGenerationModel === 'string'
          ? settings.titleGenerationModel
          : '';
        return codexChatUIConfig.ownsModel(titleModel, settings)
          ? titleModel
          : undefined;
      },
      resolveLocale: () => resolveLocalePreference(plugin.settings.locale, getObsidianLocale(plugin.app)),
    });
  }
}
