'use client';

export type AnimeDataSource = 'direct' | 'server-proxy' | 'custom-baseurl';

export interface BangumiCalendarData {
  weekday: {
    en: string;
  };
  items: {
    id: number;
    name: string;
    name_cn: string;
    rating: {
      score: number;
    };
    air_date: string;
    images: {
      large: string;
      common: string;
      medium: string;
      small: string;
      grid: string;
    };
  }[];
}

export interface BangumiSubjectData {
  id?: number;
  name: string;
  name_cn?: string;
  date?: string;
  images?: {
    large?: string;
    common?: string;
    medium?: string;
    small?: string;
    grid?: string;
  };
  rating?: {
    score: number;
    total: number;
  };
  summary?: string;
  tags?: { name: string }[];
  eps?: number;
}

// 时刻表（每日放送）数据结构 —— 对应 /api/bangumi/schedule
export interface BangumiScheduleItem {
  id: string;
  name: string;
  name_cn: string;
  /** BGM 星期约定：0=周一 .. 6=周日。未知放送时间的条目也带星期 */
  weekday: number;
  /** 北京时间 HH:MM，仅匹配到精确放送时刻的条目有 */
  time?: string;
  /** 评分文本（一位小数），如 "8.1" */
  rating?: string;
  air_date?: string;
  images?: {
    large?: string;
    common?: string;
    medium?: string;
    small?: string;
    grid?: string;
  };
}

export interface BangumiScheduleSlot {
  time: string;
  items: BangumiScheduleItem[];
}

export interface BangumiScheduleDay {
  en: string;
  cn: string;
  slots: BangumiScheduleSlot[];
  /** 该日未知放送时间（BGM 有星期但匹配不到精确时刻）的条目 */
  unknown: BangumiScheduleItem[];
}

export interface BangumiScheduleData {
  generatedAt: number;
  season: string;
  year: number;
  days: BangumiScheduleDay[];
  /** 未知放送时间（匹配不到 LiveChart 的条目），展示在最底部 */
  unknown: BangumiScheduleItem[];
}

const BANGUMI_OFFICIAL_BASE_URL = 'https://api.bgm.tv';
const SERVER_PROXY_BASE_URL = '/api/bangumi';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function getRuntimeConfig() {
  if (typeof window === 'undefined') return {} as any;
  return (window as any).RUNTIME_CONFIG || {};
}

function getPrimaryAnimeDataSource(): AnimeDataSource {
  if (typeof window === 'undefined') return 'direct';

  const saved = localStorage.getItem(
    'animeDataSource'
  ) as AnimeDataSource | null;
  if (
    saved === 'direct' ||
    saved === 'server-proxy' ||
    saved === 'custom-baseurl'
  ) {
    return saved;
  }

  const runtimeValue = getRuntimeConfig().BANGUMI_DATA_SOURCE as
    | AnimeDataSource
    | undefined;
  if (
    runtimeValue === 'direct' ||
    runtimeValue === 'server-proxy' ||
    runtimeValue === 'custom-baseurl'
  ) {
    return runtimeValue;
  }

  return 'direct';
}

function getBackupAnimeDataSource(
  primary: AnimeDataSource
): AnimeDataSource | null {
  if (typeof window === 'undefined')
    return primary === 'server-proxy' ? null : 'server-proxy';

  const saved = localStorage.getItem(
    'animeDataSourceBackup'
  ) as AnimeDataSource | null;
  const backup =
    saved === 'direct' || saved === 'server-proxy' || saved === 'custom-baseurl'
      ? saved
      : 'server-proxy';

  return backup === primary ? null : backup;
}

function getCustomAnimeBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('animeCustomBaseUrl') || '';
}

function buildBangumiUrl(source: AnimeDataSource, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  switch (source) {
    case 'server-proxy':
      return `${SERVER_PROXY_BASE_URL}${normalizedPath}`;
    case 'custom-baseurl': {
      const customBaseUrl = normalizeBaseUrl(getCustomAnimeBaseUrl());
      if (!customBaseUrl) {
        return `${BANGUMI_OFFICIAL_BASE_URL}${normalizedPath}`;
      }
      return `${customBaseUrl}${normalizedPath}`;
    }
    case 'direct':
    default:
      return `${BANGUMI_OFFICIAL_BASE_URL}${normalizedPath}`;
  }
}

async function fetchBangumiJson<T>(
  source: AnimeDataSource,
  path: string
): Promise<T> {
  const response = await fetch(buildBangumiUrl(source, path), {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Bangumi 请求失败: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestWithFallback<T>(path: string): Promise<T> {
  const primary = getPrimaryAnimeDataSource();
  const backup = getBackupAnimeDataSource(primary);

  try {
    return await fetchBangumiJson<T>(primary, path);
  } catch (primaryError) {
    if (!backup) throw primaryError;

    try {
      return await fetchBangumiJson<T>(backup, path);
    } catch (backupError) {
      console.error('Bangumi 主源与备用源均请求失败:', {
        primary,
        backup,
        primaryError,
        backupError,
      });
      throw backupError;
    }
  }
}

const BANGUMI_CALENDAR_CACHE_KEY = 'homepage_bangumi';
const BANGUMI_CALENDAR_CACHE_TTL = 60 * 60 * 1000;

function readBangumiCalendarCache(): BangumiCalendarData[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(BANGUMI_CALENDAR_CACHE_KEY);
    if (!raw) return null;

    const { data, timestamp } = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    if (Date.now() - timestamp > BANGUMI_CALENDAR_CACHE_TTL) return null;

    return data;
  } catch {
    return null;
  }
}

function writeBangumiCalendarCache(data: BangumiCalendarData[]): void {
  if (typeof window === 'undefined' || !Array.isArray(data) || data.length === 0) {
    return;
  }

  try {
    localStorage.setItem(
      BANGUMI_CALENDAR_CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // localStorage 不可用时忽略
  }
}

export async function GetBangumiCalendarData(): Promise<BangumiCalendarData[]> {
  const cached = readBangumiCalendarCache();
  if (cached) return cached;

  const data = await requestWithFallback<BangumiCalendarData[]>('/calendar');
  writeBangumiCalendarCache(data);
  return data;
}

export async function getBangumiSubject(
  id: number | string
): Promise<BangumiSubjectData> {
  return requestWithFallback<BangumiSubjectData>(
    `/v0/subjects/${encodeURIComponent(String(id))}`
  );
}

export function getBangumiSubjectUrl(id: number | string): string {
  return `https://bgm.tv/subject/${encodeURIComponent(String(id))}`;
}
