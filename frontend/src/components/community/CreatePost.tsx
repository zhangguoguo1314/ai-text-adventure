'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface CreatePostProps {
  onCreated: () => void;
}

export default function CreatePost({ onCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res: any = await api.post('/posts', { content: content.trim(), images });
      if (res.success) {
        setContent('');
        setImages([]);
        onCreated();
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleAddImage = () => {
    const url = prompt('请输入图片URL:');
    if (url) {
      setImages([...images, url]);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="分享你的想法..."
        rows={3}
        className="w-full resize-none border-0 focus:outline-none text-sm text-gray-700 placeholder-gray-400"
      />
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={handleAddImage}
          className="text-xs text-gray-400 hover:text-violet-500 transition-colors"
        >
          + 添加图片
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '发布中...' : '发布'}
        </button>
      </div>
    </div>
  );
}
