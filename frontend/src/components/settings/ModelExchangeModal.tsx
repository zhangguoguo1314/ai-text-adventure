'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import { useCoin } from '@/lib/useCoin';

interface AiModel {
  id: number;
  name: string;
  displayName: string;
  rate: number;
  multimodal: boolean;
  maxTokens: number;
}

interface ModelExchangeModalProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [10, 50, 100];

export default function ModelExchangeModal({ open, onClose }: ModelExchangeModalProps) {
  const { balance, fetchBalance, recharge, redeem, loading, error, setError } = useCoin();
  const [models, setModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      fetchBalance();
      fetchModels();
    }
  }, [open, fetchBalance]);

  const fetchModels = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      const res: any = await api.get('/coin/models');
      if (res.success) setModels(res.data);
    } catch {
      // ignore
    }
  };

  const handleRecharge = async (amount: number) => {
    setError(null);
    const result = await recharge(amount);
    if (result) {
      setCustomAmount('');
    }
  };

  const handleCustomRecharge = () => {
    const amount = Number(customAmount);
    if (amount > 0) {
      handleRecharge(amount);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setError(null);
    setRedeemResult(null);
    const res = await redeem(redeemCode.trim());
    if (res.success) {
      setRedeemResult({ success: true, message: res.message });
      setRedeemCode('');
    } else {
      setRedeemResult({ success: false, message: res.message });
    }
  };

  const totalBalance = balance.permanent + balance.temp;

  return (
    <Modal open={open} onClose={onClose} title="模型 / 兑换">
      <div className="space-y-6">
        {/* Current Balance */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50 border border-violet-200">
          <span className="text-sm text-gray-700">当前余额</span>
          <span className="text-lg font-bold text-violet-700">{totalBalance} UU</span>
        </div>

        {/* AI Model Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">可用模型</h3>
          <div className="space-y-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedModel === model.id
                    ? 'bg-violet-100 border-violet-400'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{model.displayName}</span>
                    {model.multimodal && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                        多模态
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">x{model.rate}</span>
                </div>
              </button>
            ))}
            {models.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">加载模型列表中...</p>
            )}
          </div>
        </div>

        {/* Recharge */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">充值 UU 币</h3>
          <div className="flex gap-2 mb-3">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => handleRecharge(amt)}
                disabled={loading}
                className="flex-1 py-2 rounded-lg border border-violet-300 text-violet-700 text-sm font-medium hover:bg-violet-50 disabled:opacity-50 transition-colors"
              >
                {amt} 元
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="自定义金额"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              min="1"
            />
            <button
              onClick={handleCustomRecharge}
              disabled={loading || !customAmount}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : '充值'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">汇率: 1 元 = 10 UU 币</p>
        </div>

        {/* Redeem Code */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">兑换码</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="请输入兑换码"
              value={redeemCode}
              onChange={(e) => { setRedeemCode(e.target.value); setRedeemResult(null); }}
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={handleRedeem}
              disabled={loading || !redeemCode.trim()}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              兑换
            </button>
          </div>
          {redeemResult && (
            <p className={`text-xs mt-2 ${redeemResult.success ? 'text-green-600' : 'text-red-500'}`}>
              {redeemResult.message}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
      </div>
    </Modal>
  );
}
