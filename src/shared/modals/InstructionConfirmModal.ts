/**
 * Codexian - Instruction modal
 *
 * Unified modal that handles all instruction mode states:
 * - Loading (initial processing)
 * - Clarification (agent asks question)
 * - Confirmation (final instruction review)
 */

import type { App } from 'obsidian';
import { Modal, TextAreaComponent } from 'obsidian';

import { t } from '../../i18n/i18n';
import type { TranslationKey } from '../../i18n/types';

export type InstructionDecision = 'accept' | 'reject';

type ModalState = 'loading' | 'clarification' | 'confirmation';

export interface InstructionModalCallbacks {
  onAccept: (finalInstruction: string) => void;
  onReject: () => void;
  onClarificationSubmit: (response: string) => Promise<void>;
}

export class InstructionModal extends Modal {
  private rawInstruction: string;
  private callbacks: InstructionModalCallbacks;
  private state: ModalState = 'loading';
  private resolved = false;

  // UI elements
  private contentSectionEl: HTMLElement | null = null;
  private loadingEl: HTMLElement | null = null;
  private clarificationEl: HTMLElement | null = null;
  private confirmationEl: HTMLElement | null = null;
  private buttonsEl: HTMLElement | null = null;

  // Clarification state
  private clarificationTextEl: HTMLElement | null = null;
  private responseTextarea: TextAreaComponent | null = null;
  private isSubmitting = false;

  // Confirmation state
  private refinedInstruction: string = '';
  private editTextarea: TextAreaComponent | null = null;
  private isEditing = false;
  private refinedDisplayEl: HTMLElement | null = null;
  private editContainerEl: HTMLElement | null = null;
  private editBtnEl: HTMLButtonElement | null = null;

  constructor(
    app: App,
    rawInstruction: string,
    callbacks: InstructionModalCallbacks
  ) {
    super(app);
    this.rawInstruction = rawInstruction;
    this.callbacks = callbacks;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('codexian-instruction-modal');
    this.setTitle(t('inlineInstruction.title' as TranslationKey));

    // User input section (always visible)
    const inputSection = contentEl.createDiv({ cls: 'codexian-instruction-section' });
    const inputLabel = inputSection.createDiv({ cls: 'codexian-instruction-label' });
    inputLabel.setText(t('inlineInstruction.yourInput' as TranslationKey));
    const inputText = inputSection.createDiv({ cls: 'codexian-instruction-original' });
    inputText.setText(this.rawInstruction);

    // Main content section (changes based on state)
    this.contentSectionEl = contentEl.createDiv({ cls: 'codexian-instruction-content-section' });

    // Loading state
    this.loadingEl = this.contentSectionEl.createDiv({ cls: 'codexian-instruction-loading' });
    this.loadingEl.createDiv({ cls: 'codexian-instruction-spinner' });
    this.loadingEl.createSpan({ text: t('inlineInstruction.processing' as TranslationKey) });

    // Clarification state (hidden initially)
    this.clarificationEl = this.contentSectionEl.createDiv({ cls: 'codexian-instruction-clarification-section' });
    this.clarificationEl.style.display = 'none';
    this.clarificationTextEl = this.clarificationEl.createDiv({ cls: 'codexian-instruction-clarification' });

    const responseSection = this.clarificationEl.createDiv({ cls: 'codexian-instruction-section' });
    const responseLabel = responseSection.createDiv({ cls: 'codexian-instruction-label' });
    responseLabel.setText(t('inlineInstruction.yourResponse' as TranslationKey));

    this.responseTextarea = new TextAreaComponent(responseSection);
    this.responseTextarea.inputEl.addClass('codexian-instruction-response-textarea');
    this.responseTextarea.inputEl.rows = 3;
    this.responseTextarea.inputEl.placeholder = t('inlineInstruction.responsePlaceholder' as TranslationKey);

    this.responseTextarea.inputEl.addEventListener('keydown', (e) => {
      // Check !e.isComposing for IME support (Chinese, Japanese, Korean, etc.)
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !this.isSubmitting) {
        e.preventDefault();
        this.submitClarification();
      }
    });

    // Confirmation state (hidden initially)
    this.confirmationEl = this.contentSectionEl.createDiv({ cls: 'codexian-instruction-confirmation-section' });
    this.confirmationEl.style.display = 'none';

    // Refined instruction display/edit
    const refinedSection = this.confirmationEl.createDiv({ cls: 'codexian-instruction-section' });
    const refinedLabel = refinedSection.createDiv({ cls: 'codexian-instruction-label' });
    refinedLabel.setText(t('inlineInstruction.refinedSnippet' as TranslationKey));

    this.refinedDisplayEl = refinedSection.createDiv({ cls: 'codexian-instruction-refined' });
    this.editContainerEl = refinedSection.createDiv({ cls: 'codexian-instruction-edit-container' });
    this.editContainerEl.style.display = 'none';

    this.editTextarea = new TextAreaComponent(this.editContainerEl);
    this.editTextarea.inputEl.addClass('codexian-instruction-edit-textarea');
    this.editTextarea.inputEl.rows = 4;

