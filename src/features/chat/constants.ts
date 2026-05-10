/** Random flavor words shown when response completes (e.g., "Baked for 1:23"). */
const EN_COMPLETION_FLAVOR_WORDS = [
  'Baked',
  'Cooked',
  'Crunched',
  'Brewed',
  'Crafted',
  'Forged',
  'Conjured',
  'Whipped up',
  'Stirred',
  'Simmered',
  'Toasted',
  'Sautéed',
  'Finagled',
  'Marinated',
  'Distilled',
  'Fermented',
  'Percolated',
  'Steeped',
  'Roasted',
  'Cured',
  'Smoked',
  'Cogitated',
] as const;

const ZH_CN_COMPLETION_FLAVOR_WORDS = [
  '完成',
  '整理',
  '处理',
  '分析',
  '生成',
  '写好',
  '归纳',
  '推演',
  '编排',
  '打磨',
] as const;

/** Random flavor texts shown while Codex is thinking. */
const EN_FLAVOR_TEXTS = [
  // Classic
  'Thinking...',
  'Pondering...',
  'Processing...',
  'Analyzing...',
  'Considering...',
  'Working on it...',
  'Vibing...',
  'One moment...',
  'On it...',
  // Thoughtful
  'Ruminating...',
  'Contemplating...',
  'Reflecting...',
  'Mulling it over...',
  'Let me think...',
  'Hmm...',
  'Cogitating...',
  'Deliberating...',
  'Weighing options...',
  'Gathering thoughts...',
  // Playful
  'Brewing ideas...',
  'Connecting dots...',
  'Assembling thoughts...',
  'Spinning up neurons...',
  'Loading brilliance...',
  'Consulting the oracle...',
  'Summoning knowledge...',
  'Crunching thoughts...',
  'Dusting off neurons...',
  'Wrangling ideas...',
  'Herding thoughts...',
  'Juggling concepts...',
  'Untangling this...',
  'Piecing it together...',
  // Cozy
  'Sipping coffee...',
  'Warming up...',
  'Getting cozy with this...',
  'Settling in...',
  'Making tea...',
  'Grabbing a snack...',
  // Technical
  'Parsing...',
  'Compiling thoughts...',
  'Running inference...',
  'Querying the void...',
  'Defragmenting brain...',
  'Allocating memory...',
  'Optimizing...',
  'Indexing...',
  'Syncing neurons...',
  // Zen
  'Breathing...',
  'Finding clarity...',
  'Channeling focus...',
  'Centering...',
  'Aligning chakras...',
  'Meditating on this...',
  // Whimsical
  'Asking the stars...',
  'Reading tea leaves...',
  'Shaking the magic 8-ball...',
  'Consulting ancient scrolls...',
  'Decoding the matrix...',
  'Communing with the ether...',
  'Peering into the abyss...',
  'Channeling the cosmos...',
  // Action
  'Diving in...',
  'Rolling up sleeves...',
  'Getting to work...',
  'Tackling this...',
  'On the case...',
  'Investigating...',
  'Exploring...',
  'Digging deeper...',
  // Casual
  'Bear with me...',
  'Hang tight...',
  'Just a sec...',
  'Working my magic...',
  'Almost there...',
  'Give me a moment...',
] as const;

const ZH_CN_FLAVOR_TEXTS = [
  '思考中...',
  '处理中...',
  '分析中...',
  '整理上下文...',
  '正在推理...',
  '正在检查...',
  '正在组织答案...',
  '稍等一下...',
  '正在执行...',
  '正在汇总...',
] as const;

export function getCompletionFlavorWords(locale: string): readonly string[] {
  return locale.toLowerCase().startsWith('zh')
    ? ZH_CN_COMPLETION_FLAVOR_WORDS
    : EN_COMPLETION_FLAVOR_WORDS;
}

export function getThinkingFlavorTexts(locale: string): readonly string[] {
  return locale.toLowerCase().startsWith('zh')
    ? ZH_CN_FLAVOR_TEXTS
    : EN_FLAVOR_TEXTS;
}
