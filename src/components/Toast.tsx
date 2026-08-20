'use client';

import { useEffect, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let nextId = 1;
const listeners = new Set<(item: ToastItem) => void>();

/** includes/footer.php: toast() -ийн орлого — хаанаас ч дуудаж болно */
export function toast(message: string, type: 'success' | 'error' = 'success') {
  const item = { id: nextId++, message, type };
  listeners.forEach((fn) => fn(item));
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (item: ToastItem) => {
      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }, 2500);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 items-end">
      {items.map((item) => (
        <div
          key={item.id}
          className={`px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            item.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
