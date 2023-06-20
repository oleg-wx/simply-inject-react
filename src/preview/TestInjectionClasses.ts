import { Inject, Injectable, StaticKey } from '../_libs/injections/src/index';

export const provideKey = new StaticKey<{ test: string }>('inject');

export class TestInner {
  value = 'TestInner';
}

export abstract class TestInjectionBase {
  date = new Date().toUTCString();
  constructor(public inner?: TestInner) {}
}

@Injectable()
export class TestInjection extends TestInjectionBase {
  value = 'TestInjection';
  constructor(@Inject(TestInner) inner: TestInner) {
    super(inner);
  }
}

@Injectable()
export class TestInjection2 extends TestInjectionBase {
  value = 'TestInjection';
  constructor() {
    super();
  }
}

export class TestInjectionValue {
  constructor(@Inject(provideKey) public value: { test: string }) {}
}
