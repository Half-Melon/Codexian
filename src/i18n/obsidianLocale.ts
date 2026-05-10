export function getObsidianLocale(app: unknown): string | undefined {
  const vault = app && typeof app === 'object'
    ? (app as { vault?: unknown }).vault
    : undefined;
  const getConfig = vault && typeof vault === 'object'
    ? (vault as { getConfig?: (key: string) => unknown }).getConfig
    : undefined;
  const locale = getConfig?.call(vault, 'locale');
  return typeof locale === 'string' ? locale : undefined;
}
