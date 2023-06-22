import { DependencyProvider, provideClass, provideFactory, provideValue, useResolver } from 'injections';
import { ReactNode, useEffect, useState } from 'react';
import { RandomNameService, Formatter, FormatterUppercase, NAME_URL, NAME_GETTER, FormatterLowercase } from './test';

export function Preview() {
  return (
    <DependencyProvider
        provide={[
          /* RandomNameService is a transient because we need to reassign its constructor parameter,
             but we won't provide it once more but memoize it for component*/
          provideClass(RandomNameService, "transient"),
          provideClass(Formatter, FormatterUppercase),
          provideValue(NAME_URL, "https://randomuser.me/api/"),
          /* NAME_GETTER could be value as well, just for the demo purposes lets make it singleton factory */
          provideFactory(NAME_GETTER, () => ({
            getName: (value: { first: string; last: string; title?: string }) =>
              [value.title, value.first, value.last].filter((x) => x).join(" "),
          }),'singleton'),
        ]}
      >
        <SomeNameComponent />
      </DependencyProvider>
  );
}

export function SomeNameComponent() {
  const [name, setName] = useState("");
  const test = useResolver(RandomNameService, [])!;

  useEffect(() => {
    test.getName().then((name) => setName(name));
  }, [test]);

  return (
    /* We are reusing parent Resolver with its implementations, but we override Formatter.
       As Formatter is scoped and used as constructor argument we made service that use it - transient*/
    <DependencyProvider provide={[provideClass(Formatter, FormatterLowercase)]}>
      <b>{name}</b>
      <hr />
      <SomeOtherNameComponent />
    </DependencyProvider>
  );
}

export function SomeOtherNameComponent() {
  const [name, setName] = useState("");
  const test = useResolver(RandomNameService, [])!;

  useEffect(() => {
    test.getName().then((name) => setName(name));
  }, [test]);

  return <i>{name}</i>;
}