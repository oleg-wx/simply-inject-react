import React from 'react';
import './App.css';
import { Preview } from './preview/Preview';
import { TestAbstract, TestConcrete1, TestParent, TestConcrete2 } from '__test__/testClassesInject';
import { DependencyResolver, provideClass } from 'injections';
import { Injectable, Required } from 'injections/di/utils/ObjectCreator';

export default function App() {
  @Injectable()
  class Test3 {}
  @Injectable()
  class Test2 {
    constructor(@Required() public test: Test3) {}
  }
  @Injectable()
  class Test1 {
    constructor(@Required() public test: Test2) {}
  }
  @Injectable()
  class Test {
    constructor(@Required() public test: Test1) {}
  }

  const resolver1 = new DependencyResolver([provideClass(Test), provideClass(Test1), provideClass(Test2)]);

  //const test = resolver1.get(Test);

  return (
    <div className="App">
      <span>test</span>
      <br />
      <Preview />
    </div>
  );
}
