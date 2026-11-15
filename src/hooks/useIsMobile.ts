import { useEffect, useState } from 'react';

/**
 * True while the viewport is below Tailwind's `sm` breakpoint (640px).
 * Used to render fewer homepage items on phones so the mobile homepage
 * scrolls much shorter — desktop keeps the full lists.
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};
