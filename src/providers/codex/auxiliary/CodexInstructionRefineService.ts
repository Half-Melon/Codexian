import { QueryBackedInstructionRefineService } from '../../../core/auxiliary/QueryBackedInstructionRefineService';
import { resolveLocalePreference } from '../../../i18n/i18n';
import { getObsidianLocale } from '../../../i18n/obsidianLocale';
import type CodexianPlugin from '../../../main';
import { CodexAuxQueryRunner } from '../runtime/CodexAuxQueryRunner';

export class CodexInstructionRefineService extends QueryBackedInstructionRefineService {
  constructor(plugin: CodexianPlugin) {
    super(new CodexAuxQueryRunner(plugin), {
      resolveLocale: () => resolveLocalePreference(plugin.settings.locale, getObsidianLocale(plugin.app)),
    });
  }
}
