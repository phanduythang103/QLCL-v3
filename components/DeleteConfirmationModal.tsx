import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận xóa",
  message = "Bạn có chắc chắn muốn xóa mục này không? Thao tác này không thể hoàn tác.",
  confirmLabel = "Xác nhận xóa",
  cancelLabel = "Hủy bỏ",
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col items-center p-8 pb-4 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner">
            <AlertTriangle size={40} />
          </div>
          <h3 className="text-xl font-black uppercase text-slate-900">{title}</h3>
          <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-8 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center justify-center rounded-xl bg-slate-100 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-900/10 transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Trash2 size={16} />
            )}
            {confirmLabel}
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
