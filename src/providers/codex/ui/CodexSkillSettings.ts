import type { App } from 'obsidian';
import { Modal, Notice, setIcon, Setting } from 'obsidian';

import type { ProviderCommandCatalog } from '../../../core/providers/commands/ProviderCommandCatalog';
import type { ProviderCommandEntry } from '../../../core/providers/commands/ProviderCommandEntry';
import { t } from '../../../i18n/i18n';
import { runAsync } from '../../../utils/dom';
import { validateCommandName } from '../../../utils/slashCommand';
import {
  CODEX_SKILL_ROOT_OPTIONS,
  type CodexSkillRootId,
  createCodexSkillPersistenceKey,
  parseCodexSkillPersistenceKey,
} from '../storage/CodexSkillStorage';

export class CodexSkillModal extends Modal {
  private existing: ProviderCommandEntry | null;
  private onSave: (entry: ProviderCommandEntry) => Promise<void>;

  private _nameInput!: HTMLInputElement;
  private _descInput!: HTMLInputElement;
  private _contentArea!: HTMLTextAreaElement;
  private _selectedRootId: CodexSkillRootId;
  private _triggerSave!: () => Promise<void>;

  constructor(
    app: App,
    existing: ProviderCommandEntry | null,
    onSave: (entry: ProviderCommandEntry) => Promise<void>
  ) {
    super(app);
    this.existing = existing;
    this.onSave = onSave;
    this._selectedRootId = parseCodexSkillPersistenceKey(existing?.persistenceKey)?.rootId ?? 'vault-codex';
  }

  /** Exposed for unit tests only. */
  getTestInputs() {
    return {
      nameInput: this._nameInput,
      descInput: this._descInput,
      contentArea: this._contentArea,
      setDirectory: (rootId: CodexSkillRootId) => { this._selectedRootId = rootId; },
      triggerSave: this._triggerSave,
    };
  }

