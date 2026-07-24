'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { GeneratedContent } from '@/types';

export function useScriptEditor(scriptId: string) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [selectedStyleName, setSelectedStyleName] = useState<string>('');
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [aiPolish, setAiPolish] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [createdScriptId, setCreatedScriptId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 生成项选择（对标UU的确认生成步）
  const [generateItems, setGenerateItems] = useState<string[]>([
    'description', 'narrativeRules', 'attributes', 'npcs', 'opening', 'charConfig', 'tags'
  ]);
  // 生成引擎选择
  const [engineType, setEngineType] = useState<string>('standard');

  const canNext = useCallback(() => {
    if (step === 1) return selectedStyle !== null;
    if (step === 2) return title.trim().length > 0 && instruction.trim().length > 0;
    if (step === 3) return generateItems.length > 0; // 至少保留1项
    return false;
  }, [step, selectedStyle, title, instruction, generateItems]);

  const goNext = useCallback(() => {
    if (step < 3) {
      setStep(step + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const resetToStep = useCallback((targetStep: number) => {
    setStep(targetStep);
    if (targetStep <= 1) {
      setGeneratedContent(null);
      setCreatedScriptId(null);
    }
  }, []);

  const generate = useCallback(async () => {
    setError(null);
    setGenerating(true);

    try {
      // Step 1: 创建剧本
      const createRes: any = await api.post('/scripts', {
        title: title.trim(),
        desc: instruction.trim(),
        styleId: selectedStyle || undefined,
      });

      if (!createRes.success) {
        throw new Error(createRes.message || '创建剧本失败');
      }

      const newScriptId = createRes.data.id;
      setCreatedScriptId(newScriptId);

      // Step 2: 触发AI生成（传入aiPolish、生成项和引擎类型）
      const genRes: any = await api.post(`/scripts/${newScriptId}/generate`, {
        aiPolish,
        generateItems,
        engineType,
      });

      if (!genRes.success) {
        throw new Error(genRes.message || '生成内容失败');
      }

      setGeneratedContent(genRes.data);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  }, [title, instruction, selectedStyle, aiPolish, generateItems, engineType]);

  const enterEditor = useCallback(() => {
    if (createdScriptId) {
      router.push(`/editor/${createdScriptId}`);
    }
  }, [createdScriptId, router]);

  // 切换生成项
  const toggleGenerateItem = useCallback((item: string) => {
    setGenerateItems(prev => {
      if (prev.includes(item)) {
        // 至少保留1项
        if (prev.length <= 1) return prev;
        return prev.filter(i => i !== item);
      }
      return [...prev, item];
    });
  }, []);

  return {
    step,
    setStep,
    selectedStyle,
    setSelectedStyle,
    selectedStyleName,
    setSelectedStyleName,
    title,
    setTitle,
    instruction,
    setInstruction,
    aiPolish,
    setAiPolish,
    generating,
    setGenerating,
    generatedContent,
    setGeneratedContent,
    createdScriptId,
    error,
    setError,
    canNext,
    goNext,
    goBack,
    resetToStep,
    generate,
    enterEditor,
    // 新增：生成项和引擎
    generateItems,
    setGenerateItems,
    toggleGenerateItem,
    engineType,
    setEngineType,
  };
}
