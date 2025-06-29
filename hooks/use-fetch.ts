import { useState } from 'react';
import { toast } from 'sonner';

type AsyncFunction<TArgs extends any[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

const useFetch = <TArgs extends any[], TResult>(
  cb: AsyncFunction<TArgs, TResult>
) => {
  const [data, setData] = useState<TResult | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: TArgs): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('unknown error');
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, fn, error, setData };
};

export default useFetch;
