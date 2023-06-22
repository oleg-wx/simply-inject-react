import { DependencyList, useEffect } from 'react';


export default function useEffectDebounced(debounceMs: number, callback: () => void, deps?: DependencyList) {
    useEffect(() => {
        const to_ = setTimeout(() => {
            callback();
        }, debounceMs);

        return () => {
            clearTimeout(to_);
        };
    }, deps);
}
