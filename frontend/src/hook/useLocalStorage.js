import { useState, useCallback, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch (e) {
      console.error('Error reading localStorage key “' + key + '”:', e);
      return initialValue;
    }
  });

  const setAndStore = useCallback(newValue => {
    try {
      const computed = newValue instanceof Function ? newValue(value) : newValue;
      setValue(computed);
      window.localStorage.setItem(key, JSON.stringify(computed));
    } catch (e) {
      console.error('Error setting localStorage key “' + key + '”:', e);
    }
  }, [key, value]);

  // Optional: recueillir les changements faits dans d'autres onglets
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key && e.newValue !== null) {
        setValue(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [value, setAndStore];
}

export default useLocalStorage;