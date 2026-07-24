'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTemplates, TEMPLATE_CATEGORIES, TEMPLATE_SORTS, type TemplateSort } from '@/lib/useTemplates';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateDetail from '@/components/templates/TemplateDetail';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import type { ScriptTemplate } from '@/types';

const PAGE_LIMIT = 12;

export default function TemplatesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const { list, total, totalPages, loading, error, fetchList, apply, rate } =
    useTemplates();

  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<TemplateSort>('hot');
  const [currentPage, setCurrentPage] = useState(1);

  const [detailTemplate, setDetailTemplate] = useState<ScriptTemplate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  // 拉取列表
  const load = useCallback(
    (cat: string, s: TemplateSort, p: number) => {
      fetchList({ category: cat, sort: s, page: p, limit: PAGE_LIMIT });
    },
    [fetchList],
  );

  useEffect(() => {
    load(category, sort, currentPage);
  }, [category, sort, currentPage, load]);

  // 同步列表中模板的评分/使用次数到详情
  const syncDetail = useCallback(
    (id: number, patch: Partial<ScriptTemplate>) => {
      setDetailTemplate((prev) =>
        prev && prev.id === id ? { ...prev, ...patch } : prev,
      );
    },
    [],
  );

  const handleDetail = (template: ScriptTemplate) => {
    setDetailTemplate(template);
    setDetailOpen(true);
  };

  const handleApply = useCallback(
    async (template: ScriptTemplate) => {
      if (!isAuthenticated) {
        showToast('warning', '请先登录后再使用模板');
        router.push('/login');
        return;
      }
      setApplying(true);
      const result = await apply(template.id);
      setApplying(false);
      if (result) {
        showToast('success', `已基于「${template.name}」创建剧本，正在跳转编辑器...`);
        setDetailOpen(false);
        router.push(`/editor/${result.scriptId}`);
      } else {
        showToast('error', '使用模板失败，请稍后重试');
      }
    },
    [isAuthenticated, apply, router, showToast],
  );

  const handleRate = useCallback(
    async (template: ScriptTemplate, rating: number) => {
      if (!isAuthenticated) {
        showToast('warning', '请先登录后再评分');
        router.push('/login');
        return;
      }
      const result = await rate(template.id, rating);
      if (result) {
        showToast('success', '评分成功，感谢你的反馈！');
        syncDetail(template.id, {
          rating: result.rating,
          ratingCount: result.ratingCount,
        });
      } else {
        showToast('error', '评分失败，请稍后重试');
      }
    },
    [isAuthenticated, rate, router, showToast, syncDetail],
  );

  const changeCategory = (cat: string) => {
    setCategory(cat);
    setCurrentPage(1);
  };

  const changeSort = (s: TemplateSort) => {
    setSort(s);
    setCurrentPage(1);
  };

  const changePage = (p: number) => {
    setCurrentPage(p);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)]">模板市场</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              选择一个剧本模板，快速开始你的创作之旅
            </p>
          </div>
          <Link
            href="/create"
            className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回创作
          </Link>
        </div>
      </div>

      {/* 分类标签 - 横向滚动 */}
      <div className="mb-4 -mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 px-1 min-w-max">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => changeCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                category === cat.key
                  ? 'bg-[var(--accent)] text-white font-medium shadow-sm'
                  : 'bg-[var(--bg2)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--rule)]'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 排序切换 + 统计 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg3)]">
          {TEMPLATE_SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => changeSort(s.key)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                sort === s.key
                  ? 'bg-[var(--bg2)] text-[var(--ink)] font-medium shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--muted)]">共 {total} 个模板</span>
      </div>

      {/* 内容区 */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
          {error}
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loading />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="暂无模板"
          description="该分类下还没有模板，试试切换其他分类吧"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {list.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={handleApply}
                onDetail={handleDetail}
              />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg2)] border border-[var(--rule)] text-[var(--ink)] disabled:opacity-40 hover:border-[var(--accent)] transition-colors"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-sm text-[var(--muted)]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg2)] border border-[var(--rule)] text-[var(--ink)] disabled:opacity-40 hover:border-[var(--accent)] transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 详情弹窗 */}
      <TemplateDetail
        template={detailTemplate}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onApply={handleApply}
        onRate={handleRate}
        applying={applying}
      />
    </div>
  );
}
