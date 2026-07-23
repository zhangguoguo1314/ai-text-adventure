'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatusBadge from '@/components/admin/StatusBadge';

interface AdminModel {
  id: number;
  name: string;
  displayName: string;
  costPerToken: number;
  backendModel: string;
  maxTokens: number;
  enabled: boolean;
}

const emptyModel: Omit<AdminModel, 'id'> = {
  name: '',
  displayName: '',
  costPerToken: 0,
  backendModel: '',
  maxTokens: 4096,
  enabled: true,
};

export default function AdminModelsPage() {
  const [models, setModels] = useState<AdminModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AdminModel | null>(null);
  const [formData, setFormData] = useState(emptyModel);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/models');
      if (res.success) {
        setModels(res.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const openAddForm = () => {
    setEditingModel(null);
    setFormData(emptyModel);
    setShowForm(true);
  };

  const openEditForm = (model: AdminModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      displayName: model.displayName,
      costPerToken: model.costPerToken,
      backendModel: model.backendModel,
      maxTokens: model.maxTokens,
      enabled: model.enabled,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.displayName || !formData.backendModel) {
      alert('请填写必填字段');
      return;
    }
    setActionLoading(true);
    try {
      if (editingModel) {
        await api.put(`/admin/models/${editingModel.id}`, formData);
      } else {
        await api.post('/admin/models', formData);
      }
      setShowForm(false);
      fetchModels();
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEnabled = async (model: AdminModel) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/models/${model.id}`, { enabled: !model.enabled });
      fetchModels();
    } catch {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该模型吗？')) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/models/${id}`);
      fetchModels();
    } catch {
      alert('删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">AI模型管理</h1>
        <button
          onClick={openAddForm}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          + 添加模型
        </button>
      </div>

      {/* Model Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 py-16 text-center text-slate-500">
          暂无模型数据
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{model.displayName || model.name}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{model.name}</p>
                </div>
                <StatusBadge status={model.enabled ? 'enabled' : 'disabled'} />
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">后端模型</span>
                  <span className="text-slate-200">{model.backendModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">最大Token</span>
                  <span className="text-slate-200">{model.maxTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">汇率</span>
                  <span className="text-amber-400">{model.costPerToken}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                {/* Toggle switch */}
                <button
                  onClick={() => handleToggleEnabled(model)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    model.enabled ? 'bg-violet-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      model.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                <div className="flex-1" />

                <button
                  onClick={() => openEditForm(model)}
                  className="px-3 py-1.5 text-xs rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(model.id)}
                  className="px-3 py-1.5 text-xs rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Model Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">
                {editingModel ? '编辑模型' : '添加模型'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">模型名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如 gpt-4"
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">显示名称 *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="如 GPT-4"
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">后端模型 *</label>
                <input
                  type="text"
                  value={formData.backendModel}
                  onChange={(e) => setFormData({ ...formData, backendModel: e.target.value })}
                  placeholder="如 gpt-4o-mini"
                  className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">汇率</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.costPerToken}
                    onChange={(e) => setFormData({ ...formData, costPerToken: Number(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">最大Token</label>
                  <input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: Number(e.target.value) })}
                    className="w-full h-10 px-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300">启用状态</label>
                <button
                  onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    formData.enabled ? 'bg-violet-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      formData.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
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
