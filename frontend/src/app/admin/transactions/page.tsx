'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDate } from '@/lib/utils';

interface Transaction {
  id: number;
  userId: number;
  nickname?: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  relatedType: string;
  createdAt: string;
}

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'spend', label: '消费' },
  { value: 'income', label: '收入' },
  { value: 'recharge', label: '充值' },
  { value: 'withdraw', label: '提现' },
  { value: 'redeem', label: '兑换' },
];

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (userIdFilter) params.userId = userIdFilter;
      if (typeFilter) params.type = typeFilter;
      const res: any = await api.get('/admin/transactions', { params });
      if (res.success) {
        setTransactions(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, userIdFilter, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const columns = [
    { key: 'id', title: 'ID', width: '70px' },
    {
      key: 'userId',
      title: '用户',
      render: (_: any, row: Transaction) => (
        <span>
          {row.nickname ? `${row.nickname} (${row.userId})` : row.userId}
        </span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      render: (val: string) => <StatusBadge status={val as any} />,
    },
    {
      key: 'amount',
      title: '金额',
      render: (val: number, row: Transaction) => {
        const isPositive = ['income', 'recharge', 'redeem'].includes(row.type);
        return (
          <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
            {isPositive ? '+' : '-'}{val}
          </span>
        );
      },
    },
    { key: 'currency', title: '货币' },
    {
      key: 'description',
      title: '描述',
      render: (val: string) => (
        <span className="text-slate-400 max-w-[200px] truncate block" title={val}>
          {val || '-'}
        </span>
      ),
    },
    { key: 'relatedType', title: '关联类型', render: (val: string) => val || '-' },
    {
      key: 'createdAt',
      title: '时间',
      render: (val: string) => formatDate(val),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">交易记录</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="用户ID"
          value={userIdFilter}
          onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
          className="w-40 h-10 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={transactions} loading={loading} emptyText="暂无交易记录" />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
