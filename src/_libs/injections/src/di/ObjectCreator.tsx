import {
  ComponentProviderKey,
  Constructor,
  ConstructorProvider,
  FactoryProvider,
  Lifetime,
  Provider,
  ProviderKey,
  ResolutionStrategy,
  ValueProvider,
} from './types';
import { throwCircleDependencyError, throwMetadataError, throwRequiredError } from './throwErrors';
import { defineMetadata, getMetadata, isMetadataEnabled } from './utils/getMetadata';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreatorGetter<T = any> = <T2 = unknown>(
  key: ProviderKey<T2>,
  resolution: ResolutionStrategy
) => ObjectCreator<T> | undefined;

const injectable_ = Symbol('injectable_');
const inject_ = Symbol('inject_');
const inject_resolution_ = Symbol('inject_resolution_');
const required_ = Symbol('required_');

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
    chain.add(this.provide);

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
      return this.factory((key, resolution) => {
        if (isCircle(key, chain, resolution)) {
          throw throwCircleDependencyError(chain);
        }

        return getCreator(key, resolution ?? 'default')?._get(getCreator, chain);
      }) as TCreate;
    } else {
      ctor = this.use;
      if (!ctor && typeof this.provide === 'function') {
        ctor = this.provide;
      }
    }

    if (ctor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argsInjections = (getMetadata(inject_, ctor) ?? []) as any[];

      const resolutions = getResolutions(ctor);
      const required = getRequired(ctor);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const args: any[] = argsInjections.map((inj, index) => {
        const key = inj;

        const resolution = resolutions[index];

        if (isCircle(key, chain, resolution)) {
          throw throwCircleDependencyError(chain);
        } else if (String(key).indexOf('function Object()') < 0) {
          chain.add(key)
        }

        const impl = getCreator(key, resolution)?._get(getCreator, chain) ?? undefined;

        if (!impl && required[index]) {
          throwRequiredError(key, chain);
        }

        return impl;
      });

      return Reflect.construct(ctor, args);
    }
  }
}

export function Injectable() {
  if (!isMetadataEnabled(Object)) {
    throwMetadataError();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  return function <TFunc extends Function>(target: TFunc, _context?: any) {
    const args: unknown[] = getMetadata(design_param_types, target) ?? [];
    const customArgs: unknown[] = getMetadata(inject_, target) ?? [];
    customArgs.forEach((arg, i) => arg !== undefined && (args[i] = arg));
    //if (!args) throwMetadataError();
    defineMetadata(injectable_, true, target);
    defineMetadata(inject_, args, target);

    return target;
  };
}

export function Inject(): ParameterDecorator;
export function Inject(inject: ProviderKey): ParameterDecorator;
export function Inject(inject?: ProviderKey): ParameterDecorator {
  return (target: NonNullable<unknown>, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!inject) {
      const args = getMetadata(design_param_types, target) ?? [];
      //if (!args) throwMetadataError();
      inject = args[parameterIndex];
    }
    const args: unknown[] = getMetadata(inject_, target) ?? [];

    args[parameterIndex] = inject;
    defineMetadata(inject_, args, target);
  };
}

export function Resolution(resolution: ResolutionStrategy): ParameterDecorator {
  return (target: NonNullable<unknown>, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (resolution) {
      const resolutions: (ResolutionStrategy | undefined)[] = getMetadata(inject_resolution_, target) ?? [];
      resolutions[parameterIndex] = resolution;
      defineMetadata(inject_resolution_, resolutions, target);
    }
  };
}

export function Required(): ParameterDecorator {
  return (target: NonNullable<unknown>, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const required: (boolean | undefined)[] = getMetadata(required_, target) ?? [];
    required[parameterIndex] = true;
    defineMetadata(required_, required, target);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResolutions(target: any): ResolutionStrategy[] {
  return target ? getMetadata(inject_resolution_, target) ?? [] : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRequired(target: any): (boolean | undefined)[] {
  return target ? getMetadata(required_, target) ?? [] : [];
}

function isCircle(key: ProviderKey, chain: Set<ProviderKey>, resolution: ResolutionStrategy = 'default') {
  return chain.has(key) && resolution !== 'skipSelf';
}
