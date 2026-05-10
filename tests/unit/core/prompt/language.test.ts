import {
  buildInlineEditPrompt,
  getInlineEditSystemPrompt,
} from '@/core/prompt/inlineEdit';
import { buildRefineInstructionPrompt, buildRefineSystemPrompt } from '@/core/prompt/instructionRefine';
import {
  buildSystemPrompt,
  computeSystemPromptKey,
} from '@/core/prompt/mainAgent';
import {
  buildTitleGenerationPrompt,
  getTitleGenerationSystemPrompt,
} from '@/core/prompt/titleGeneration';
import { getObsidianLocale } from '@/i18n/obsidianLocale';

describe('prompt language localization', () => {
  it('builds the main agent system prompt in Simplified Chinese', () => {
    const prompt = buildSystemPrompt({
      locale: 'zh-CN',
      mediaFolder: 'attachments',
      customPrompt: '保持简洁。',
      vaultPath: '/Users/me/Vault',
      userName: 'HalfMelon',
    });

    expect(prompt).toContain('## 时间上下文');
    expect(prompt).toContain('你是 **Codexian**');
    expect(prompt).toContain('## 自定义指令');
    expect(prompt).not.toContain('## Time Context');
    expect(prompt).not.toContain('## Custom Instructions');
  });

  it('keeps the main agent system prompt in English by default', () => {
    const prompt = buildSystemPrompt({
      customPrompt: 'Stay concise.',
      vaultPath: '/Users/me/Vault',
    });

    expect(prompt).toContain('## Time Context');
    expect(prompt).toContain('You are **Codexian**');
    expect(prompt).toContain('## Custom Instructions');
    expect(prompt).not.toContain('## 时间上下文');
  });

  it('includes locale in the system prompt cache key', () => {
    const base = {
      mediaFolder: 'attachments',
      customPrompt: 'Keep notes tidy.',
      vaultPath: '/Users/me/Vault',
      userName: 'HalfMelon',
    };

    expect(computeSystemPromptKey({ ...base, locale: 'en' }))
      .not.toBe(computeSystemPromptKey({ ...base, locale: 'zh-CN' }));
  });

  it('builds inline edit prompts and system prompts in Simplified Chinese', () => {
    const systemPrompt = getInlineEditSystemPrompt('zh-CN');
    const userPrompt = buildInlineEditPrompt({
      mode: 'selection',
      instruction: '润色这段话',
      notePath: 'notes/draft.md',
      selectedText: '这是一段草稿。',
    }, 'zh-CN');

    expect(systemPrompt).toContain('你是 **Codexian**');
    expect(systemPrompt).toContain('## 核心指令');
    expect(systemPrompt).not.toContain('## Core Directives');
    expect(userPrompt).toContain('润色这段话');
    expect(userPrompt).toContain('<editor_selection path="notes/draft.md">');
  });

  it('builds instruction refinement prompts in Simplified Chinese', () => {
    const systemPrompt = buildRefineSystemPrompt('已有规则', 'zh-CN');
    const userPrompt = buildRefineInstructionPrompt('以后用中文回答', 'zh-CN');

    expect(systemPrompt).toContain('你是一名专业提示词工程师');
    expect(systemPrompt).toContain('现有指令');
    expect(systemPrompt).not.toContain('You are an expert Prompt Engineer');
    expect(userPrompt).toBe('请优化这条指令：“以后用中文回答”');
  });

  it('builds title generation prompts in Simplified Chinese', () => {
    const systemPrompt = getTitleGenerationSystemPrompt('zh-CN');
    const userPrompt = buildTitleGenerationPrompt('帮我整理知识库工作流', 'zh-CN');

    expect(systemPrompt).toContain('你擅长总结用户意图');
    expect(systemPrompt).not.toContain('You are a specialist in summarizing user intent');
    expect(userPrompt).toContain('用户请求：');
    expect(userPrompt).toContain('为这段对话生成一个标题：');
  });

  it('reads the Obsidian locale from the vault config for auto language mode', () => {
    expect(getObsidianLocale({
      vault: {
        getConfig: (key: string) => key === 'locale' ? 'zh-CN' : undefined,
      },
    })).toBe('zh-CN');
  });
});
