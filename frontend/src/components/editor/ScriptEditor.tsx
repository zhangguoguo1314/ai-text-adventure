'use client';

import { useScriptEditor } from '@/lib/useScriptEditor';
import StyleSelector from './StyleSelector';
import GameDescription from './GameDescription';
import GeneratePreview from './GeneratePreview';

interface StepIndicatorProps {
  current: number;
  steps: string[];
}

function StepIndicator({ current, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const isCompleted = num < current;
        const isCurrent = num === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`mt-1 text-xs ${
                  isCurrent ? 'text-violet-600 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mt-[-16px] ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ScriptEditor() {
  const editor = useScriptEditor('new');
  const steps = ['选择文风', '描述游戏', '确认生成'];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">创建新剧本</h1>
        <p className="text-sm text-[var(--muted)] mt-1">通过三步引导，快速生成你的文字冒险游戏</p>
      </div>

      <StepIndicator current={editor.step} steps={steps} />

      <div className="bg-white rounded-xl shadow-sm border border-[var(--rule)] p-6 min-h-[400px]">
        {editor.step === 1 && (
          <StyleSelector
            selectedStyle={editor.selectedStyle}
            onSelect={(id, name) => {
              editor.setSelectedStyle(id);
              editor.setSelectedStyleName(name);
            }}
            onNext={editor.goNext}
            canNext={editor.canNext()}
          />
        )}

        {editor.step === 2 && (
          <GameDescription
            title={editor.title}
            setTitle={editor.setTitle}
            instruction={editor.instruction}
            setInstruction={editor.setInstruction}
            aiPolish={editor.aiPolish}
            setAiPolish={editor.setAiPolish}
            selectedStyleName={editor.selectedStyleName}
            onBack={editor.goBack}
            onNext={editor.goNext}
            canNext={editor.canNext()}
          />
        )}

        {editor.step === 3 && (
          <GeneratePreview
            generating={editor.generating}
            generatedContent={editor.generatedContent}
            error={editor.error}
            onGenerate={editor.generate}
            onEnterEditor={editor.enterEditor}
            onBack={editor.resetToStep}
            generateItems={editor.generateItems}
            toggleGenerateItem={editor.toggleGenerateItem}
            engineType={editor.engineType}
            setEngineType={editor.setEngineType}
            title={editor.title}
            instruction={editor.instruction}
            selectedStyleName={editor.selectedStyleName}
            aiPolish={editor.aiPolish}
          />
        )}
      </div>
    </div>
  );
}
