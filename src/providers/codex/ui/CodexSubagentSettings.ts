import type { App } from 'obsidian';
import { Modal, Notice, setIcon, Setting } from 'obsidian';

import { t } from '../../../i18n/i18n';
import type { TranslationKey } from '../../../i18n/types';
import { confirmDelete } from '../../../shared/modals/ConfirmModal';
import type { CodexSubagentStorage } from '../storage/CodexSubagentStorage';
import { DEFAULT_CODEX_PRIMARY_MODEL } from '../types/models';
import type { CodexSubagentDefinition } from '../types/subagent';

const REASONING_EFFORT_OPTIONS = [
  { value: '', label: 'Inherit' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'Extra High' },
] as const;

const SANDBOX_MODE_OPTIONS = [
  { value: '', label: 'Inherit' },
  { value: 'read-only', label: 'Read-only' },
  { value: 'danger-full-access', label: 'Danger full access' },
  { value: 'workspace-write', label: 'Workspace write' },
] as const;

const MAX_NAME_LENGTH = 64;
const CODEX_AGENT_NAME_PATTERN = /^[a-z0-9_-]+$/;
const CODEX_NICKNAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

export function validateCodexSubagentName(name: string): string | null {
  if (!name) return t('codex.subagents.validation.nameRequired' as TranslationKey);
  if (name.length > MAX_NAME_LENGTH) {
    return t('codex.subagents.validation.nameTooLong' as TranslationKey, { count: MAX_NAME_LENGTH });
  }
  if (!CODEX_AGENT_NAME_PATTERN.test(name)) {
    return t('codex.subagents.validation.namePattern' as TranslationKey);
  }
  return null;
}

export function validateCodexNicknameCandidates(candidates: string[]): string | null {
  const normalized = candidates.map(candidate => candidate.trim()).filter(Boolean);
  if (normalized.length === 0) return null;

  const seen = new Set<string>();
  for (const candidate of normalized) {
    if (!CODEX_NICKNAME_PATTERN.test(candidate)) {
      return t('codex.subagents.validation.nicknamesPattern' as TranslationKey);
    }

    const dedupeKey = candidate.toLowerCase();
    if (seen.has(dedupeKey)) {
      return t('codex.subagents.validation.nicknamesUnique' as TranslationKey);
    }
    seen.add(dedupeKey);
  }

  return null;
}

class CodexSubagentModal extends Modal {
  private existing: CodexSubagentDefinition | null;
  private allAgents: CodexSubagentDefinition[];
  private onSave: (agent: CodexSubagentDefinition) => Promise<void>;

  private _nameInput!: HTMLInputElement;
  private _descInput!: HTMLInputElement;
  private _instructionsArea!: HTMLTextAreaElement;
  private _nicknamesInput!: HTMLInputElement;
  private _modelInput!: HTMLInputElement;
  private _reasoningEffort = '';
  private _sandboxMode = '';
  private _triggerSave!: () => Promise<void>;

  constructor(
    app: App,
    existing: CodexSubagentDefinition | null,
    allAgents: CodexSubagentDefinition[],
    onSave: (agent: CodexSubagentDefinition) => Promise<void>,
  ) {
    super(app);
    this.existing = existing;
    this.allAgents = allAgents;
    this.onSave = onSave;
    this._reasoningEffort = existing?.modelReasoningEffort ?? '';
    this._sandboxMode = existing?.sandboxMode ?? '';
  }

  getTestInputs() {
    return {
      nameInput: this._nameInput,
      descInput: this._descInput,
      instructionsArea: this._instructionsArea,
      nicknamesInput: this._nicknamesInput,
      modelInput: this._modelInput,
      setReasoningEffort: (v: string) => { this._reasoningEffort = v; },
      setSandboxMode: (v: string) => { this._sandboxMode = v; },
      triggerSave: this._triggerSave,
    };
  }

