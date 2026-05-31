import { useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  function dismiss() {
    setExiting(true);
    setTimeout(() => onRemove(item.id), 280);
  }

  useEffect(() => {
    const t = setTimeout(dismiss, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`toast ${item.type} ${exiting ? "exiting" : ""}`}>
      <span
        className="toast-icon"
        style={{
          color:
            item.type === "success" ? "var(--ok)"
            : item.type === "error" ? "var(--danger)"
            : "var(--primary-light)",
        }}
      >
        {ICONS[item.type]}
      </span>
      <div className="toast-content">
        <div className="toast-title">{item.title}</div>
        {item.message && <div className="toast-msg">{item.message}</div>}
      </div>
      <button className="toast-close" onClick={dismiss}>×</button>
    </div>
  );
}

/* ─── Global toast manager ─────────────────────────────── */
type Listener = (items: ToastItem[]) => void;
let _items: ToastItem[] = [];
let _listeners: Listener[] = [];

function notify() {
  _listeners.forEach((l) => l([..._items]));
}

export function showToast(type: ToastType, title: string, message?: string) {
  const id = Math.random().toString(36).slice(2);
  _items = [..._items, { id, type, title, message }];
  notify();
}

export function toast(title: string, message?: string) { showToast("success", title, message); }
export function toastError(title: string, message?: string) { showToast("error", title, message); }
export function toastInfo(title: string, message?: string) { showToast("info", title, message); }

/* ─── Container component ──────────────────────────────── */
export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const l: Listener = (list) => setItems(list);
    _listeners.push(l);
    return () => { _listeners = _listeners.filter((x) => x !== l); };
  }, []);

  function remove(id: string) {
    _items = _items.filter((x) => x.id !== id);
    notify();
  }

  if (items.length === 0) return null;
  return (
    <div className="toast-container">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onRemove={remove} />
      ))}
    </div>
  );
}

/* ─── Legacy prop-based Toast for backward compat ─────── */
export function SimpleToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast-container">
      <div className="toast success" role="status">
        <span className="toast-icon" style={{ color: "var(--ok)" }}>✓</span>
        <div className="toast-content">
          <div className="toast-title">{message}</div>
        </div>
        <button className="toast-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}
