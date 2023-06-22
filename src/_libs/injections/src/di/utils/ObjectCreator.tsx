import 'reflect-metadata';
import {
  ComponentProviderKey,
  Constructor,
  ConstructorProvider,
  FactoryProvider,
  LifetimeType,
  Provider,
  ProviderKey,
  ResolutionType,
  ValueProvider,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreatorGetter<T = any> = <T2 = unknown>(
  key: ProviderKey<T2>,
  resolution: ResolutionType
) => ObjectCreator<T> | undefined;

const injectable_ = Symbol('injectable_');
const inject_ = Symbol('inject_');
const inject_resolution_ = Symbol('inject_resolution_');
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

  readonly lifetime: LifetimeType = 'scoped';
  readonly provide: ProviderKey<T>;
  readonly use?: Constructor<T>;
  readonly factory?: FactoryProvider<T>['useFactory'];
  readonly value?: T;

  constructor(provider: Provider<T>) {
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

  get<TCreate extends T>(getCreator: CreatorGetter<unknown>): TCreate | undefined {
    return this._get<TCreate>(getCreator);
  }

  create<TCreate extends T>(getCreator: CreatorGetter<unknown>): TCreate {
    return this._create(getCreator) as TCreate;
  }

  private _get<TCreate extends T>(
    getCreator: CreatorGetter<unknown>,
    chain: Set<ProviderKey> = new Set()
  ): TCreate | undefined {
    if (this.lifetime === 'singleton') {
      let singleton = ObjectCreator.SINGLETONS.get(this.provide) as TCreate | undefined;
      if (singleton == null) {
        singleton = this._create<TCreate>(getCreator, chain);
        ObjectCreator.SINGLETONS.set(this.provide, singleton);
      }

      return singleton;
    } else if (this.lifetime === 'transient') {
      return this._create(getCreator, chain);
    } else {
      if (this.lifetime === 'looped') {
        clearTimeout(this._rqto);
        this._rqto = setTimeout(() => {
          this._object = undefined;
          delete this._rqto;
        });
      }

      return this._object
        ? (this._object as unknown as TCreate)
        : (this._object = this._create<TCreate>(getCreator, chain));
    }
  }

  private _create<TCreate extends T>(
    getCreator: CreatorGetter<unknown>,
    chain: Set<ProviderKey> = new Set()
  ): TCreate | undefined {
    let ctor: Constructor<unknown> | undefined;
    if (this.value != null) {
      return this.value as TCreate;
    } else if (this.factory) {
      return this.factory((key) => getCreator(key, 'default')?._get(getCreator, chain)) as TCreate;
    } else {
      ctor = this.use;
      if (!ctor && typeof this.provide === 'function') {
        ctor = this.provide;
      }
    }

    if (ctor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argsInjections = (Reflect.getMetadata(inject_, ctor) ?? []) as any[];

      const resolutions = getResolutions(ctor);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const args: any[] = argsInjections.map((inj, index) => {
        const key = inj;

        if (chain.has(key)) {
          throw new Error(`${chain.values().next().value} has cycle dependency for ${inj}`);
        }

        if (String(key).indexOf('function Object()') < 0) chain.add(key);

        return getCreator(key, resolutions[index])?._get(getCreator, chain) ?? undefined;
      });

      return Reflect.construct(ctor, args);
    }
  }
}

export function Injectable() {
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  return function <TFunc extends Function>(target: TFunc, _context?: any) {
    const args: unknown[] = Reflect.getMetadata(design_param_types, target) ?? [];
    const customArgs: unknown[] = Reflect.getMetadata(inject_, target) ?? [];
    customArgs.forEach((arg, i) => arg !== undefined && (args[i] = arg));
    //if (!args) throwMetadataError();
    Reflect.defineMetadata(injectable_, true, target);
    Reflect.defineMetadata(inject_, args, target);

    return target;
  };
}

export function Inject(): ParameterDecorator;
export function Inject(inject: ProviderKey): ParameterDecorator;
export function Inject(inject?: ProviderKey): ParameterDecorator {
  return (target: NonNullable<unknown>, propertyKey: string | symbol | undefined, parameterIndex: number) => {
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

export function Resolution(resolution: ResolutionType): ParameterDecorator {
  return (target: NonNullable<unknown>, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (resolution) {
      const resolutions: (ResolutionType | undefined)[] = Reflect.getMetadata(inject_resolution_, target) ?? [];
      resolutions[parameterIndex] = resolution;
      Reflect.defineMetadata(inject_resolution_, resolutions, target);
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResolutions(target: any): ResolutionType[] {
  return target ? Reflect.getMetadata(inject_resolution_, target) ?? [] : [];
}
