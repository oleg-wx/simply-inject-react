# Simply Inject for React

Simplest **dependency injection** for **React** using _Context_. Nothing fancy...  
_[Typescript support]_  
_[React 16.+]_

#### (v0.1.0.alpha)

### Install

```
npm i simply-translate-angular
```

### Requirements

As **React**, its _create-react-app_ and _react-scripts_ does not really support **Decorators** but this library _requires_ them, please consider to use some plugins for that purpose.  
Start with `babel-plugin-transform-typescript-metadata` it is the main one, it lets parse `@` for decorators. Set the `experimentalDecorators` and `emitDecoratorMetadata` to `true` in `tsconfig.json`.  
It is probably make sense to add `@babel/plugin-proposal-decorators` and `@babel/plugin-proposal-class-properties`... Moreover you would want to make **path aliases** to work as well, so you would have to adjust webpack _without_ **ejecting** the application.  
I personally prefer `react-app-rewired` with `customize-cra` but there are options...

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

### Basics

Wrap components with `DependencyProvider`, provide dependencies, resolve and use implementations

```jsx
// App.tsx
<DependencyProvider provide={[provideClass(MyServiceAbstract, MyServiceConcrete)]}>
  {/* Components that will use Provider */}
  <SomeComponent />
</DependencyProvider>
```

To resolve implementation there is `useResolver` hook. It already has memoization under the hood, so you need to pass dependencies array as last parameter

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

You can nest `DependencyProvider` inside `DependencyProvider` to override dependencies. Child provider has access to parent provided dependencies.

### Providers

You can provide **class**, **factory**. and **value**. You can specify `class` or `StaticKey` for implementation.

```typescript
provideClass(MyServiceAbstract, MyServiceConcrete);

provideFactory(MyServiceAbstract, ()=>new MyServiceConcrete());

const SERVICE = new StaticKey<IService>("SERVICE");
provideValue(SERVICE, { ... });
```

### Lifetime

There are 4 lifetimes: **scoped**, **looped**, **transient**, and **singleton**.  
**scoped** _(default)_ is one for your **provider**.  
**singleton** is one for the application and can be added only once in any `DependencyProvider`  
**transient** created when requested.  
**looped** is like transient but scoped for one event loop...

_Be careful_ to inject services with shorter life circle to ones that 'live' longer.

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

You might specify direct dependency with `@Inject`, without it injection should be provided automatically by _metadata_ so for interfaces and values it is mandatory to use `@Inject` with `StaticKey`.

```typescript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  constructor(@Inject(SomeStrategyAbstract) public strategy: SomeStrategyAbstract) {}
}
```

### Resolutions

**skipSelf** Will skip closest `DependencyProvider` except the root one (most upper level).  
**onlySelf** Will take dependency from closest `DependencyProvider`.
**default** Will look for dependency in every `DependencyProvider` in upward hierarchy.

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

### Required

By default not provided dependencies will re resolved as `undefined`, but constructor arguments may be marked as required to _throw an error_ if dependency is not provided.

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
      <hr />
      <SomeOtherNameContainer />
    </DependencyProvider>
  );
}
```

```jsx
// SomeOtherNameComponent.tsx
export function SomeOtherNameComponent() {
  const [name, setName] = useState("");

  // we resolve new service with new formatter
  // so there is 2 RandomNameService services
  const test = useResolver(RandomNameService, [])!;

  useEffect(() => {
    test.getName().then((name) => setName(name));
  }, [test]);

  return <i>{name}</i>;
}
```

```typescript
export const NAME_URL = new StaticKey() < string > 'NAMES_URL';
export const NAME_GETTER = new StaticKey() < NameGetter > 'NAME_GETTER';

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
