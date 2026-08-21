// src/views/pages/rh/contrats/hooks/useClickOutside.ts
// Extrait tel quel de Contrats.tsx
import { useEffect, useRef } from 'react'

function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [cb]);
  return ref;
}

export default useClickOutside
