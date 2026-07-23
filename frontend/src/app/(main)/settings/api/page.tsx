'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const API_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1/chat/completions', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1/chat/completions', models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'] },
  { id: 'doubao', name: '豆包(字节)', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', models: ['doubao-pro-32k', 'doubao-lite-32k'] },
  { id: 'qwen', name: '通义千问(阿里)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
  { id: 'claude', name: 'Claude(Anthropic)', baseUrl: 'https://api.anthropic.com/v1/messages', models: ['claude-sonnet-4', 'claude-3-haiku'] },
  { id: 'zhipu', name: '智谱AI', baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', models: ['glm-4-plus', 'glm-4-flash'] },
  { id: 'moonshot', name: 'Moonshot(月之暗面)', baseUrl: 'https://api.moonshot.cn/v1/chat/completions', models: ['moonshot-v1-128k', 'moonshot-v1-32k'] },
  { id: 'custom', name: '自定义(OpenAI兼容)', baseUrl: '', models: [] },
];

interface ApiConfig {
  id: number;
  provider: string;
  baseUrl: string;
  maskedKey: string;
  model: string;
  status: string;
  priority: number;
  createdAt: string;
}

export default function CustomApiPage() {
  const { isAuthenticated } = useAuthStore();
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [provider, setProvider] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(0.7);

  // Test result
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string } | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const res: any = await api.get('/user/custom-ai');
      setConfigs(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfigs();
    }
  }, [isAuthenticated, fetchConfigs]);

  const selectedProvider = API_PROVIDERS.find((p) => p.id === provider);

  const handleProviderChange = (pId: string) => {
    setProvider(pId);
    const p = API_PROVIDERS.find((x) => x.id === pId);
    if (p) {
      setBaseUrl(p.baseUrl);
      setModel(p.models[0] || '');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setProvider('openai');
    setBaseUrl(API_PROVIDERS[0].baseUrl);
    setApiKey('');
    setModel(API_PROVIDERS[0].models[0] || '');
    setMaxTokens(4096);
    setTemperature(0.7);
  };

  const handleSubmit = async () => {
    if (!baseUrl || !apiKey) return;
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/user/custom-ai/${editingId}`, { provider, baseUrl, apiKey, model, maxTokens, temperature });
      } else {
        await api.post('/user/custom-ai', { provider, baseUrl, apiKey, model, maxTokens, temperature });
      }
      resetForm();
      fetchConfigs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: ApiConfig) => {
    setEditingId(config.id);
    setShowForm(true);
    setProvider(config.provider);
    setBaseUrl(config.baseUrl);
    setApiKey('');
    setModel(config.model);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此配置？')) return;
    try {
      await api.delete(`/user/custom-ai/${id}`);
      fetchConfigs();
    } catch {
      // ignore
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.put(`/user/custom-ai/${id}/default`);
      fetchConfigs();
    } catch {
      // ignore
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res: any = await api.post(`/user/custom-ai/${id}/test`);
      setTestResult({ id, success: res.success, message: res.message });
      if (res.success) fetchConfigs();
    } catch {
      setTestResult({ id, success: false, message: '请求失败' });
    } finally {
      setTestingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">请先登录</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">自定义 API 配置</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium transition-colors"
        >
          {showForm ? '取消' : '+ 添加配置'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? '编辑配置' : '添加配置'}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">提供商</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {API_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={editingId ? '留空则不修改' : 'sk-...'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模型</label>
            {selectedProvider && selectedProvider.models.length > 0 ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {selectedProvider.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="输入模型名称"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                min={1}
                max={128000}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature: {temperature}</label>
              <input
                type="range"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                min={0}
                max={2}
                step={0.1}
                className="w-full mt-2"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!baseUrl || (!apiKey && !editingId))}
            className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {loading ? '保存中...' : editingId ? '更新' : '保存'}
          </button>
        </div>
      )}

      {/* Config list */}
      <div className="space-y-3">
        {configs.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🔌</p>
            <p>暂无自定义 API 配置</p>
            <p className="text-sm mt-1">点击上方按钮添加你的第一个 API 配置</p>
          </div>
        )}

        {configs.map((config) => (
          <div
            key={config.id}
            className={`bg-white rounded-xl border p-4 ${
              config.priority === 1 ? 'border-violet-500 ring-1 ring-violet-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg font-bold text-violet-600 shrink-0">
                  {config.provider[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{config.provider}</p>
                    {config.priority === 1 && (
                      <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full">默认</span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        config.status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {config.status === 'verified' ? '已验证' : '未验证'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{config.model}</p>
                  <p className="text-xs text-gray-400 font-mono">{config.maskedKey}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {config.priority !== 1 && (
                  <button
                    onClick={() => handleSetDefault(config.id)}
                    title="设为默认"
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleTest(config.id)}
                  disabled={testingId === config.id}
                  title="测试连接"
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <svg className={`w-4 h-4 ${testingId === config.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleEdit(config)}
                  title="编辑"
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  title="删除"
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {testResult && testResult.id === config.id && (
              <div
                className={`mt-3 p-2 rounded-lg text-xs ${
                  testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
