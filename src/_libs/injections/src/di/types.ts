/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ComponentClass, FunctionComponent } from 'react';

export type Constructor<T> =
  | (abstract new (...args: any[]) => T)
  | (new (...args: any[]) => T)
  | (Function & { prototype: T });

type Value<T> = T;

export type Lifetime = 'singleton' | 'scoped' | 'transient' | 'looped';
export type ResolutionStrategy = 'default' | 'onlySelf' | 'skipSelf';

type Factory<T> = (provider: <SubT>(provide: ProviderKey<SubT>, resolution?: ResolutionStrategy) => SubT | undefined) => T;

export class StaticKey<T> {
  readonly for: T = undefined as any;
  readonly name: string;
  constructor(key: string) {
    this.name = key;
  }
}

export type ProviderKey<T = any> = Constructor<T> | StaticKey<T>;
export type ComponentProviderKey<T = any> = ComponentClass<T> | FunctionComponent<T>;

interface BasicProvider<T> {
  provide: ProviderKey<T>;
}

export interface ValueProvider<T = unknown> extends BasicProvider<T> {
  provide: ProviderKey<T>;
  useValue: Value<T>;
}

export interface ConstructorProvider<T = unknown> extends BasicProvider<T> {
  provide: ProviderKey<T>;
  use?: Constructor<T>;
  lifetime?: Lifetime;
}

export interface FactoryProvider<T = unknown> extends BasicProvider<T> {
  provide: ProviderKey;
  useFactory?: Factory<T>;
  lifetime?: Lifetime;
}

export interface ComponentProvider<T = any> {
  provide: ComponentProviderKey<T>;
  use: ComponentProviderKey<T>;
}

export type Provider<T = any> = ValueProvider<T> | ConstructorProvider<T> | FactoryProvider<T>;

export function provideClass<T = any>(provide: ProviderKey<T>, lifetime?: Lifetime): ConstructorProvider<T>;
export function provideClass<T = any>(
  provide: ProviderKey<T>,
  constructor?: Constructor<T>,
  lifetime?: Lifetime
): ConstructorProvider<T>;
export function provideClass<T = any>(
  provide: ProviderKey<T>,
  constructorOrLifetime?: Constructor<T> | Lifetime,
  lifetime?: Lifetime
): ConstructorProvider<T> {
  if (typeof constructorOrLifetime === 'string') {
    lifetime = constructorOrLifetime;
    constructorOrLifetime = undefined;
  }

  return { provide, use: constructorOrLifetime, lifetime };
}

export function provideFactory<T = any>(
  provide: ProviderKey<T>,
  factory: Factory<T>,
  lifetime?: Lifetime
): FactoryProvider<T> {
  return { provide, useFactory: factory, lifetime };
}

export function provideValue<T = any>(provide: ProviderKey<T>, value: Value<T>): ValueProvider<T> {
  return { provide, useValue: value };
}

export function getKey<T>(key: ProviderKey<T>) {
  return key instanceof StaticKey ? key.name : key;
}

export function provideComponent<T>(key: ComponentProviderKey<T>): ComponentProvider<T>;
export function provideComponent<T>(key: ComponentProviderKey<T>, use: ComponentProviderKey<T>): ComponentProvider<T>;
export function provideComponent<T>(key: ComponentProviderKey<T>, use?: ComponentProviderKey<T>): ComponentProvider<T> {
  return { provide: key, use: use ?? key };
}
