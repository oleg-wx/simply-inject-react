import { DependencyList, useEffect } from 'react';

export default function useEffectAsync(callback: () => Promise<void | (() => void | undefined)>, deps?: DependencyList) {
  useEffect(() => {
    const res = callback();

    return () => {
      res?.then((e) => {
        if (typeof e === 'function') {
          e();
        }
      });
    };
  }, deps);
}


