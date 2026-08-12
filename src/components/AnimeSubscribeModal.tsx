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
