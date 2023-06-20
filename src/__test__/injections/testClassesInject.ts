import { Inject, Injectable, StaticKey } from 'injections/di/utils';

export interface InjectValue {
  value: string;
}

export const InjectKey = new StaticKey<InjectValue>('inject');

export interface Test {
  name: string;
}

export abstract class TestInjectAbstract implements Test {
  name = 'TestAbstract';
}

@Injectable()
export class TestExtendInjectInner extends TestInjectAbstract {
  name = 'TestExtendInner';
}

@Injectable()
export class TestExtendInject extends TestInjectAbstract {
  name = 'TestExtend';

  constructor(@Inject(TestExtendInjectInner) public extend: TestExtendInjectInner) {
    super();
  }
}

export class TestFactoryInject {
  constructor(public one: string, public two: number) {}
}

export class TestFactoryInject2 {
  constructor(
    public one: string,
    public two: number,
    @Inject(TestExtendInjectInner) public extend: TestExtendInjectInner
  ) {}
}

@Injectable()
export class TestInjectValue {
  constructor(@Inject(InjectKey) public value: InjectValue) {}
}

@Injectable()
export class TestExtendInjectNext extends TestInjectAbstract {
  name = 'TestExtendNext';

  constructor(@Inject(TestExtendInject) public extend: TestExtendInject, @Inject(InjectKey) public value: InjectValue) {
    super();
  }
}

@Injectable()
export class TestInjectAll {
  constructor(
    @Inject(TestExtendInject) public extend: TestExtendInject,
    @Inject(InjectKey) public value: InjectValue,
    @Inject(TestFactoryInject) public factory: TestFactoryInject
  ) {}
}
