import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 480 }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h3 id="modal-title" className="font-bold text-on-surface">{title}</h3>}
          <button
            className="ml-auto p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            onClick={onClose}
            aria-label="Kapat"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}

interface ConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmClass?: string;
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title = "Emin misin?",
  message, confirmLabel = "Onayla", confirmClass,
}: ConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={400}>
      <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors"
          onClick={onClose}
        >
          İptal
        </button>
        <button
          className={confirmClass?.includes("danger")
            ? "px-4 py-2 rounded-xl bg-error text-white text-sm font-semibold hover:bg-error/90 transition-colors"
            : "px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors"
          }
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
