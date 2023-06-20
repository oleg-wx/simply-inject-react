import 'reflect-metadata';
import {
  ComponentProviderKey,
  Constructor,
  ConstructorProvider,
  FactoryProvider,
  Lifetime,
  Provider,
  ProviderKey,
  ValueProvider,
  getKey,
} from './types';

const DEBUG = (window as any).DEBUG;

const injectable_ = Symbol('injectable_');
const inject_ = Symbol('inject_');
const design_param_types = 'design:paramtypes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProviderMap = Map<ProviderKey, ObjectCreator<any>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentProviderMap = Map<ComponentProviderKey<any>, ComponentProviderKey<any>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ObjectCreator<T = any> {
  private static SINGLETONS = new Map<ProviderKey, unknown>();

  private _rqto?: ReturnType<typeof setTimeout>;
  private _object?: T;

  readonly lifetime: Lifetime = 'scoped';
  readonly provide: ProviderKey<T>;
  readonly use?: Constructor<T>;
  readonly factory?: FactoryProvider<T>['useFactory'];
  readonly value?: T;

  constructor(provider: Provider<T>, private _providerMap: ProviderMap) {
    this.provide = provider.provide;
    if (Object.prototype.hasOwnProperty.call(provider as ValueProvider<T>, 'useValue')) {
      this.lifetime = 'scoped';
      this.value = (provider as ValueProvider<T>).useValue;
    } else {
      this.lifetime = (provider as ConstructorProvider<T>).lifetime ?? 'scoped';
      this.use = (provider as ConstructorProvider<T>).use;
      this.factory = (provider as FactoryProvider<T>).useFactory;
    }
  }

  get<TCreate extends T>(): TCreate | undefined {
    return this._get<TCreate>();
  }

  create<TCreate extends T>(): TCreate {
    return this._create() as TCreate;
  }

  private _get<TCreate extends T>(chain: Set<ProviderKey> = new Set()): TCreate | undefined {
    DEBUG && console.log('get');
    if (this.lifetime === 'singleton') {
      let singleton = ObjectCreator.SINGLETONS.get(this.provide) as TCreate | undefined;
      if (singleton == null) {
        singleton = this._create<TCreate>(chain);
        ObjectCreator.SINGLETONS.set(this.provide, singleton);
      }

      return singleton;
    } else if (this.lifetime === 'transient') {
      return this._create(chain);
    } else {
      if (this.lifetime === 'loop') {
        clearTimeout(this._rqto);
        this._rqto = setTimeout(() => {
          this._object = undefined;
          delete this._rqto;
        });
      }

      return this._object ? (this._object as unknown as TCreate) : (this._object = this._create<TCreate>(chain));
    }
  }

  private _create<TCreate extends T>(chain: Set<ProviderKey> = new Set()): TCreate | undefined {
    DEBUG && console.log('create');
    let ctor: Constructor<unknown> | undefined;
    if (this.value != null) {
      return this.value as TCreate;
    } else if (this.factory) {
      return this.factory((key) => this._providerMap.get(key)?._get(chain)) as TCreate;
    } else {
      ctor = this.use;
      if (!ctor && typeof this.provide === 'function') {
        ctor = this.provide;
      }
    }

    if (ctor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argsInjections = (Reflect.getMetadata(inject_, ctor) ?? []) as any[];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const args: any[] = argsInjections.map((inj) => {
        const key = getKey(inj);

        if (chain.has(key)) {
          throw new Error(`${chain.values().next().value} has cycle dependency for ${inj}`);
        }

        if (String(key).indexOf('function Object()') < 0) chain.add(key);

        return this._providerMap.get(key)?._get(chain) ?? undefined;
      });

      return Reflect.construct(ctor, args);
    }
  }
}

export function Injectable() {
  DEBUG && console.log('Injectable pre');

  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  return function <TFunc extends Function>(target: TFunc, _context?: any) {
    DEBUG && console.log('Injectable');
    const args: unknown[] = Reflect.getMetadata(design_param_types, target) ?? [];
    const customArgs: unknown[] = Reflect.getMetadata(inject_, target) ?? [];
    customArgs.forEach((arg, i) => arg !== undefined && (args[i] = arg));
    //if (!args) throwMetadataError();
    Reflect.defineMetadata(injectable_, true, target);
    Reflect.defineMetadata(inject_, args, target);

    return target;
  };
}

export function Inject(inject: ProviderKey): ParameterDecorator;
export function Inject(inject?: ProviderKey): ParameterDecorator {
  DEBUG && console.log('Inject pre');

  return (target: NonNullable<unknown>, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    DEBUG && console.log('Inject');
    if (!inject) {
      const args = Reflect.getMetadata(design_param_types, target) ?? [];
      //if (!args) throwMetadataError();
      inject = args[parameterIndex];
    }
    const args: unknown[] = Reflect.getMetadata(inject_, target) ?? [];
    args[parameterIndex] = inject;
    Reflect.defineMetadata(inject_, args, target);
  };
}
