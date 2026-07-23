'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDate } from '@/lib/utils';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'normal' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

const emptyForm = { title: '', content: '', type: 'normal' as 'normal' | 'urgent' };

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/announcements');
      if (res.success) {
        setAnnouncements(res.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item: Announcement) => {
    setEditingId(item.id);
    setFormData({ title: item.title, content: item.content, type: item.type });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容');
      return;
    }
    setActionLoading(true);
    try {
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}`, formData);
      } else {
        await api.post('/admin/announcements', formData);
      }
      setShowForm(false);
      fetchAnnouncements();
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该公告吗？')) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch {
      alert('删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">公告管理</h1>
        <button
          onClick={openAddForm}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          + 新建公告
        </button>
      </div>

      {/* Announcement List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 py-16 text-center text-slate-500">
          暂无公告
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-800/50 border rounded-xl p-5 transition-colors ${
                item.type === 'urgent'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <StatusBadge status={item.type} />
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{item.content}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    创建于 {formatDate(item.createdAt)}
                    {item.updatedAt !== item.createdAt && ` | 更新于 ${formatDate(item.updatedAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditForm(item)}
                    className="px-3 py-1.5 text-xs rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 text-xs rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">
                {editingId ? '编辑公告' : '新建公告'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="公告标题"
                  className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  placeholder="公告内容..."
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">类型</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'normal' })}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      formData.type === 'normal'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    普通
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'urgent' })}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      formData.type === 'urgent'
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    紧急
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '处理中...' : '确认'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
