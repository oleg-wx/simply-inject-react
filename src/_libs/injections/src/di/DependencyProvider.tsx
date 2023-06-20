import 'reflect-metadata';
import React, { DependencyList, ReactNode, createContext, useContext, useMemo } from 'react';
import { DependencyResolver, StaticKey } from './utils';
import { Constructor, Provider, ProviderKey, ComponentProvider } from './utils';

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

export function useResolver<T>(key: StaticKey<T> | string, deps?: DependencyList): T | undefined;
export function useResolver<T>(key: Constructor<T>, deps?: DependencyList): T | undefined;
export function useResolver<T>(key: ProviderKey<T>, deps?: DependencyList): T | undefined {
  const context = useContext(DependencyContext);
  const resolved = useMemo(() => context?.get<T>(key), deps);

  return resolved;
}

export function useResolveContext(): DependencyResolver | undefined {
  return useContext(DependencyContext);
}

export default DependencyProvider;
