import { Setting } from 'obsidian';

import { getEnvironmentReviewKeysForScope } from '../../../core/providers/providerEnvironment';
import type { EnvironmentScope } from '../../../core/types/settings';
import { t } from '../../../i18n/i18n';
import type CodexianPlugin from '../../../main';
import { hideElement, runAsync, showElement } from '../../../utils/dom';
import { EnvSnippetManager } from './EnvSnippetManager';

interface EnvironmentSettingsSectionOptions {
  container: HTMLElement;
  plugin: CodexianPlugin;
  scope: EnvironmentScope;
  heading?: string;
  name: string;
  desc: string;
  placeholder: string;
  renderCustomContextLimits?: (container: HTMLElement) => void;
}

export function renderEnvironmentSettingsSection(
  options: EnvironmentSettingsSectionOptions,
): void {
  const {
    container,
    plugin,
    scope,
    heading,
    name,
    desc,
    placeholder,
    renderCustomContextLimits,
  } = options;

  if (heading) {
    new Setting(container).setName(heading).setHeading();
  }

  let envTextarea: HTMLTextAreaElement | null = null;
  const reviewEl = container.createDiv({ cls: 'codexian-env-review-warning' });
  hideElement(reviewEl);
  const updateReviewWarning = () => {
    const reviewKeys = getEnvironmentReviewKeysForScope(envTextarea?.value ?? '', scope);
    if (reviewKeys.length === 0) {
      hideElement(reviewEl);
      reviewEl.empty();
      return;
    }

    reviewEl.setText(t('notices.reviewEnvironmentOwnership', { keys: reviewKeys.join(', ') }));
    showElement(reviewEl, 'block');
  };

  new Setting(container)
    .setName(name)
    .setDesc(desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(placeholder)
        .setValue(plugin.getEnvironmentVariablesForScope(scope));
      text.inputEl.rows = 6;
      text.inputEl.cols = 50;
      text.inputEl.addClass('codexian-settings-env-textarea');
      text.inputEl.dataset.envScope = scope;
      text.inputEl.addEventListener('input', () => updateReviewWarning());
      text.inputEl.addEventListener('blur', () => {
        runAsync(async () => {
          await plugin.applyEnvironmentVariables(scope, text.inputEl.value);
          renderCustomContextLimits?.(contextLimitsContainer);
          updateReviewWarning();
        });
      });
      envTextarea = text.inputEl;
    });

  updateReviewWarning();

  const contextLimitsContainer = container.createDiv({ cls: 'codexian-context-limits-container' });
  renderCustomContextLimits?.(contextLimitsContainer);

  const envSnippetsContainer = container.createDiv({ cls: 'codexian-env-snippets-container' });
  new EnvSnippetManager(envSnippetsContainer, plugin, scope, () => {
    renderCustomContextLimits?.(contextLimitsContainer);
  });
}
