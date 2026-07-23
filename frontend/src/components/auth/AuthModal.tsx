'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-2">请先登录</h3>
        <p className="text-gray-600 mb-4">此功能需要登录后才能使用。</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <Link
            href="/login"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-center"
          >
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
}
