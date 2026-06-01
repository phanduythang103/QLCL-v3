import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from './ui/card';

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
      <Card className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        <CardHeader className="items-center p-8 pb-4 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner">
            <AlertTriangle size={40} />
          </div>
          <CardTitle className="text-xl font-black uppercase text-slate-900">{title}</CardTitle>
          <CardDescription className="font-bold leading-relaxed">{message}</CardDescription>
        </CardHeader>

        <CardFooter className="grid grid-cols-2 gap-4 p-8 pt-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-900/10"
          >
            {isLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Trash2 size={16} />
            )}
            {confirmLabel}
          </Button>
        </CardFooter>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-full text-slate-400 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X size={20} />
        </Button>
      </Card>
    </div>
  );
};
