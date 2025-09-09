import { useEffect } from 'react';

export default function useAutoRefresh(callback, delay = 60000) {
  useEffect(() => {
    callback(); 

    const intervalId = setInterval(() => {
      callback();
    }, delay);

    return () => clearInterval(intervalId);
  }, [callback, delay]);
}
