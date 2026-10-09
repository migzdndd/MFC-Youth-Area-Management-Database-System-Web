import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      className="bg-amber-600 text-white text-xs sm:text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 z-50 sticky top-0"
      aria-label="Offline connection alert"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Working offline. New records will sync automatically when your connection is restored.</span>
    </aside>
  );
};
