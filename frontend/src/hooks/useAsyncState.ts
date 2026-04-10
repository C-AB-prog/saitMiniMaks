import { useState } from 'react';

export const useAsyncState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = async <T,>(promiseFactory: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      return await promiseFactory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setError,
    wrap
  };
};
