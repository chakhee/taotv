'use client';

import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type AnimeSource = 'acgrip' | 'mikan' | 'dmhy' | 'nyaa';

interface AnimeSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialLastEpisode?: number;
  onSuccess?: () => void;
}

export default function AnimeSubscribeModal({
  isOpen,
  onClose,
  initialTitle = '',
  initialLastEpisode = 0,
  onSuccess,
}: AnimeSubscribeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [filterText, setFilterText] = useState('');
  const [lastEpisode, setLastEpisode] = useState(0);
  const [source, setSource] = useState<AnimeSource>('mikan');
  const [enabled, setEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const seedTitle = initialTitle || '';
    setTitle(seedTitle);
    setFilterText(seedTitle);
    setLastEpisode(Number.isFinite(initialLastEpisode) ? Math.max(0, initialLastEpisode) : 0);
    setSource('mikan');
    setEnabled(true);
    setSubmitting(false);
    setError('');
  }, [isOpen, initialTitle, initialLastEpisode]);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && filterText.trim().length > 0 && !submitting;
  }, [title, filterText, submitting]);

  /** 智能识别：按番剧名在当前源搜一次，对结果做字幕组 × 字幕形态分组 */
  const handleRecognize = async () => {
    const keyword = form.title.trim();
    if (!keyword) {
      setRecognizeError('请先填写番剧名称');
      return;
    }
    try {
      setRecognizing(true);
      setRecognizeError('');
      const res = await fetch('/api/admin/anime-subscription/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: keyword, source: form.source }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '智能识别失败');
      }
      const data: FansubRecognizeResult = await res.json();
      setRecognition(data);
    } catch (e) {
      setRecognition(null);
      setRecognizeError(e instanceof Error ? e.message : '智能识别失败');
    } finally {
      setRecognizing(false);
    }
  };

  /** 点击识别结果：将「字幕组&字幕形态」写入过滤关键词（替换） */
  const applyRecognition = (fansub: FansubRecognition, variant: FansubVariant) => {
    setForm((prev) => ({
      ...prev,
      filterText: buildFilterTextFromRecognition(
        fansub.fansubFilter,
        variant.filter
      ),
    }));
  };

  /** 校验自定义集数正则（客户端快速反馈） */
  const checkEpisodeRegex = (regex: string): string | null => {
    const trimmed = regex.trim();
    if (!trimmed) return null;
    try {
      // eslint-disable-next-line no-new
      new RegExp(trimmed);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : '正则无效';
    }
  };

  /** 测试：按当前表单实际搜索一次，展示关键词命中与集数提取结果 */
  const handleTest = async () => {
    const keyword = form.title.trim();
    if (!keyword) {
      setTestError('请先填写番剧名称');
      return;
    }
    if (!form.filterText.trim()) {
      setTestError('请先填写过滤关键词');
      return;
    }
    const regexError = checkEpisodeRegex(form.episodeRegex);
    if (regexError) {
      setTestError(`集数正则无效: ${regexError}`);
      return;
    }
    try {
      setTesting(true);
      setTestError('');
      const res = await fetch('/api/admin/anime-subscription/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: keyword,
          filterText: form.filterText.trim(),
          excludeText: form.excludeText.trim(),
          source: form.source,
          episodeRegex: form.episodeRegex.trim(),
          lastEpisode: form.lastEpisode,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '测试失败');
      }
      const data: EpisodeTestResult = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult(null);
      setTestError(e instanceof Error ? e.message : '测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/anime-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          filterText: filterText.trim(),
          source,
          enabled,
          lastEpisode: Math.max(0, Number(lastEpisode) || 0),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || '添加追番订阅失败');
      }

      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加追番订阅失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className='fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4'>
      <div className='w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900'>
        <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700'>
          <h3 className='text-base font-semibold text-gray-900 dark:text-gray-100'>添加追番订阅</h3>
          <button
            type='button'
            onClick={onClose}
            className='rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            aria-label='关闭'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='space-y-3 p-4'>
          <div>
            <label className='mb-1 block text-sm text-gray-700 dark:text-gray-300'>标题</label>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-pink-500 dark:focus:ring-pink-900/50'
              placeholder='例如：某某动画'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-700 dark:text-gray-300'>过滤关键词</label>
            <input
              type='text'
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-pink-500 dark:focus:ring-pink-900/50'
              placeholder='用于检索资源的关键词'
            />
          </div>

          <div>
            <div className='flex items-center justify-between mb-1'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                集数提取正则
              </label>
              <button
                type='button'
                onClick={handleTest}
                disabled={testing}
                title='按当前表单实际搜索一次，查看能过滤到哪些集数'
                className='flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border border-blue-300 dark:border-blue-500/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50'
              >
                {testing ? (
                  <Loader2 size={12} className='animate-spin' />
                ) : (
                  <FlaskConical size={12} />
                )}
                测试
              </button>
            </div>
            <input
              value={form.episodeRegex}
              onChange={(e) => setForm({ ...form, episodeRegex: e.target.value })}
              className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm'
              placeholder='第(\d{1,3})[话話集]'
            />
            <p className='mt-1 text-[11px] text-gray-400'>
              可选；首个捕获组将作为集数，留空使用内置规则
            </p>
            {testError ? (
              <p className='mt-1 text-xs text-red-600 dark:text-red-400'>
                {testError}
              </p>
            ) : null}
            {testResult ? (
              <div className='mt-2 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <p className='text-[11px] text-gray-500 dark:text-gray-400'>
                    搜索到 {testResult.total} 条 · 关键词命中 {testResult.matched} 条
                  </p>
                  <button
                    type='button'
                    onClick={() => setTestResult(null)}
                    className='p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  >
                    <X size={12} />
                  </button>
                </div>
                {testResult.matched === 0 ? (
                  <p className='text-xs text-gray-400'>没有种子命中过滤条件</p>
                ) : (
                  <>
                    <div className='flex flex-wrap gap-1.5'>
                      {testResult.episodes.map((ep) => {
                        const isNew = testResult.newEpisodes.includes(ep);
                        return (
                          <span
                            key={ep}
                            className={`px-2 py-0.5 text-xs rounded-full border ${
                              isNew
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                            }`}
                            title={isNew ? '新集数，会触发下载' : '不大于当前集数，不会下载'}
                          >
                            第 {ep} 集{isNew ? ' ·新' : ''}
                          </span>
                        );
                      })}
                      {testResult.unparsed > 0 ? (
                        <span
                          className='px-2 py-0.5 text-xs rounded-full border border-amber-300 dark:border-amber-500/60 text-amber-600 dark:text-amber-400'
                          title='命中过滤关键词但未能提取集数'
                        >
                          {testResult.unparsed} 条未识别集数
                        </span>
                      ) : null}
                    </div>
                    {testResult.newEpisodes.length > 0 ? (
                      <p className='text-[11px] text-gray-500 dark:text-gray-400'>
                        当前集数 {testResult.lastEpisode}，会下载新集数：
                        {testResult.newEpisodes.join('、')}
                      </p>
                    ) : (
                      <p className='text-[11px] text-gray-500 dark:text-gray-400'>
                        当前集数 {testResult.lastEpisode}，没有需要下载的新集数
                      </p>
                    )}
                    <div className='max-h-48 overflow-y-auto space-y-1'>
                      {testResult.items.map((item, idx) => (
                        <div
                          key={`${idx}-${item.title}`}
                          className='flex items-start gap-1.5 text-[11px] leading-relaxed'
                        >
                          <span
                            className={`flex-shrink-0 mt-px px-1.5 rounded ${
                              item.episode == null
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                                : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
                            }`}
                          >
                            {item.episode == null ? '未识别' : `第${item.episode}集`}
                          </span>
                          <span className='break-all text-gray-500 dark:text-gray-400'>
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='mb-1 block text-sm text-gray-700 dark:text-gray-300'>来源</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as AnimeSource)}
                className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-pink-500 dark:focus:ring-pink-900/50'
              >
                <option value='mikan'>mikan</option>
                <option value='acgrip'>acgrip</option>
                <option value='dmhy'>dmhy</option>
                <option value='nyaa'>nyaa</option>
              </select>
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-700 dark:text-gray-300'>最新集数</label>
              <input
                type='number'
                min={0}
                value={lastEpisode}
                onChange={(e) => setLastEpisode(Math.max(0, Number(e.target.value) || 0))}
                className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-pink-500 dark:focus:ring-pink-900/50'
              />
            </div>
          </div>

          <label className='flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
            <input
              type='checkbox'
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className='h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500'
            />
            启用订阅
          </label>

          {error ? <p className='text-sm text-red-500'>{error}</p> : null}
        </div>

        <div className='flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            disabled={submitting}
          >
            取消
          </button>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={!canSubmit}
            className='inline-flex items-center gap-2 rounded-lg bg-pink-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {submitting ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
            {submitting ? '提交中...' : '添加'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