    // Buttons (changes based on state)
    this.buttonsEl = contentEl.createDiv({ cls: 'codexian-instruction-buttons' });
    this.updateButtons();

    this.showState('loading');
  }

  showClarification(clarification: string) {
    if (this.clarificationTextEl) {
      this.clarificationTextEl.setText(clarification);
    }
    if (this.responseTextarea) {
      this.responseTextarea.setValue('');
    }
    this.isSubmitting = false;
    this.showState('clarification');
    this.responseTextarea?.inputEl.focus();
  }

  showConfirmation(refinedInstruction: string) {
    this.refinedInstruction = refinedInstruction;

    if (this.refinedDisplayEl) {
      this.refinedDisplayEl.setText(refinedInstruction);
    }
    if (this.editTextarea) {
      this.editTextarea.setValue(refinedInstruction);
    }

    this.showState('confirmation');
  }

  showError(error: string) {
    // Just close - the error notice will be shown by caller
    this.resolved = true;
    this.close();
  }

  showClarificationLoading() {
    this.isSubmitting = true;
    if (this.loadingEl) {
      this.loadingEl.querySelector('.codexian-instruction-spinner');
      const text = this.loadingEl.querySelector('span');
      if (text) text.textContent = t('common.loading');
    }
    this.showState('loading');
  }

  private showState(state: ModalState) {
    this.state = state;

    if (this.loadingEl) {
      this.loadingEl.style.display = state === 'loading' ? 'flex' : 'none';
    }
    if (this.clarificationEl) {
      this.clarificationEl.style.display = state === 'clarification' ? 'block' : 'none';
    }
    if (this.confirmationEl) {
      this.confirmationEl.style.display = state === 'confirmation' ? 'block' : 'none';
    }

    this.updateButtons();
  }

  private updateButtons() {
    if (!this.buttonsEl) return;
    this.buttonsEl.empty();

    const cancelBtn = this.buttonsEl.createEl('button', {
      text: t('common.cancel'),
      cls: 'codexian-instruction-btn codexian-instruction-reject-btn',
      attr: { 'aria-label': t('common.cancel') }
    });
    cancelBtn.addEventListener('click', () => this.handleReject());

    if (this.state === 'clarification') {
      const submitBtn = this.buttonsEl.createEl('button', {
        text: t('inlineInstruction.submit' as TranslationKey),
        cls: 'codexian-instruction-btn codexian-instruction-accept-btn',
        attr: { 'aria-label': t('inlineInstruction.submitResponse' as TranslationKey) }
      });
      submitBtn.addEventListener('click', () => this.submitClarification());
    } else if (this.state === 'confirmation') {
      this.editBtnEl = this.buttonsEl.createEl('button', {
        text: t('common.edit'),
        cls: 'codexian-instruction-btn codexian-instruction-edit-btn',
        attr: { 'aria-label': t('inlineInstruction.editInstruction' as TranslationKey) }
      });
      this.editBtnEl.addEventListener('click', () => this.toggleEdit());

      const acceptBtn = this.buttonsEl.createEl('button', {
        text: t('inlineInstruction.acceptInstruction' as TranslationKey),
        cls: 'codexian-instruction-btn codexian-instruction-accept-btn',
        attr: { 'aria-label': t('inlineInstruction.acceptInstruction' as TranslationKey) }
      });
      acceptBtn.addEventListener('click', () => this.handleAccept());
      acceptBtn.focus();
    }
  }

  private async submitClarification() {
    const response = this.responseTextarea?.getValue().trim();
    if (!response || this.isSubmitting) return;

    this.showClarificationLoading();

    try {
      await this.callbacks.onClarificationSubmit(response);
    } catch {
      // On error, go back to clarification state
      this.isSubmitting = false;
      this.showState('clarification');
    }
  }

  private toggleEdit() {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      if (this.refinedDisplayEl) this.refinedDisplayEl.style.display = 'none';
      if (this.editContainerEl) this.editContainerEl.style.display = 'block';
      if (this.editBtnEl) this.editBtnEl.setText(t('inlineInstruction.preview' as TranslationKey));
      this.editTextarea?.inputEl.focus();
    } else {
      const edited = this.editTextarea?.getValue() || this.refinedInstruction;
      this.refinedInstruction = edited;
      if (this.refinedDisplayEl) {
        this.refinedDisplayEl.setText(edited);
        this.refinedDisplayEl.style.display = 'block';
      }
      if (this.editContainerEl) this.editContainerEl.style.display = 'none';
      if (this.editBtnEl) this.editBtnEl.setText(t('common.edit'));
    }
  }

  private handleAccept() {
    if (this.resolved) return;
    this.resolved = true;

    const finalInstruction = this.isEditing
      ? (this.editTextarea?.getValue() || this.refinedInstruction)
      : this.refinedInstruction;

    this.callbacks.onAccept(finalInstruction);
    this.close();
  }

  private handleReject() {
    if (this.resolved) return;
    this.resolved = true;
    this.callbacks.onReject();
    this.close();
  }

  onClose() {
    if (!this.resolved) {
      this.resolved = true;
      this.callbacks.onReject();
    }
    this.contentEl.empty();
  }
}