  onOpen() {
    this.setTitle(this.existing
      ? t('codex.subagents.modal.titleEdit' as TranslationKey)
      : t('codex.subagents.modal.titleAdd' as TranslationKey));
    this.modalEl.addClass('codexian-sp-modal');

    const { contentEl } = this;

    new Setting(contentEl)
      .setName(t('codex.subagents.modal.name' as TranslationKey))
      .setDesc(t('codex.subagents.modal.nameDesc' as TranslationKey))
      .addText(text => {
        this._nameInput = text.inputEl;
        text.setValue(this.existing?.name ?? '')
          .setPlaceholder('code_reviewer');
      });

    new Setting(contentEl)
      .setName(t('codex.subagents.modal.description' as TranslationKey))
      .setDesc(t('codex.subagents.modal.descriptionDesc' as TranslationKey))
      .addText(text => {
        this._descInput = text.inputEl;
        text.setValue(this.existing?.description ?? '')
          .setPlaceholder(t('codex.subagents.modal.descriptionPlaceholder' as TranslationKey));
      });

    // Advanced options
    const details = contentEl.createEl('details', { cls: 'codexian-sp-advanced-section' });
    details.createEl('summary', {
      text: t('codex.subagents.modal.advancedOptions' as TranslationKey),
      cls: 'codexian-sp-advanced-summary',
    });
    if (
      this.existing?.model ||
      this.existing?.modelReasoningEffort ||
      this.existing?.sandboxMode ||
      this.existing?.nicknameCandidates?.length
    ) {
      details.open = true;
    }

    new Setting(details)
      .setName(t('codex.subagents.modal.model' as TranslationKey))
      .setDesc(t('codex.subagents.modal.modelDesc' as TranslationKey))
      .addText(text => {
        this._modelInput = text.inputEl;
        text.setValue(this.existing?.model ?? '')
          .setPlaceholder(DEFAULT_CODEX_PRIMARY_MODEL);
      });

    new Setting(details)
      .setName(t('codex.subagents.modal.reasoningEffort' as TranslationKey))
      .setDesc(t('codex.subagents.modal.reasoningEffortDesc' as TranslationKey))
      .addDropdown(dropdown => {
        for (const opt of REASONING_EFFORT_OPTIONS) {
          dropdown.addOption(opt.value, opt.label);
        }
        dropdown.setValue(this._reasoningEffort);
        dropdown.onChange(v => { this._reasoningEffort = v; });
      });

    new Setting(details)
      .setName(t('codex.subagents.modal.sandboxMode' as TranslationKey))
      .setDesc(t('codex.subagents.modal.sandboxModeDesc' as TranslationKey))
      .addDropdown(dropdown => {
        for (const opt of SANDBOX_MODE_OPTIONS) {
          dropdown.addOption(opt.value, opt.label);
        }
        dropdown.setValue(this._sandboxMode);
        dropdown.onChange(v => { this._sandboxMode = v; });
      });

    new Setting(details)
      .setName(t('codex.subagents.modal.nicknames' as TranslationKey))
      .setDesc(t('codex.subagents.modal.nicknamesDesc' as TranslationKey))
      .addText(text => {
        this._nicknamesInput = text.inputEl;
        text.setValue(this.existing?.nicknameCandidates?.join(', ') ?? '');
      });

    // Developer instructions
    new Setting(contentEl)
      .setName(t('codex.subagents.modal.instructions' as TranslationKey))
      .setDesc(t('codex.subagents.modal.instructionsDesc' as TranslationKey));

    const instructionsArea = contentEl.createEl('textarea', {
      cls: 'codexian-sp-content-area',
      attr: {
        rows: '10',
        placeholder: t('codex.subagents.modal.instructionsPlaceholder' as TranslationKey),
      },
    });
    instructionsArea.value = this.existing?.developerInstructions ?? '';
    this._instructionsArea = instructionsArea;

    // Buttons
    const doSave = async () => {
      const name = this._nameInput.value.trim();
      const nameError = validateCodexSubagentName(name);
      if (nameError) {
        new Notice(nameError);
        return;
      }

      const description = this._descInput.value.trim();
      if (!description) {
        new Notice(t('codex.subagents.descriptionRequired' as TranslationKey));
        return;
      }

      const developerInstructions = this._instructionsArea.value;
      if (!developerInstructions.trim()) {
        new Notice(t('codex.subagents.instructionsRequired' as TranslationKey));
        return;
      }

      const nicknameCandidates = this._nicknamesInput.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const nicknameError = validateCodexNicknameCandidates(nicknameCandidates);
      if (nicknameError) {
        new Notice(nicknameError);
        return;
      }

      const duplicate = this.allAgents.find(
        a => a.name.toLowerCase() === name.toLowerCase() &&
             a.persistenceKey !== this.existing?.persistenceKey,
      );
      if (duplicate) {
        new Notice(t('codex.subagents.duplicateName' as TranslationKey, { name }));
        return;
      }

      const agent: CodexSubagentDefinition = {
        name,
        description,
        developerInstructions,
        nicknameCandidates: nicknameCandidates.length > 0 ? nicknameCandidates : undefined,
        model: this._modelInput.value.trim() || undefined,
        modelReasoningEffort: this._reasoningEffort || undefined,
        sandboxMode: this._sandboxMode || undefined,
        persistenceKey: this.existing?.persistenceKey,
        extraFields: this.existing?.extraFields,
      };

      try {
        await this.onSave(agent);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('common.unknownError');
        new Notice(t('codex.subagents.saveFailed' as TranslationKey, { message }));
        return;
      }
      this.close();
    };
    this._triggerSave = doSave;

    const buttonContainer = contentEl.createDiv({ cls: 'codexian-sp-modal-buttons' });

    const cancelBtn = buttonContainer.createEl('button', {
      text: t('common.cancel'),
      cls: 'codexian-cancel-btn',
    });
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = buttonContainer.createEl('button', {
      text: t('common.save'),
      cls: 'codexian-save-btn',
    });
    saveBtn.addEventListener('click', doSave);
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class CodexSubagentSettings {
  private containerEl: HTMLElement;
  private storage: CodexSubagentStorage;
  private agents: CodexSubagentDefinition[] = [];
  private app?: App;
  private onChanged?: () => void;

  constructor(containerEl: HTMLElement, storage: CodexSubagentStorage, app?: App, onChanged?: () => void) {
    this.containerEl = containerEl;
    this.storage = storage;
    this.app = app;
    this.onChanged = onChanged;
    this.render();
  }

  async render(): Promise<void> {
    this.containerEl.empty();

    try {
      this.agents = await this.storage.loadAll();
    } catch {
      this.agents = [];
    }

    const headerEl = this.containerEl.createDiv({ cls: 'codexian-sp-header' });
    headerEl.createSpan({ text: t('codex.subagents.header' as TranslationKey), cls: 'codexian-sp-label' });

    const actionsEl = headerEl.createDiv({ cls: 'codexian-sp-header-actions' });

    const refreshBtn = actionsEl.createEl('button', {
      cls: 'codexian-settings-action-btn',
      attr: { 'aria-label': t('common.refresh') },
    });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.addEventListener('click', () => { void this.render(); });

    const addBtn = actionsEl.createEl('button', {
      cls: 'codexian-settings-action-btn',
      attr: { 'aria-label': t('common.add') },
    });
    setIcon(addBtn, 'plus');
    addBtn.addEventListener('click', () => this.openModal(null));

    if (this.agents.length === 0) {
      const emptyEl = this.containerEl.createDiv({ cls: 'codexian-sp-empty-state' });
      emptyEl.setText(t('codex.subagents.empty' as TranslationKey));
      return;
    }

    const listEl = this.containerEl.createDiv({ cls: 'codexian-sp-list' });
    for (const agent of this.agents) {
      this.renderItem(listEl, agent);
    }
  }

  private renderItem(listEl: HTMLElement, agent: CodexSubagentDefinition): void {
    const itemEl = listEl.createDiv({ cls: 'codexian-sp-item' });
    const infoEl = itemEl.createDiv({ cls: 'codexian-sp-info' });

    const headerRow = infoEl.createDiv({ cls: 'codexian-sp-item-header' });
    const nameEl = headerRow.createSpan({ cls: 'codexian-sp-item-name' });
    nameEl.setText(agent.name);

    if (agent.model) {
      headerRow.createSpan({ text: agent.model, cls: 'codexian-slash-item-badge' });
    }

    if (agent.description) {
      const descEl = infoEl.createDiv({ cls: 'codexian-sp-item-desc' });
      descEl.setText(agent.description);
    }

    const actionsEl = itemEl.createDiv({ cls: 'codexian-sp-item-actions' });

    const editBtn = actionsEl.createEl('button', {
      cls: 'codexian-settings-action-btn',
      attr: { 'aria-label': t('common.edit') },
    });
    setIcon(editBtn, 'pencil');
    editBtn.addEventListener('click', () => this.openModal(agent));

    const deleteBtn = actionsEl.createEl('button', {
      cls: 'codexian-settings-action-btn codexian-settings-delete-btn',
      attr: { 'aria-label': t('common.delete') },
    });
    setIcon(deleteBtn, 'trash-2');
    deleteBtn.addEventListener('click', async () => {
      if (!this.app) return;
      const confirmed = await confirmDelete(
        this.app,
        t('codex.subagents.deleteConfirm' as TranslationKey, { name: agent.name }),
      );
      if (!confirmed) return;
      try {
        await this.storage.delete(agent);
        await this.render();
        this.onChanged?.();
        new Notice(t('codex.subagents.deleted' as TranslationKey, { name: agent.name }));
      } catch {
        new Notice(t('codex.subagents.deleteFailed' as TranslationKey));
      }
    });
  }

  private openModal(existing: CodexSubagentDefinition | null): void {
    if (!this.app) return;

    const modal = new CodexSubagentModal(
      this.app,
      existing,
      this.agents,
      async (agent) => {
        await this.storage.save(agent, existing);
        await this.render();
        this.onChanged?.();
        new Notice(
          existing
            ? t('codex.subagents.updated' as TranslationKey, { name: agent.name })
            : t('codex.subagents.created' as TranslationKey, { name: agent.name }),
        );
      },
    );
    modal.open();
  }
}
