import 'reflect-metadata';
import React, { DependencyList, ReactNode, createContext, useContext, useMemo } from 'react';
import { ComponentProvider, Constructor, ProviderKey, ResolutionType, StaticKey, Provider } from './utils/types';
import { DependencyResolver } from './utils/DependencyResolver';

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
export function useResolver<T>(key: StaticKey<T>, resolution?: ResolutionType, deps?: DependencyList): T | undefined;
export function useResolver<T>(key: Constructor<T>, resolution?: ResolutionType, deps?: DependencyList): T | undefined;
export function useResolver<T>(key: Constructor<T>, deps?: DependencyList): T | undefined;
export function useResolver<T>(
  key: ProviderKey<T>,
  depsOrResolution?: ResolutionType | DependencyList,
  deps?: DependencyList
): T | undefined {
  let resolution: ResolutionType | undefined;

  if (!deps && Array.isArray(depsOrResolution)) {
    deps = depsOrResolution;
  } else {
    resolution = depsOrResolution as ResolutionType;
  }

  const context = useContext(DependencyContext);
  const resolved = useMemo(() => context?.get<T>(key, resolution as ResolutionType), deps);

  return resolved;
}

export function useResolveContext(): DependencyResolver | undefined {
  return useContext(DependencyContext);
}

export default DependencyProvider;
