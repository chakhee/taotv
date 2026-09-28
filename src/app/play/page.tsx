'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

import PageLayout from '@/components/PageLayout';

function PlayPageClient() {
  const router = useRouter();

  return (
    <PageLayout activePath='/play' hideNavigation={false}>
      <div className='mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-8'>
        <div className='w-full rounded-2xl border border-gray-200 bg-white/85 p-6 text-center shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80'>
          <h2 className='mb-3 text-xl font-semibold text-gray-900 dark:text-white'>
            播放页正在维护
          </h2>
          <p className='mb-6 text-sm text-gray-600 dark:text-gray-300'>
            当前正在修复构建兼容问题，请稍后重试。
          </p>
          <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
            <button
              onClick={() => window.location.reload()}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-2.5 text-white'
            >
              <RefreshCw className='h-4 w-4' />
              刷新
            </button>
            <button
              onClick={() => router.back()}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            >
              <ArrowLeft className='h-4 w-4' />
              返回
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageClient />
    </Suspense>
  );
}
