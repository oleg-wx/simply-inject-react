import { DependencyList, ReactNode, createContext, useContext, useMemo } from 'react';
import { ComponentProvider, Constructor, ProviderKey, ResolutionStrategy, StaticKey, Provider } from './types';
import { DependencyResolver } from './DependencyResolver';

const DependencyContext = createContext<DependencyResolver>(undefined!);

export const DependencyProvider = function (props: {
  provide: Provider[];
  components?: ComponentProvider[];
  children?: ReactNode;
}) {
  const { provide, components } = props;

  const resolverParent = useContext(DependencyContext);
  const resolverMemo = useMemo(
    () => new DependencyResolver(provide, components, resolverParent),
    [provide, components]
  );

  return <DependencyContext.Provider value={resolverMemo}>{props.children ?? null}</DependencyContext.Provider>;
};

export function useResolver<T>(key: StaticKey<T>, deps?: DependencyList): T | undefined;
export function useResolver<T>(key: StaticKey<T>, resolution?: ResolutionStrategy, deps?: DependencyList): T | undefined;
export function useResolver<T>(key: Constructor<T>, resolution?: ResolutionStrategy, deps?: DependencyList): T | undefined;
export function useResolver<T>(key: Constructor<T>, deps?: DependencyList): T | undefined;
export function useResolver<T>(
  key: ProviderKey<T>,
  depsOrResolution?: ResolutionStrategy | DependencyList,
  deps?: DependencyList
): T | undefined {
  let resolution: ResolutionStrategy | undefined;

  if (!deps && Array.isArray(depsOrResolution)) {
    deps = depsOrResolution;
  } else {
    resolution = depsOrResolution as ResolutionStrategy;
  }

  const context = useContext(DependencyContext);
  const resolved = useMemo(() => context?.get<T>(key, resolution as ResolutionStrategy), deps);

  return resolved;
}

export function useResolveContext(): DependencyResolver | undefined {
  return useContext(DependencyContext);
}

export default DependencyProvider;
