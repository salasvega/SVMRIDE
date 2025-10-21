import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface DeleteConfirmModalProps {
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  title = 'Confirmer la suppression',
  message = 'Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.',
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#111111] mb-2">{title}</h3>
              <p className="text-[#666666] leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 hover:bg-[#F9F9F9] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#666666]" />
            </button>
          </div>
        </div>

        <div className="bg-[#F9F9F9] px-6 py-4 flex gap-3">
          <Button
            onClick={onCancel}
            className="flex-1 bg-white hover:bg-[#F9F9F9] text-[#111111] border border-[#E5E5E5] font-semibold py-3 rounded-xl transition-colors"
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}
