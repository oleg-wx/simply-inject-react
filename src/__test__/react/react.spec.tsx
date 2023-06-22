import { render, screen } from '@testing-library/react';
import { TestAbstract, TestConcrete1, TestParentOnlySelf } from '__test__/testClassesInject';
import { DependencyProvider, Resolve, provideClass, useResolver } from 'injections';
import { provideComponent } from 'injections/di/utils/types';
import { ReactNode } from 'react';

describe('[DependencyProvider] Resolutions', () => {
  it('should use only self with @Inject', () => {
    render(
      <>
        <Test />
      </>
    );

    const element1 = screen.getByTestId('test1');
    expect(element1).toHaveTextContent('1');

    const element2 = screen.getByTestId('test2');
    expect(element2).toHaveTextContent('0');

    function TestIn(props: { n: number }) {
      const test = useResolver(TestParentOnlySelf);

      return <div data-testid={`test${props.n}`}>{test?.test?.value ?? 0}</div>;
    }

    function Test() {
      return (
        <DependencyProvider provide={[provideClass(TestAbstract, TestConcrete1), provideClass(TestParentOnlySelf)]}>
          <TestIn n={1} />
          <DependencyProvider provide={[provideClass(TestParentOnlySelf)]}>
            <TestIn n={2} />
          </DependencyProvider>
        </DependencyProvider>
      );
    }
  });

  it('should use only self', () => {
    render(
      <>
        <Test />
      </>
    );

    const element1 = screen.getByTestId('test1');
    expect(element1).toHaveTextContent('1');

    const element2 = screen.getByTestId('test2');
    expect(element2).toHaveTextContent('0');

    function TestIn(props: { n: number }) {
      const test = useResolver(TestAbstract, 'onlySelf');

      return <div data-testid={`test${props.n}`}>{test?.value ?? 0}</div>;
    }

    function Test() {
      return (
        <DependencyProvider provide={[provideClass(TestAbstract, TestConcrete1)]}>
          <TestIn n={1} />
          <DependencyProvider provide={[]}>
            <TestIn n={2} />
          </DependencyProvider>
        </DependencyProvider>
      );
    }
  });
});

describe('[DependencyProvider] Components', () => {
  it('should inject component', () => {
    render(
      <>
        <Test />
      </>
    );

    const element = screen.getByTestId('test');
    const child = screen.getByTestId('child');
    expect(element).toHaveTextContent('15');
    expect(child).toHaveTextContent('child');

    function Test() {
      return (
        <DependencyProvider provide={[]} components={[provideComponent(Test0, Test10)]}>
          <Resolve provide={Test0} add={5}>
            <div data-testid="child">child</div>
          </Resolve>
        </DependencyProvider>
      );
    }
  });

  it('should inject component from parent', () => {
    render(
      <>
        <Test />
      </>
    );

    const element = screen.getByTestId('test');
    const child = screen.getByTestId('child');
    expect(element).toHaveTextContent('5');
    expect(child).toHaveTextContent('child');

    function Test() {
      return (
        <DependencyProvider provide={[]} components={[provideComponent(Test0)]}>
          <DependencyProvider provide={[]}>
            <Resolve provide={Test0} add={5}>
              <div data-testid="child">child</div>
            </Resolve>
          </DependencyProvider>
        </DependencyProvider>
      );
    }
  });

  function Test0(props: { add: number; children: ReactNode }) {
    return (
      <>
        <div data-testid="test">{props.add}</div>
        {props.children}
      </>
    );
  }

  function Test10(props: { add: number; children: ReactNode }) {
    return (
      <>
        <div data-testid="test">{10 + props.add}</div>
        {props.children}
      </>
    );
  }
});
