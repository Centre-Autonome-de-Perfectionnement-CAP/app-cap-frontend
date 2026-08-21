// src/views/pages/rh/contrats/hooks/useToasts.ts
// Extrait tel quel de Contrats.tsx
import { useCallback, useRef, useState } from 'react'
import type { Toast, ToastType } from '../Contrats.types'

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = useRef(0);
  const add = useCallback((type: ToastType, title: string, message?: string, duration = 4500) => {
    const id = ++nextId.current;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  const remove = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}


export default useToasts
