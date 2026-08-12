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
