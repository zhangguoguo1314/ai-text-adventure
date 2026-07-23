'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDate } from '@/lib/utils';

interface RedeemCode {
  id: number;
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  status: string;
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create code form
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'auto'>('auto');
  const [manualCode, setManualCode] = useState('');
  const [autoCount, setAutoCount] = useState('10');
  const [codeAmount, setCodeAmount] = useState('');
  const [codeMaxUses, setCodeMaxUses] = useState('1');
  const [codeExpiresAt, setCodeExpiresAt] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/codes', { params: { page, pageSize: 20 } });
      if (res.success) {
        setCodes(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreate = async () => {
    if (!codeAmount) {
      alert('请填写面额');
      return;
    }
    if (createMode === 'manual' && !manualCode.trim()) {
      alert('请输入兑换码');
      return;
    }
    setActionLoading(true);
    try {
      const body: any = {
        amount: Number(codeAmount),
        maxUses: Number(codeMaxUses) || 1,
        expiresAt: codeExpiresAt || null,
      };
      if (createMode === 'manual') {
        body.code = manualCode.trim();
        body.batch = false;
      } else {
        body.count = Number(autoCount) || 1;
        body.batch = true;
      }
      await api.post('/admin/codes', body);
      setShowCreate(false);
      setManualCode('');
      fetchCodes();
    } catch {
      alert('创建失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该兑换码吗？')) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/codes/${id}`);
      fetchCodes();
    } catch {
      alert('删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'code', title: '编码', render: (val: string) => <span className="font-mono text-violet-300">{val}</span> },
    { key: 'amount', title: '面额', render: (val: number) => <span className="text-amber-400 font-medium">{val}</span> },
    { key: 'maxUses', title: '最大次数' },
    { key: 'usedCount', title: '已使用' },
    {
      key: 'expiresAt',
      title: '过期时间',
      render: (val: string | null) => val ? formatDate(val) : <span className="text-slate-500">永不过期</span>,
    },
    {
      key: 'status',
      title: '状态',
      render: (val: string, row: RedeemCode) => {
        if (val === 'expired' || (row.expiresAt && new Date(row.expiresAt) < new Date())) {
          return <StatusBadge status="expired" />;
        }
        if (row.usedCount >= row.maxUses) {
          return <StatusBadge status="used" />;
        }
        return <StatusBadge status="unused" />;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '80px',
      render: (_: any, row: RedeemCode) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="px-2 py-1 text-xs rounded text-red-400 hover:bg-red-500/10 transition-colors"
        >
          删除
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">兑换码管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          + 创建兑换码
        </button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={codes} loading={loading} emptyText="暂无兑换码" />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create Code Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">创建兑换码</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Mode toggle */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">创建方式</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCreateMode('auto')}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      createMode === 'auto'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    自动生成
                  </button>
                  <button
                    onClick={() => setCreateMode('manual')}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      createMode === 'manual'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    手动输入
                  </button>
                </div>
              </div>

              {/* Manual code input */}
              {createMode === 'manual' && (
                <div>
                  <label className="block text-sm text-slate-300 mb-1">兑换码</label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="输入自定义兑换码"
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm font-mono"
                  />
                </div>
              )}

              {/* Auto count */}
              {createMode === 'auto' && (
                <div>
                  <label className="block text-sm text-slate-300 mb-1">生成数量</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={autoCount}
                    onChange={(e) => setAutoCount(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">面额 (UU币)</label>
                  <input
                    type="number"
                    value={codeAmount}
                    onChange={(e) => setCodeAmount(e.target.value)}
                    placeholder="100"
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">最大使用次数</label>
                  <input
                    type="number"
                    min="1"
                    value={codeMaxUses}
                    onChange={(e) => setCodeMaxUses(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">过期时间（可选）</label>
                <input
                  type="datetime-local"
                  value={codeExpiresAt}
                  onChange={(e) => setCodeExpiresAt(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '处理中...' : '确认创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
