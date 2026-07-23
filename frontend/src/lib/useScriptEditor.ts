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

  const canNext = useCallback(() => {
    if (step === 1) return selectedStyle !== null;
    if (step === 2) return title.trim().length > 0 && instruction.trim().length > 0;
    return false;
  }, [step, selectedStyle, title, instruction]);

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
      // Step 1: Create the script
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

      // Step 2: Trigger AI generation
      const genRes: any = await api.post(`/scripts/${newScriptId}/generate`);

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
  }, [title, instruction, selectedStyle]);

  const enterEditor = useCallback(() => {
    if (createdScriptId) {
      router.push(`/editor/${createdScriptId}`);
    }
  }, [createdScriptId, router]);

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
  };
}
