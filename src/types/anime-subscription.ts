export interface AnimeSubscription {
  id: string;
  title: string;
  filterText: string;
  excludeText?: string;
  episodeRegex?: string;
  source: 'acgrip' | 'mikan' | 'dmhy' | 'nyaa';
  enabled: boolean;
  lastCheckTime: number;
  lastEpisode: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export type AnimeSubscriptionDownloadTool = 'aria2' | 'qBittorrent' | 'Transmission';

/** 集数过滤测试的单条结果 */
export interface EpisodeTestItem {
  title: string;
  episode: number | null;
}

/** 集数过滤测试结果（/api/admin/anime-subscription/test） */
export interface EpisodeTestResult {
  /** 搜索到的种子总数 */
  total: number;
  /** 过滤/排除关键词命中的条数 */
  matched: number;
  /** 测试时使用的当前集数（结果按此计算，不随表单变动） */
  lastEpisode: number;
  /** 提取到的去重集数（升序） */
  episodes: number[];
  /** 大于当前集数（会触发下载）的集数 */
  newEpisodes: number[];
  /** 命中但未能提取集数的条数 */
  unparsed: number;
  /** 命中的种子明细（按集数升序，未解析在最后） */
  items: EpisodeTestItem[];
}

export interface AnimeSubscriptionConfig {
  Enabled: boolean;
  DownloadTool?: AnimeSubscriptionDownloadTool;
  Subscriptions: AnimeSubscription[];
}
