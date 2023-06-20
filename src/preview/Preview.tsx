import { DependencyProvider, provideClass, provideValue, useResolver } from 'injections';
import { TestInjectionBase, TestInjection, TestInner, TestInjectionValue, provideKey, TestInjection2 } from './TestInjectionClasses';
import { ReactNode, useState } from 'react';

export function Preview() {
  return (
    <DependencyProvider
      provide={[
        { provide: TestInjectionBase, use: TestInjection, lifetime: 'transient' },
        { provide: TestInjectionValue },
        provideClass(TestInner),
        provideClass(TestInjection2),
        provideValue(provideKey, { test: 'static test' }),
      ]}
    >
      <TestContext />
      <ChangeContext />
      <TestContext2 />

      <hr />

      <ChangeContext />

      <InnerProvider>
        <TestContext />
        <TestContext2 />
      </InnerProvider>
    </DependencyProvider>
  );
}

function ChangeContext() {
  const resolved = useResolver(TestInjectionBase, [])!;
  resolved.inner!.value += ' changed';
  (resolved as TestInjection).value += ' changed';

  return <></>;
}

export function TestContext() {
  const resolved = useResolver(TestInjectionBase, [])!;
  const value = useResolver(provideKey, [])!;
  const innerValue = useResolver(TestInjectionValue, [])!;
  const resolved2 = useResolver(TestInjection2, [])!;

  return (
    <>
      <h1>TestContext1</h1>
      <h3>{resolved.inner!.value}</h3>
      <h4>{(resolved as TestInjection).value}</h4>
      <b>{value.test}</b>
      <br />
      <b>{innerValue.value.test}</b>
      <br />
      <h2>{resolved.date} | {resolved2.date}</h2>
    </>
  );
}

export function TestContext2() {
  const resolved = useResolver(TestInjectionBase)!;
  const resolved2 = useResolver(TestInjection2, [])!;

  return (
    <>
      <h1>TestContext2</h1>
      <h3>{resolved.inner!.value}</h3>
      <h4>{(resolved as TestInjection).value}</h4>
      <h2>{resolved.date} | {resolved2.date}</h2>
    </>
  );
}

export function InnerProvider(props: { children?: ReactNode }) {
  const [state, setState] = useState(false);

  return (
    <>
      {state ? (
        <DependencyProvider
          provide={[
            { provide: TestInjectionValue },
            provideClass(TestInner),
            provideValue(provideKey, { test: 'static test' }),
          ]}
        >
          {props.children}
        </DependencyProvider>
      ) : null}
      <button onClick={() => setState(!state)}>toggle inner</button>
    </>
  );
}
