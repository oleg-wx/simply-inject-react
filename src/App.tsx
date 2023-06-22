import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Preview } from './preview/Preview';
import { TestAbstract, TestConcrete1, TestParent, TestConcrete2 } from '__test__/injections/testClassesInject';
import { provideClass } from 'injections';
import { DependencyResolver } from 'injections/di/utils';

export default function App() {
  return (
    <div className="App">
      <span>test</span>
      <br />
      <Preview />
    </div>
  );
}