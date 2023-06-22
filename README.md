# Simply Inject for React

Simplest **dependency injection** for **React** using _Context_. Nothing fancy...  
_[Typescript support]_  
_[React 16.+]_

#### (v0.1.0.alpha)

### Install

```javascript
npm i simply-translate-angular
```

### Requirements

As **React** and its _create-react-app_ and _react-scripts_ not really support **Decorators** and this library requires them, please consider to use plugins for that purpose.  
`babel-plugin-transform-typescript-metadata` is the main one, it lets read `@` for decorator. Set the `experimentalDecorators` and `emitDecoratorMetadata` to `true` in `tsconfig.json`.  
It is probably make sense to add `@babel/plugin-proposal-decorators` and `@babel/plugin-proposal-class-properties`... Moreover you would want to make **path aliases** to work as well, so you have to adjust webpack _without_ **ejecting** the app.  
I prefer `react-app-rewired` with `customize-cra` but there are options...

```javascript
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

```javascript
// App.tsx
<DependencyProvider provide={[provideClass(MyServiceAbstract, MyServiceConcrete)]}>
  {/* Components that will use Provider */}
  <SomeComponent />
</DependencyProvider>
```

To resolve implementation there is `useResolver` hook. It already has memoization under the hood, so you need to pass dependencies array as last parameter

```javascript
// SomeComponent.tsx
const myService = useResolver(MyServiceAbstract);
return <>{myService.value}</>;
```

```javascript
// MyService.ts
export abstract class MyServiceAbstract {
  value?:string;
}

@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
  value = 'Hello Service';
}
```

You can nest `DependencyProvider` inside `DependencyProvider` to override dependencies. Child provider has access to parent provided dependencies.

### Providers

You can provide **class**, **factory**. and **value**. You can specify `class` or `StaticKey` for implementation.

```javascript
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

```javascript
provideClass(MyServiceAbstract, MyServiceConcrete, 'transient');
```

### Injections

```javascript
// MyService.ts
export abstract class  SomeStrategyAbstract{}

@Injectable()
export class SomeStrategyConcrete{}

export abstract class  MyServiceAbstract {}

@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
    constructor(public strategy:SomeStrategyAbstract){}
}
```

You might specify direct dependency with `@Inject`, without it injection should be provided automatically by _metadata_ so for interfaces and values it is mandatory to use `@Inject` with `StaticKey`.

```javascript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
    constructor(@Inject(SomeStrategyAbstract) public strategy:SomeStrategyAbstract){}
}
```

### Resolutions

**skipSelf** Will skip closest `DependencyProvider` except the root one (most upper level).  
**onlySelf** Will take dependency from closest `DependencyProvider`.
**default** Will look for dependency in every `DependencyProvider` in upward hierarchy.   

```javascript
const skipSelf = useResolver(MyServiceAbstract, 'skipSelf');
const onlySelf = useResolver(MyServiceAbstract, 'onlySelf');
```

```javascript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
    constructor(@Resolution('onlySelf') public strategy:SomeStrategyAbstract){}
}
```

### Required
By default not provided dependencies will re resolved as `undefined`, but constructor arguments may be marked as required to _throw an error_ if dependency is not provided. 
```javascript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
    constructor(@Required() public strategy:SomeStrategyAbstract){}
}
```
### Simple Example

```javascript
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

```javascript
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

```javascript
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

```javascript
export const NAME_URL = new StaticKey() < string > 'NAMES_URL';
export const NAME_GETTER = new StaticKey() < NameGetter > 'NAME_GETTER';

export interface NameGetter {
  getName(value: unknown): string;
}
```

```javascript
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

```javascript
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
