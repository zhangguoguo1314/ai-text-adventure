import Link from 'next/link';
import { Script } from '@/types';
import { formatNumber, truncateText } from '@/lib/utils';

interface ScriptCardProps {
  script: Script;
  rank?: number;
}

export default function ScriptCard({ script, rank }: ScriptCardProps) {
  return (
    <Link href={`/game/${script.id}`} className="block">
      <div className="flex gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-shadow group">
        {/* 排名 */}
        {rank && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold">
            {rank}
          </div>
        )}

        {/* 封面 */}
        <div className="flex-shrink-0 w-24 h-32 rounded-lg bg-gradient-to-br from-violet-200 to-purple-300 overflow-hidden">
          {script.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={script.coverImage}
              alt={script.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-base font-semibold text-[var(--ink)] group-hover:text-violet-600 transition-colors truncate">
            {script.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-3 flex-1">
            {truncateText(script.description)}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted)]">
            <span>{formatNumber(script.playCount)} 次游玩</span>
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {script.genre}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
