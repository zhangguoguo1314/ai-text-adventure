'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDate } from '@/lib/utils';

interface AdminScript {
  id: number;
  title: string;
  authorName: string;
  genre: string;
  playCount: number;
  status: string;
  featured: boolean;
  createdAt: string;
}

export default function AdminScriptsPage() {
  const [scripts, setScripts] = useState<AdminScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Reject reason modal
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res: any = await api.get('/admin/scripts', { params });
      if (res.success) {
        setScripts(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/scripts/${id}/status`, { status: 'published' });
      fetchScripts();
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/scripts/${rejectId}/status`, { status: 'rejected', reason: rejectReason });
      setRejectId(null);
      setRejectReason('');
      fetchScripts();
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async (id: number, featured: boolean) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/scripts/${id}/featured`, { featured: !featured });
      fetchScripts();
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该剧本吗？此操作不可撤销。')) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/scripts/${id}`);
      fetchScripts();
    } catch {
      alert('删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', width: '70px' },
    { key: 'title', title: '标题' },
    { key: 'authorName', title: '作者' },
    { key: 'genre', title: '分类' },
    { key: 'playCount', title: '游玩次数' },
    {
      key: 'status',
      title: '状态',
      render: (val: string) => <StatusBadge status={val as any} />,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (val: string) => formatDate(val),
    },
    {
      key: 'actions',
      title: '操作',
      width: '280px',
      render: (_: any, row: AdminScript) => (
        <div className="flex items-center gap-1">
          <a
            href={`/play/${row.id}`}
            target="_blank"
            className="px-2 py-1 text-xs rounded text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            查看
          </a>
          {row.status === 'reviewing' && (
            <>
              <button
                onClick={() => handleApprove(row.id)}
                className="px-2 py-1 text-xs rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                通过
              </button>
              <button
                onClick={() => setRejectId(row.id)}
                className="px-2 py-1 text-xs rounded text-red-400 hover:bg-red-500/10 transition-colors"
              >
                拒绝
              </button>
            </>
          )}
          <button
            onClick={() => handleToggleFeatured(row.id, row.featured)}
            className="px-2 py-1 text-xs rounded transition-colors"
            title={row.featured ? '取消精选' : '设为精选'}
          >
            {row.featured ? (
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-2 py-1 text-xs rounded text-red-400 hover:bg-red-500/10 transition-colors"
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">剧本管理</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="搜索剧本ID、标题、作者..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] h-10 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="rejected">已拒绝</option>
          <option value="reviewing">审核中</option>
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={scripts} loading={loading} emptyText="暂无剧本数据" />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setRejectId(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">拒绝剧本</h2>
              <button onClick={() => setRejectId(null)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">拒绝原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="请输入拒绝原因..."
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectId(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '处理中...' : '确认拒绝'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
