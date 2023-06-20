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

module.exports = override(
  addWebpackAlias({
    ['/']: path.resolve(__dirname, 'src/'),
    ['injections']: path.resolve(__dirname, 'src/_libs/injections/src/'),
  }),
  useBabelRc()
);
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
To resolve implementation there is `useResolver` hook
```javascript
// SomeComponent.tsx
const myService = useResolver(MyServiceAbstract);
return <>{myService.value}</>;
```

```javascript
// MyService.ts
export abstract class MyServiceAbstract {}

@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {}
```

You can nest `DependencyProvider` inside `DependencyProvider` to override dependencies. Child provider has access to parent provided dependencies.

### Providers

You can provide __class__, __factory__. and __value__. You can specify `class` or `StaticKey` for implementation.
```javascript
provideClass(MyServiceAbstract, MyServiceConcrete);

provideFactory(MyServiceAbstract, ()=>new MyServiceConcrete());

const SERVICE = new StaticKey<IService>("SERVICE");
provideValue(SERVICE, { ... });
```

### Lifetime

There are 4 lifetimes: **scoped**, **loop**, **transient**, and **singleton**.  
**scoped** _(default)_ is one for your **provider**.  
**singleton** is one for the web site.  
**transient** created when requested.  
**loop** is like transient but for one event loop.

_Be careful_ to inject services with shorter life circle to ones that live longer.

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
You might specify direct dependency with `@Inject`.
```javascript
@Injectable()
export class MyServiceConcrete extends MyServiceAbstract {
    constructor(@Inject(SomeStrategyAbstract) public strategy:SomeStrategyAbstract){}
}
```

### Example

Coming soon...
