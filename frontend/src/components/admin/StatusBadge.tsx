'use client';

type StatusType = 'active' | 'banned' | 'deactivated' | 'draft' | 'published' | 'rejected' | 'reviewing' | 'normal' | 'urgent' | 'spend' | 'income' | 'recharge' | 'withdraw' | 'redeem' | 'used' | 'unused' | 'expired' | 'enabled' | 'disabled';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: '正常', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  banned: { label: '封禁', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  deactivated: { label: '停用', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  draft: { label: '草稿', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  published: { label: '已发布', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: '已拒绝', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  reviewing: { label: '审核中', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  normal: { label: '普通', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  urgent: { label: '紧急', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  spend: { label: '消费', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  income: { label: '收入', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  recharge: { label: '充值', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  withdraw: { label: '提现', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  redeem: { label: '兑换', className: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  used: { label: '已使用', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  unused: { label: '未使用', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  expired: { label: '已过期', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  enabled: { label: '启用', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  disabled: { label: '禁用', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || { label: status, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  const displayLabel = label || config.label;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {displayLabel}
    </span>
  );
}
