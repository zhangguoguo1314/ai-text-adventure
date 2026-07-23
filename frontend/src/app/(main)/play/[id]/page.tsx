'use client';

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl p-6 min-h-[70vh]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
          <span className="text-sm font-medium text-[var(--muted)]">游玩进行中</span>
        </div>
        <div className="prose max-w-none">
          <p className="text-lg text-[var(--ink)] leading-relaxed">
            你站在一片广袤的草原上，远处隐约可以看到一座古老的城堡。风中传来若有若无的音乐声...
          </p>
        </div>
        <div className="mt-8 space-y-3">
          <button className="w-full p-4 rounded-lg bg-violet-50 hover:bg-violet-100 text-[var(--ink)] text-left transition-colors">
            A. 向城堡走去
          </button>
          <button className="w-full p-4 rounded-lg bg-violet-50 hover:bg-violet-100 text-[var(--ink)] text-left transition-colors">
            B. 寻找音乐声的来源
          </button>
          <button className="w-full p-4 rounded-lg bg-violet-50 hover:bg-violet-100 text-[var(--ink)] text-left transition-colors">
            C. 在原地驻足观察
          </button>
        </div>
      </div>
    </div>
  );
}
