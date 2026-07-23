'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDate } from '@/lib/utils';

interface AdminUser {
  id: number;
  nickname: string;
  phone?: string;
  email?: string;
  role: string;
  status: string;
  balance: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal states
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [balanceUser, setBalanceUser] = useState<AdminUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNote, setBalanceNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      const res: any = await api.get('/admin/users', { params });
      if (res.success) {
        setUsers(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: number, status: string) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${userId}/status`, { status });
      fetchUsers();
      if (detailUser?.id === userId) setDetailUser({ ...detailUser, status });
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      fetchUsers();
      if (detailUser?.id === userId) setDetailUser({ ...detailUser, role });
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBalanceSubmit = async () => {
    if (!balanceUser || !balanceAmount) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${balanceUser.id}/balance`, {
        amount: Number(balanceAmount),
        note: balanceNote,
      });
      setBalanceUser(null);
      setBalanceAmount('');
      setBalanceNote('');
      fetchUsers();
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', width: '70px' },
    { key: 'nickname', title: '昵称' },
    {
      key: 'phone',
      title: '手机/邮箱',
      render: (_: any, row: AdminUser) => row.phone || row.email || '-',
    },
    {
      key: 'role',
      title: '角色',
      render: (val: string) => (
        <span className={val === 'admin' ? 'text-violet-400 font-medium' : 'text-slate-300'}>
          {val === 'admin' ? '管理员' : val === 'creator' ? '创作者' : '用户'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (val: string) => <StatusBadge status={val as any} />,
    },
    {
      key: 'balance',
      title: '余额',
      render: (val: number) => <span className="text-amber-400 font-medium">{val}</span>,
    },
    {
      key: 'createdAt',
      title: '注册时间',
      render: (val: string) => formatDate(val),
    },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (_: any, row: AdminUser) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailUser(row)}
            className="px-2 py-1 text-xs rounded text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            详情
          </button>
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className="px-2 py-1 text-xs rounded bg-slate-700 border border-slate-600 text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="active">正常</option>
            <option value="banned">封禁</option>
            <option value="deactivated">停用</option>
          </select>
          <select
            value={row.role}
            onChange={(e) => handleRoleChange(row.id, e.target.value)}
            className="px-2 py-1 text-xs rounded bg-slate-700 border border-slate-600 text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="user">用户</option>
            <option value="creator">创作者</option>
            <option value="admin">管理员</option>
          </select>
          <button
            onClick={() => setBalanceUser(row)}
            className="px-2 py-1 text-xs rounded text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            调整余额
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">用户管理</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="搜索用户ID、昵称、手机、邮箱..."
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
          <option value="active">正常</option>
          <option value="banned">封禁</option>
          <option value="deactivated">停用</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
        >
          <option value="">全部角色</option>
          <option value="user">用户</option>
          <option value="creator">创作者</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={users} loading={loading} emptyText="暂无用户数据" />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* User Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setDetailUser(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">用户详情</h2>
              <button onClick={() => setDetailUser(null)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between"><span className="text-slate-400">ID</span><span className="text-white">{detailUser.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">昵称</span><span className="text-white">{detailUser.nickname}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">手机</span><span className="text-white">{detailUser.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">邮箱</span><span className="text-white">{detailUser.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">角色</span><span className="text-white">{detailUser.role}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-400">状态</span><StatusBadge status={detailUser.status as any} /></div>
              <div className="flex justify-between"><span className="text-slate-400">余额</span><span className="text-amber-400 font-medium">{detailUser.balance}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">注册时间</span><span className="text-white">{formatDate(detailUser.createdAt)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {balanceUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setBalanceUser(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">调整余额</h2>
              <button onClick={() => setBalanceUser(null)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-slate-400">
                用户：<span className="text-white">{balanceUser.nickname}</span>（ID: {balanceUser.id}）
              </p>
              <p className="text-sm text-slate-400">
                当前余额：<span className="text-amber-400 font-medium">{balanceUser.balance}</span>
              </p>
              <div>
                <label className="block text-sm text-slate-300 mb-1">金额（正数赠送，负数扣除）</label>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="例如：100 或 -50"
                  className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">备注</label>
                <input
                  type="text"
                  value={balanceNote}
                  onChange={(e) => setBalanceNote(e.target.value)}
                  placeholder="调整原因..."
                  className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setBalanceUser(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBalanceSubmit}
                  disabled={actionLoading || !balanceAmount}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '处理中...' : '确认调整'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
