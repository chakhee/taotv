export const DEFAULT_PROXY_CACHE_MINUTES = 60;

export interface OpenListPathMetaResolved {
  refresh14m: boolean;
  proxyPlay: boolean;
  proxyCacheMinutes: number;
}

interface OpenListPathMetaConfig {
  path?: string;
  refresh14m?: boolean;
  proxyPlay?: boolean;
  proxyCacheMinutes?: number;
}

const DEFAULT_RESOLVED: OpenListPathMetaResolved = {
  refresh14m: false,
  proxyPlay: false,
  proxyCacheMinutes: DEFAULT_PROXY_CACHE_MINUTES,
};

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function normalizePath(value: string): string {
  const p = value.trim().replace(/\\/g, '/');
  if (!p) return '/';
  return p.startsWith('/') ? p : `/${p}`;
}

function matchPath(folderPath: string, rulePath: string): boolean {
  const target = normalizePath(folderPath);
  const rule = normalizePath(rulePath);
  return target === rule || target.startsWith(`${rule}/`);
}

function asRuleArray(pathMeta: unknown): OpenListPathMetaConfig[] {
  if (Array.isArray(pathMeta)) {
    return pathMeta.filter((item): item is OpenListPathMetaConfig => !!item && typeof item === 'object');
  }

  if (!pathMeta || typeof pathMeta !== 'object') {
    return [];
  }

  const entries = Object.entries(pathMeta as Record<string, unknown>);
  return entries
    .filter(([, value]) => !!value && typeof value === 'object')
    .map(([path, value]) => ({ path, ...(value as Record<string, unknown>) }));
}

export function resolvePathMeta(
  folderPath: string,
  pathMeta: unknown
): OpenListPathMetaResolved {
  const rules = asRuleArray(pathMeta)
    .map((rule) => ({ ...rule, path: rule.path ? normalizePath(rule.path) : undefined }))
    .filter((rule) => Boolean(rule.path));

  // Pick the most specific matched rule (longest path) when multiple rules match.
  const matched = rules
    .filter((rule) => matchPath(folderPath, rule.path!))
    .sort((a, b) => b.path!.length - a.path!.length)[0];

  if (!matched) return DEFAULT_RESOLVED;

  return {
    refresh14m: Boolean(matched.refresh14m),
    proxyPlay: Boolean(matched.proxyPlay),
    proxyCacheMinutes: toPositiveInt(
      matched.proxyCacheMinutes,
      DEFAULT_PROXY_CACHE_MINUTES
    ),
  };
}
