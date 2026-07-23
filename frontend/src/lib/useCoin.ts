'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAppStore } from '@/store/appStore';

interface CoinState {
  balance: { permanent: number; temp: number };
  loading: boolean;
  error: string | null;
}

export function useCoin() {
  const [state, setState] = useState<CoinState>({
    balance: { permanent: 0, temp: 0 },
    loading: false,
    error: null,
  });
  const { updateBalance } = useAppStore();

  const fetchBalance = useCallback(async () => {
    try {
      const res: any = await api.get('/user/balance');
      if (res.success && res.data) {
        const { permanentBalance, tempBalance } = res.data;
        setState((s) => ({
          ...s,
          balance: { permanent: permanentBalance || 0, temp: tempBalance || 0 },
          error: null,
        }));
        updateBalance(permanentBalance || 0, tempBalance || 0);
      }
    } catch {
      setState((s) => ({ ...s, error: '获取余额失败' }));
    }
  }, [updateBalance]);

  const recharge = useCallback(async (amount: number) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res: any = await api.post('/user/recharge', { amount, paymentMethod: 'dev' });
      if (res.success && res.data) {
        await fetchBalance();
        return res.data;
      }
      setState((s) => ({ ...s, loading: false, error: res.message || '充值失败' }));
      return null;
    } catch {
      setState((s) => ({ ...s, loading: false, error: '充值失败' }));
      return null;
    }
  }, [fetchBalance]);

  const redeem = useCallback(async (code: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res: any = await api.post('/user/redeem', code);
      if (res.success) {
        await fetchBalance();
        return res;
      }
      setState((s) => ({ ...s, loading: false, error: res.message || '兑换失败' }));
      return res;
    } catch {
      setState((s) => ({ ...s, loading: false, error: '兑换失败' }));
      return { success: false, message: '网络错误' };
    }
  }, [fetchBalance]);

  return {
    balance: state.balance,
    loading: state.loading,
    error: state.error,
    setError: (e: string | null) => setState((s) => ({ ...s, error: e })),
    fetchBalance,
    recharge,
    redeem,
  };
}
