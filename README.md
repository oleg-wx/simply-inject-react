# Simply Inject for React

Simplest **dependency injection** for **React** using _Context_. Nothing fancy...  
_[Typescript support]_  
_[React 16.+]_

#### (v0.1.0.beta)

### Install

```
npm i @symplx/inject-react
```

### Requirements

If you want to utilize **decorators** and especially **Injections** capability it will be necessary to enable support for them. If you choose not to use **decorators**, you can still manage your dependencies using [**factories**](#factory).

**React** _create-react-app_ and _react-scripts_ configurations do not natively support **Decorators**. However, there are some plugins available that can help you incorporate this functionality into your project.

To begin, I recommend using the `babel-plugin-transform-typescript-metadata` plugin, as it enables the parsing of decorators using the "@" symbol. Additionally, ensure that the `experimentalDecorators` and `emitDecoratorMetadata` options in your tsconfig.json file are set to true.

In order to fully leverage decorators, it may be beneficial to include the `@babel/plugin-proposal-decorators` and `@babel/plugin-proposal-class-properties` plugins. These will provide additional support and capabilities for working with decorators in your codebase.  
Furthermore, if you'd like to enable _path aliases_, allowing for more concise import statements, you'll need to make adjustments to the webpack configuration without _ejecting_ the application. One option I personally recommend which allows you to customize the `create-react-app` configuration is using `react-app-rewired` with `customize-cra` but there are other options...

```
npm i -D react-app-rewired customize-cra babel-plugin-transform-typescript-metadata @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties
```

```javascript
// config-overrides.js
const path = require('path');
const { useBabelRc, override, addWebpackAlias } = require('customize-cra');

module.exports = override(useBabelRc());
```

```javascript
// .babelrc.js
module.exports = {
  plugins: [
    'babel-plugin-transform-typescript-metadata',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
};
```

To enable **decorators** in your application, you need to add support for `reflect-metadata`. This can be done by including the following line at the beginning of your index.tsx file:

```typescript
// index.tsx
import 'reflect-metadata';
```

By importing the `reflect-metadata` package, you ensure that the necessary metadata reflection capabilities are available to support decorators throughout your application.
Make sure to add this import statement at the top of your index.tsx file, before any other code, to ensure that the metadata support is initialized from the beginning.

### Decorators

### Basics

To add dependency injection and resolve implementations, you should wrap your components with a `DependencyProvider` and provide the necessary dependencies. Here's an example of how you can achieve this:

```jsx
// App.tsx
<DependencyProvider provide={[provideClass(MyServiceAbstract, MyServiceConcrete)]}>
  {/* Components that will use Provider */}
  <SomeComponent />
</DependencyProvider>
```

To resolve the dependency, you can utilize the `useResolver` hook. This hook already includes memoization functionality, ensuring efficient dependency resolution. Make sure to pass the dependencies array as the last parameter. This will ensure that the resolver function is re-evaluated only when the dependencies change, optimizing performance.

```jsx
// SomeComponent.tsx
const myService = useResolver(MyServiceAbstract);
return <>{myService.value}</>;
```

```typescript
// MyService.ts
export abstract class MyServiceAbstract {
  value?: string;
}

@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  value = 'Hello Service';
}
```

You have the flexibility to nest `DependencyProvider` within each other to override dependencies. When a child `DependencyProvider` is nested inside a parent, it has access to the dependencies provided by the parent. This allows you to selectively override specific dependencies at different levels of your component tree, providing a granular control over dependency injection.

### Providers

In your dependency injection setup, you have the flexibility to provide implementations using **classes**, **factories**, or **values**

```typescript
provideClass(MyServiceAbstract, MyServiceConcrete);

provideFactory(MyServiceAbstract, ()=>new MyServiceConcrete());

const SERVICE = new StaticKey<IService>("SERVICE");
provideValue(SERVICE, { ... });
```

### Lifetime

There are four different lifetimes available for managing the lifespan of dependencies:

1. **Scoped** (default): Scoped lifetime means that a single instance of the dependency is created and shared within the scope of the `DependencyProvider`, all dependencies within that scope will share the same instance.

2. **Transient**: Transient lifetime creates a new instance of the dependency every time it is requested. Each time a dependency is resolved, a new instance is created, ensuring a fresh copy of the dependency is used.

3. **Looped**: Looped lifetime is similar to transient, but it is scoped for one event loop. It means that within the same event loop, the same instance of the dependency will be reused. However, when the event loop ends, the dependency will be disposed, and a new instance will be created in the next event loop if needed.

4. **Singleton**: Singleton lifetime ensures that only one instance of the dependency is created throughout the entire application. It can be added only once in any `DependencyProvider` and is shared across all parts of the application. It is recommended to add the Singleton scope to the top-most parent when configuring your dependency injection setup.

It is **important** to be **cautious** when injecting services with shorter lifecycles into those with longer lifecycles. When a service with a shorter lifespan is injected into a service with a longer lifespan, it can lead to unexpected behavior or memory leaks.

```typescript
provideClass(MyServiceAbstract, MyServiceConcrete, 'transient');
```

### Injections

```typescript
// MyService.ts
export abstract class SomeStrategyAbstract {}

@Injectable()
export class SomeStrategyConcrete {}

export abstract class MyServiceAbstract {}

@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  constructor(public strategy: SomeStrategyAbstract) {}
}
```

You might specify direct dependency with `@Inject`, without it injection will be provided automatically by _metadata_ so for interfaces and object it is mandatory to use `@Inject` with `StaticKey`.

When using dependency injection in your application, you have the option to specify a direct dependency using the `@Inject` decorator. By using `@Inject`, you explicitly declare the dependency and indicate that it should be injected into the corresponding component or service.  
Use `StaticKey` to represent an interface or object, you would typically use the `@Inject` decorator to specify the dependency and ensure that the correct implementation is injected.

```typescript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  constructor(@Inject(SomeStrategyAbstract) public strategy: SomeStrategyAbstract) {}
}
```

```typescript
export const RESOURCE_URL = new StaticKey()<string>('RESOURCE_URL');

@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  constructor(@Inject(RESOURCE_URL) public url: string) {}
}
```

### Factory

Factories in the context of dependency injection allow you to create dependencies by calling a factory method. Instead of directly providing an instance of a class or a value, you provide a factory function that is responsible for creating the instance.  
The factory method receives a resolve function as an argument. This resolve function allows the factory to request and obtain other dependencies needed to construct the desired object.

```jsx
<DependencyProvider provide={[provideFactory(MyServiceConcrete, () => new MyServiceConcrete())]}></DependencyProvider>

<DependencyProvider provide={[provideFactory(MyServiceConcrete, (resolve) => new MyServiceConcrete(resolve(MY_DEPENDENCY)))]}></DependencyProvider>
```

Moreover if you prefer not to use metadata, configure webpack loaders, or make additional modifications, using factories is your way to go!

[See](#factory-example)

### Resolutions

When resolving dependencies using dependency injection, you have several options to control how dependencies are resolved within the dependency hierarchy.

1. **skipSelf**: This resolution strategy instructs the dependency injection to skip the closest `DependencyProvider` and look for the dependency in the next available provider in the hierarchy. It allows you to bypass the immediate provider and access a dependency from a higher-level provider.

2. **onlySelf**: With this resolution strategy, the dependency injection will only consider dependencies from the closest `DependencyProvider`. It restricts the resolution to the immediate provider and prevents the framework from searching for dependencies further up the hierarchy.

3. **default**: The default resolution strategy instructs the framework to perform a lookup for the dependency in every `DependencyProvider` in the upward hierarchy.

Additionally, **singletons**, by their nature, they ignore resolution strategies and retrieve their dependencies global app-level container, disregarding any specific resolution requests.

```typescript
const skipSelf = useResolver(MyServiceAbstract, 'skipSelf');
const onlySelf = useResolver(MyServiceAbstract, 'onlySelf');
```

```typescript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  constructor(@Resolution('onlySelf') public strategy: SomeStrategyAbstract) {}
}
```

**Avoid** circular dependencies with `transient` and `skipSelf` as it will end up with **Maximum call stack size exceeded** Error. (Yet there is no self explaining error)

### Required

By default not provided dependencies will re resolved as `undefined`, but constructor arguments may be marked as required to _throw an error_ if dependency is not provided.

Ensure to provide all required dependencies to avoid runtime errors. By default, if a dependency is not provided, it will be resolved as `undefined`. However, you can mark constructor arguments as `@Required`, which will throw an error if a required dependency is not provided. This helps in early detection of missing dependencies during development.

```typescript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  constructor(@Required() public strategy: SomeStrategyAbstract) {}
}
```

### Simple Example

```jsx
// Preview.tsx
export function Preview() {
  return (
    <DependencyProvider
      provide={[
        /*  RandomNameService is a transient because we need to reassign its constructor parameter,
            but we won't provide it once more but memoize it for component*/
        provideClass(RandomNameService, 'transient'),
        provideClass(Formatter, FormatterUppercase),
        provideValue(NAME_URL, 'https://randomuser.me/api/'),
        /* NAME_GETTER could be value as well, just for the demo purposes lets make it singleton factory */
        provideFactory(
          NAME_GETTER,
          () => ({
            getName: (value: { first: string, last: string, title?: string }) =>
              [value.title, value.first, value.last].filter((x) => x).join(' '),
          }),
          'singleton'
        ),
      ]}
    >
      <SomeNameComponent />
    </DependencyProvider>
  );
}
```

```jsx
// SomeNameComponent.tsx
export function SomeNameContainer() {
  const [name, setName] = useState("");
  const test = useResolver(RandomNameService, [])!;

  useEffect(() => {
    test.getName().then((name) => setName(name));
  }, [test]);

  return (
    /*  We are reusing parent Resolver with its implementations, but we override Formatter.
        As Formatter is scoped and used as constructor argument we made service that use it - transient.
    */
    <DependencyProvider provide={[provideClass(Formatter, FormatterLowercase)]}>
      <b>{name}</b>
      <SomeOtherNameContainer />
    </DependencyProvider>
  );
}
```

```jsx
// SomeOtherNameComponent.tsx
export function SomeOtherNameComponent() {
  const [name, setName] = useState("");

  // we resolve new service (as it is transient) with new formatter
  const test = useResolver(RandomNameService, [])!;

  useEffect(() => {
    test.getName().then((name) => setName(name));
  }, [test]);

  return <i>{name}</i>;
}
```

```typescript
export const NAME_URL = new StaticKey()<string>('NAMES_URL');
export const NAME_GETTER = new StaticKey()<NameGetter>('NAME_GETTER');

export interface NameGetter {
  getName(value: unknown): string;
}
```

```typescript
@Injectable()
export class RandomNameService {
  constructor(
    protected formatter: Formatter,
    @Inject(NAME_GETTER) private nameGetter: NameGetter,
    @Inject(NAME_URL) private url: string
  ) {}

  async getName(): Promise<string> {
    const response = await fetch(this.url);
    const value = await response.json();
    const name = this.nameGetter.getName(value.results[0].name);

    return this.formatter.format(name);
  }
}
```

```typescript
export abstract class Formatter {
  abstract format(value: string): string;
}

@Injectable()
export class FormatterUppercase extends Formatter {
  format(value: string): string {
    return value.toUpperCase();
  }
}

@Injectable()
export class FormatterLowercase extends Formatter {
  format(value: string): string {
    return value.toLowerCase();
  }
}
```

### Factory Example

Based on [Simple Example](#simple-example) lets change some parts to let you use `DependencyProvider` without adding plugins or ejecting the app.

Remove decorators:

```typescript
export class RandomNameService {
  constructor(protected formatter: Formatter, private nameGetter: NameGetter, private url: string) {}
  // same getName() method
}
export class FormatterUppercase extends Formatter {
  /*original*/
}
export class FormatterLowercase extends Formatter {
  /*original*/
}
```

Now lets change only `DependencyProvider`s:

```jsx
// Preview.tsx
<DependencyProvider provide={[
  /* replace Class providers with Factory using resolve method */
  provideFactory(
    RandomNameService,
    /* resolve function will resolve dependency */
    (resolve) => new RandomNameService(resolve(Formatter)!, resolve(NAME_GETTER)!, resolve(NAME_URL)!),
    'transient'
   ),
  provideFactory(Formatter, () => new FormatterUppercase()),
    /* keep Value and Factory as they were*/
]}>
...
<DependencyProvider
```

```jsx
// SomeNameComponent.tsx
<DependencyProvider provide={[provideFactory(Formatter, () => new FormatterLowercase())]}>...</DependencyProvider>
```