  onOpen() {
    this.setTitle(this.existing
      ? t('codex.skills.modal.titleEdit')
      : t('codex.skills.modal.titleAdd'));
    this.modalEl.addClass('codexian-sp-modal');

    const { contentEl } = this;

    new Setting(contentEl)
      .setName(t('codex.skills.modal.directory'))
      .setDesc(t('codex.skills.modal.directoryDesc'))
      .addDropdown(dropdown => {
        for (const opt of CODEX_SKILL_ROOT_OPTIONS) {
          dropdown.addOption(opt.id, opt.label);
        }
        dropdown.setValue(this._selectedRootId);
        dropdown.onChange(value => { this._selectedRootId = value as CodexSkillRootId; });
      });

    new Setting(contentEl)
      .setName(t('codex.skills.modal.name'))
      .setDesc(t('codex.skills.modal.nameDesc'))
      .addText(text => {
        this._nameInput = text.inputEl;
        text.setValue(this.existing?.name || '')
          .setPlaceholder('analyze-code'.toLocaleLowerCase());
      });

    new Setting(contentEl)
      .setName(t('codex.skills.modal.description'))
      .setDesc(t('codex.skills.modal.descriptionDesc'))
      .addText(text => {
        this._descInput = text.inputEl;
        text.setValue(this.existing?.description || '');
      });

    new Setting(contentEl)
      .setName(t('codex.skills.modal.instructions'))
      .setDesc(t('codex.skills.modal.instructionsDesc'));

    const contentArea = contentEl.createEl('textarea', {
      cls: 'codexian-sp-content-area',
      attr: { rows: '10', placeholder: t('codex.skills.modal.instructionsPlaceholder') },
    });
    contentArea.value = this.existing?.content || '';
    this._contentArea = contentArea;

    const doSave = async () => {
      const name = this._nameInput.value.trim();
      const nameError = validateCommandName(name);
      if (nameError) {
        new Notice(nameError);
        return;
      }

      const content = this._contentArea.value;
      if (!content.trim()) {
        new Notice(t('codex.skills.instructionsRequired'));
        return;
      }

      const entry: ProviderCommandEntry = {
        id: this.existing?.id || `codex-skill-${name}`,
        providerId: 'codex',
        kind: 'skill',
        name,
        description: this._descInput.value.trim() || undefined,
        content,
        scope: 'vault',
        source: 'user',
        isEditable: true,
        isDeletable: true,
        displayPrefix: '$',
        insertPrefix: '$',
        persistenceKey: createCodexSkillPersistenceKey({
          rootId: this._selectedRootId,
          ...(this.existing?.name ? { currentName: this.existing.name } : {}),
        }),
      };

      try {
        await this.onSave(entry);
      } catch {
        new Notice(t('codex.skills.saveFailed'));
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
    saveBtn.addEventListener('click', () => {
      runAsync(doSave);
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class CodexSkillSettings {
  private containerEl: HTMLElement;
  private catalog: ProviderCommandCatalog;
  private entries: ProviderCommandEntry[] = [];
  private app?: App;

  constructor(containerEl: HTMLElement, catalog: ProviderCommandCatalog, app?: App) {
    this.containerEl = containerEl;
    this.catalog = catalog;
    this.app = app;
    runAsync(() => this.render());
  }

  async deleteEntry(entry: ProviderCommandEntry): Promise<void> {
    await this.catalog.deleteVaultEntry(entry);
    await this.render();
  }

  async refresh(): Promise<void> {
    await this.catalog.refresh();
    await this.render();
  }

  async render(): Promise<void> {
    this.containerEl.empty();

    try {
      this.entries = await this.catalog.listVaultEntries();
    } catch {
      this.entries = [];
    }

    const headerEl = this.containerEl.createDiv({ cls: 'codexian-sp-header' });
    headerEl.createSpan({ text: t('codex.skills.header'), cls: 'codexian-sp-label' });

    const actionsEl = headerEl.createDiv({ cls: 'codexian-sp-header-actions' });
    const refreshBtn = actionsEl.createEl('button', {
      cls: 'codexian-settings-action-btn',
      attr: { 'aria-label': t('common.refresh') },
    });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.addEventListener('click', () => { void this.refresh(); });

    const addBtn = actionsEl.createEl('button', {
      cls: 'codexian-settings-action-btn',
      attr: { 'aria-label': t('common.add') },
    });
    setIcon(addBtn, 'plus');
    addBtn.addEventListener('click', () => this.openModal(null));

    if (this.entries.length === 0) {
      const emptyEl = this.containerEl.createDiv({ cls: 'codexian-sp-empty-state' });
      emptyEl.setText(t('codex.skills.empty'));
      return;
    }

    const listEl = this.containerEl.createDiv({ cls: 'codexian-sp-list' });
    for (const entry of this.entries) {
      this.renderItem(listEl, entry);
    }
  }

  private renderItem(listEl: HTMLElement, entry: ProviderCommandEntry): void {
    const itemEl = listEl.createDiv({ cls: 'codexian-sp-item' });
    const infoEl = itemEl.createDiv({ cls: 'codexian-sp-info' });

    const headerRow = infoEl.createDiv({ cls: 'codexian-sp-item-header' });
    const nameEl = headerRow.createSpan({ cls: 'codexian-sp-item-name' });
    nameEl.setText(`$${entry.name}`);
    headerRow.createSpan({ text: t('codex.skills.badge'), cls: 'codexian-slash-item-badge' });

    if (entry.description) {
      const descEl = infoEl.createDiv({ cls: 'codexian-sp-item-desc' });
      descEl.setText(entry.description);
    }

    const actionsEl = itemEl.createDiv({ cls: 'codexian-sp-item-actions' });

    if (entry.isEditable) {
      const editBtn = actionsEl.createEl('button', {
        cls: 'codexian-settings-action-btn',
        attr: { 'aria-label': t('common.edit') },
      });
      setIcon(editBtn, 'pencil');
      editBtn.addEventListener('click', () => this.openModal(entry));
    }

    if (entry.isDeletable) {
      const deleteBtn = actionsEl.createEl('button', {
        cls: 'codexian-settings-action-btn codexian-settings-delete-btn',
        attr: { 'aria-label': t('common.delete') },
      });
      setIcon(deleteBtn, 'trash-2');
      deleteBtn.addEventListener('click', () => {
        runAsync(async () => {
          await this.deleteEntry(entry);
          new Notice(t('codex.skills.deleted', { name: entry.name }));
        }, () => {
          new Notice(t('codex.skills.deleteFailed'));
        });
      });
    }
  }

  private openModal(existing: ProviderCommandEntry | null): void {
    if (!this.app) return;

    const modal = new CodexSkillModal(
      this.app,
      existing,
      async (entry) => {
        await this.catalog.saveVaultEntry(entry);
        await this.render();
        new Notice(t(
          existing
            ? 'codex.skills.updated'
            : 'codex.skills.saved',
          { name: entry.name },
        ));
      }
    );
    modal.open();
  }
}
