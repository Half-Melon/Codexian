import { isElementVisible } from '../../../utils/dom';

export function updateContextRowHasContent(contextRowEl: HTMLElement): void {
  const editorIndicator = contextRowEl.querySelector('.codexian-selection-indicator');
  const browserIndicator = contextRowEl.querySelector('.codexian-browser-selection-indicator');
  const canvasIndicator = contextRowEl.querySelector('.codexian-canvas-indicator');
  const fileIndicator = contextRowEl.querySelector('.codexian-file-indicator');
  const imagePreview = contextRowEl.querySelector('.codexian-image-preview');

  const hasEditorSelection = isElementVisible(editorIndicator);
  const hasBrowserSelection = isElementVisible(browserIndicator);
  const hasCanvasSelection = isElementVisible(canvasIndicator);
  const hasFileChips = isElementVisible(fileIndicator);
  const hasImageChips = isElementVisible(imagePreview);

  contextRowEl.classList.toggle(
    'has-content',
    hasEditorSelection || hasBrowserSelection || hasCanvasSelection || hasFileChips || hasImageChips
  );
}
