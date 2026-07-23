'use client';

import Modal from '@/components/common/Modal';

interface ModelExchangeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ModelExchangeModal({ open, onClose }: ModelExchangeModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="模型 / 兑换">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">可用模型</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
              <p className="text-sm font-medium">GPT-4o</p>
              <p className="text-xs text-gray-500">高质量输出，适合复杂剧情</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm font-medium">Claude 3.5</p>
              <p className="text-xs text-gray-500">优秀创意写作能力</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">兑换 UU 币</h3>
          <p className="text-sm text-gray-500">兑换功能开发中，敬请期待。</p>
        </div>
      </div>
    </Modal>
  );
}
