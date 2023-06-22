import { ComponentProviderMap, ObjectCreator, ProviderMap } from './ObjectCreator';
import { ComponentProvider, ComponentProviderKey, Provider, ProviderKey, ResolutionType } from './types';

export class DependencyResolver {
  private _parent?: DependencyResolver;
  private _map: ProviderMap = new Map();
  private _componentMap: ComponentProviderMap = new Map();

  constructor(providers: Provider[], componentProviders: ComponentProvider[] = [], parent?: DependencyResolver) {
    providers.forEach((provider) => {
      const key = provider.provide;
      const creator = new ObjectCreator(provider);
      if (creator.lifetime === 'singleton' && (this._map.has(key) || parent?._getCreator(key))) {
        throw new Error(
          `[Dependency] Singleton for ${String(
            provider.provide
          )} is already exist. Singleton Mapping can only be added once.`
        );
      }
      this._map.set(key, creator);
    });

    componentProviders.forEach((provider) => {
      this._componentMap.set(provider.provide, provider.use);
    });

    this._parent = parent;
  }

  get<T>(key: ProviderKey<T>): T | undefined;
  get<T>(key: ProviderKey<T>, resolution: ResolutionType): T | undefined;
  get<T>(key: ProviderKey<T>, resolution?: ResolutionType): T | undefined {
    return this._getCreator<T>(key, resolution)?.get<T>((key, resolution) => this._getCreator(key, resolution));
  }

  getComponent<T>(key: ComponentProviderKey<T>): ComponentProviderKey<T> {
    return this._componentMap.get(key) ?? this._parent?.getComponent(key) ?? key;
  }

  private _getCreator<T>(key: ProviderKey<T>, resolution?: ResolutionType): ObjectCreator<T> | undefined {
    switch (resolution) {
      case 'onlySelf':
        return this._map.get(key);
      case 'skipSelf':
        if (this._parent) return this._parent?._getCreator(key);
        else return this._getCreator(key);
      default:
        return this._map.get(key) ?? this._parent?._getCreator(key);
    }
  }
}
