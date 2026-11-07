import type React from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-default"
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-black text-gray-900 truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
