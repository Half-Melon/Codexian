import type { Locale } from '../../i18n/types';

const MAX_TITLE_INPUT_LENGTH = 500;
const MAX_TITLE_LENGTH = 50;

export const TITLE_GENERATION_SYSTEM_PROMPT_EN = `You are a specialist in summarizing user intent.

**Task**: Generate a **concise, descriptive title** (max 50 chars) summarizing the user's task/request.

**Rules**:
1.  **Format**: Sentence case. No periods/quotes.
2.  **Structure**: Start with a **strong verb** (e.g., Create, Fix, Debug, Explain, Analyze).
3.  **Forbidden**: "Conversation with...", "Help me...", "Question about...", "I need...".
4.  **Tech Context**: Detect and include the primary language/framework if code is present (e.g., "Debug Python script", "Refactor React hook").

**Output**: Return ONLY the raw title text.`;

export const TITLE_GENERATION_SYSTEM_PROMPT = TITLE_GENERATION_SYSTEM_PROMPT_EN;

const TITLE_GENERATION_SYSTEM_PROMPT_ZH_CN = `你擅长总结用户意图。

**任务**：生成一个**简洁、描述性强的标题**（最多 50 个字符），总结用户的任务或请求。

**规则**：
1.  **格式**：使用自然标题，不要句号或引号。
2.  **结构**：以明确动作开头，例如“创建”“修复”“调试”“解释”“分析”。
3.  **禁止**：不要使用“与...的对话”“帮我...”“关于...的问题”“我需要...”。
4.  **技术上下文**：如果请求中包含代码，识别并加入主要语言或框架，例如“调试 Python 脚本”“重构 React hook”。

**输出**：只返回原始标题文本。`;

function isChineseLocale(locale: Locale | undefined): boolean {
  return locale === 'zh-CN';
}

export function getTitleGenerationSystemPrompt(locale: Locale = 'en'): string {
  return isChineseLocale(locale) ? TITLE_GENERATION_SYSTEM_PROMPT_ZH_CN : TITLE_GENERATION_SYSTEM_PROMPT_EN;
}

export function buildTitleGenerationPrompt(userMessage: string, locale: Locale = 'en'): string {
  const truncated = userMessage.length > MAX_TITLE_INPUT_LENGTH
    ? `${userMessage.slice(0, MAX_TITLE_INPUT_LENGTH)}...`
    : userMessage;
  if (isChineseLocale(locale)) {
    return `用户请求：\n"""\n${truncated}\n"""\n\n为这段对话生成一个标题：`;
  }
  return `User's request:\n"""\n${truncated}\n"""\n\nGenerate a title for this conversation:`;
}

export function parseTitleGenerationResponse(responseText: string): string | null {
  const trimmed = responseText.trim();
  if (!trimmed) {
    return null;
  }

  let title = trimmed;
  if (
    (title.startsWith('"') && title.endsWith('"'))
    || (title.startsWith("'") && title.endsWith("'"))
  ) {
    title = title.slice(1, -1);
  }

  title = title.replace(/[.!?:;,]+$/, '');

  if (title.length > MAX_TITLE_LENGTH) {
    title = `${title.slice(0, MAX_TITLE_LENGTH - 3)}...`;
  }

  return title || null;
}
