export function updateContextRowHasContent(contextRowEl: HTMLElement): void {
  const editorIndicator = contextRowEl.querySelector('.codexidian-selection-indicator') as HTMLElement | null;
  const browserIndicator = contextRowEl.querySelector('.codexidian-browser-selection-indicator') as HTMLElement | null;
  const canvasIndicator = contextRowEl.querySelector('.codexidian-canvas-indicator') as HTMLElement | null;
  const fileIndicator = contextRowEl.querySelector('.codexidian-file-indicator') as HTMLElement | null;
  const imagePreview = contextRowEl.querySelector('.codexidian-image-preview') as HTMLElement | null;

  const hasEditorSelection = editorIndicator?.style.display === 'block';
  const hasBrowserSelection = browserIndicator !== null && browserIndicator.style.display === 'block';
  const hasCanvasSelection = canvasIndicator?.style.display === 'block';
  const hasFileChips = fileIndicator?.style.display === 'flex';
  const hasImageChips = imagePreview?.style.display === 'flex';

  contextRowEl.classList.toggle(
    'has-content',
    hasEditorSelection || hasBrowserSelection || hasCanvasSelection || hasFileChips || hasImageChips
  );
}
