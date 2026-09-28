const ANIME_KEYWORDS = [
  '动漫',
  '动画',
  '番剧',
  '新番',
  '二次元',
  'bangumi',
  'anime',
  'anima',
  'cartoon',
  'acg',
];

/**
 * 根据一个或多个分类文本做轻量启发式判断。
 * 兼容调用方传入多个候选字段（如 type_name, class）。
 */
export function isAnimeCategoryText(
  ...categoryTexts: Array<string | null | undefined>
): boolean {
  if (!categoryTexts.length) return false;

  const normalized = categoryTexts
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .join(' ');

  if (!normalized) return false;
  return ANIME_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function validateKeywordExpr(
  expr: string,
  mode: 'and' | 'or' = 'and'
): { ok: boolean; error?: string } {
  const value = (expr || '').trim();
  if (!value) {
    return { ok: false, error: '表达式不能为空' };
  }

  const tokens = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return { ok: false, error: '请至少提供一个关键词' };
  }

  if (mode === 'and' && tokens.length > 16) {
    return { ok: false, error: '关键词过多，请控制在 16 个以内' };
  }

  if (tokens.some((item) => item.length > 100)) {
    return { ok: false, error: '单个关键词过长（最多 100 字符）' };
  }

  return { ok: true };
}
