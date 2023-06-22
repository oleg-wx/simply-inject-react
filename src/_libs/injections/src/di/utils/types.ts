/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ComponentClass, FunctionComponent } from 'react';

export type Constructor<T> =
  | (abstract new (...args: any[]) => T)
  | (new (...args: any[]) => T)
  | (Function & { prototype: T });

type Value<T> = T;

type Factory<T> = (provider: <SubT>(provide: ProviderKey<SubT>) => SubT | undefined) => T;

export type LifetimeType = 'singleton' | 'scoped' | 'transient' | 'looped';
export type ResolutionType = 'default' | 'onlySelf' | 'skipSelf';

export class StaticKey<T> {
  readonly for: T = undefined as any;
  constructor(public readonly key: string) {}
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
  lifetime?: LifetimeType;
}

export interface FactoryProvider<T = unknown> extends BasicProvider<T> {
  provide: ProviderKey;
  useFactory?: Factory<T>;
  lifetime?: LifetimeType;
}

export interface ComponentProvider<T = any> {
  provide: ComponentProviderKey<T>;
  use: ComponentProviderKey<T>;
}

export type Provider<T = any> = ValueProvider<T> | ConstructorProvider<T> | FactoryProvider<T>;

export function provideClass<T = any>(provide: ProviderKey<T>, lifetime?: LifetimeType): ConstructorProvider<T>;
export function provideClass<T = any>(
  provide: ProviderKey<T>,
  constructor?: Constructor<T>,
  lifetime?: LifetimeType
): ConstructorProvider<T>;
export function provideClass<T = any>(
  provide: ProviderKey<T>,
  constructorOrLifetime?: Constructor<T> | LifetimeType,
  lifetime?: LifetimeType
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
  lifetime: LifetimeType = 'transient'
): FactoryProvider<T> {
  return { provide, useFactory: factory, lifetime };
}

export function provideValue<T = any>(provide: ProviderKey<T>, value: Value<T>): ValueProvider<T> {
  return { provide, useValue: value };
}

export function getKey<T>(key: ProviderKey<T>) {
  return key instanceof StaticKey ? key.key : key;
}

export function provideComponent<T>(key: ComponentProviderKey<T>): ComponentProvider<T>;
export function provideComponent<T>(key: ComponentProviderKey<T>, use: ComponentProviderKey<T>): ComponentProvider<T>;
export function provideComponent<T>(key: ComponentProviderKey<T>, use?: ComponentProviderKey<T>): ComponentProvider<T> {
  return { provide: key, use: use ?? key };
}
