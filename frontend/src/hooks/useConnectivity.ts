import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection Restored!", {
        description: "You're back online. Data will sync automatically.",
      });
      // Optionally reload data
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are Offline", {
        description: "Please check your internet connection.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
