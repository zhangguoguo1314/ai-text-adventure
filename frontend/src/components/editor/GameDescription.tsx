'use client';

interface GameDescriptionProps {
  title: string;
  setTitle: (v: string) => void;
  instruction: string;
  setInstruction: (v: string) => void;
  aiPolish: boolean;
  setAiPolish: (v: boolean) => void;
  selectedStyleName: string;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}

export default function GameDescription({
  title,
  setTitle,
  instruction,
  setInstruction,
  aiPolish,
  setAiPolish,
  selectedStyleName,
  onBack,
  onNext,
  canNext,
}: GameDescriptionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-1">描述你的游戏</h2>
      <p className="text-sm text-[var(--muted)] mb-6">
        告诉 AI 你想要什么样的故事，越详细生成效果越好
      </p>

      {/* Title input */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[var(--ink)] mb-2">
          游戏标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={20}
          placeholder="给你的游戏起个名字"
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--rule)] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm transition-colors"
        />
        <div className="text-right mt-1">
          <span className={`text-xs ${title.length > 18 ? 'text-red-500' : 'text-[var(--muted)]'}`}>
            {title.length}/20
          </span>
        </div>
      </div>

      {/* Instruction textarea */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[var(--ink)] mb-2">
          游戏指令
        </label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          maxLength={5000}
          rows={10}
          placeholder="描述你想要的游戏世界观、核心玩法、角色设定、故事走向等...&#10;&#10;例如：&#10;创建一个赛博朋克风格的侦探游戏，玩家扮演一位在霓虹城市中调查失踪案的私家侦探。世界设定在2087年的新上海，科技高度发达但社会分化严重..."
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--rule)] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm resize-y transition-colors min-h-[200px]"
        />
        <div className="text-right mt-1">
          <span className={`text-xs ${instruction.length > 4800 ? 'text-red-500' : 'text-[var(--muted)]'}`}>
            {instruction.length}/5000
          </span>
        </div>
      </div>

      {/* AI Polish checkbox */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={aiPolish}
            onChange={(e) => setAiPolish(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--rule)] text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm text-[var(--ink)]">允许 AI 润色指令</span>
          <span className="text-xs text-[var(--muted)]">(推荐开启，AI 会优化你的描述)</span>
        </label>
      </div>

      {/* Selected style review */}
      {selectedStyleName && (
        <div className="mb-6 p-3 rounded-lg bg-violet-50 border border-violet-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-violet-700">
              已选文风：<span className="font-medium">{selectedStyleName}</span>
            </span>
            <span className="text-xs text-violet-500 cursor-pointer hover:text-violet-700">
              在上一步更换
            </span>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg text-sm font-medium border border-[var(--rule)] text-[var(--muted)] hover:border-violet-300 hover:text-violet-600 transition-colors"
        >
          上一步
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            canNext
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          下一步
        </button>
      </div>
    </div>
  );
}
