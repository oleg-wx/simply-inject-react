import {
  DependencyResolver,
  Injectable,
  StaticKey,
  provideClass,
  provideFactory,
  provideValue,
} from 'injections/di/utils';
import {
  InjectKey,
  TestAbstract,
  TestConcrete1,
  TestConcrete2,
  TestExtendInject,
  TestExtendInjectInner,
  TestFactoryInject,
  TestFactoryInject2,
  TestInjectAbstract,
  TestInjectValue,
  TestParent,
} from './testClassesInject';
import { delayed } from './delayed';

describe('[DependencyResolver] simple tests', () => {
  interface Test {
    name: string;
  }

  abstract class TestAbstract implements Test {
    name = 'TestAbstract';
  }

  @Injectable()
  class TestExtend extends TestAbstract {
    name = 'TestExtend';
  }

  @Injectable()
  class TestExtend2 extends TestAbstract {
    name = 'TestExtend2';
  }

  it('should resolve with constructor', () => {
    const resolver = new DependencyResolver([{ provide: TestAbstract, use: TestExtend }]);
    const resolved = resolver.get(TestAbstract);
    expect(resolved?.name).toBe('TestExtend');
    expect(resolved).toBeInstanceOf(TestExtend);
  });

  it('should resolve with factory', () => {
    const resolver = new DependencyResolver([{ provide: TestAbstract, useFactory: () => new TestExtend() }]);
    expect(resolver.get(TestAbstract)).toBeInstanceOf(TestExtend);
  });

  it('should resolve with value', () => {
    const resolver = new DependencyResolver([{ provide: TestAbstract, useValue: new TestExtend() }]);
    expect(resolver.get(TestAbstract)).toBeInstanceOf(TestExtend);
  });

  it('should resolve with default', () => {
    const resolver = new DependencyResolver([{ provide: TestExtend }]);
    expect(resolver.get(TestExtend)).toBeInstanceOf(TestExtend);
  });

  it('should resolve lastly added', () => {
    const resolver = new DependencyResolver([
      { provide: TestAbstract, use: TestExtend },
      { provide: TestAbstract, use: TestExtend2 },
    ]);
    expect(resolver.get(TestAbstract)).toBeInstanceOf(TestExtend2);
  });

  it('should create abstract class cause it is typescript', () => {
    const resolver = new DependencyResolver([{ provide: TestAbstract }]);
    expect(resolver.get(TestAbstract)).toBeInstanceOf(TestAbstract);
  });

  it('should return undefined for not provided', () => {
    const resolver = new DependencyResolver([{ provide: TestAbstract, use: TestExtend }]);
    expect(resolver.get(TestExtend)).toBeUndefined();
  });

  it('should resolve by static key', () => {
    const key = new StaticKey<TestExtend>('inject');
    const resolver = new DependencyResolver([{ provide: key, useFactory: () => new TestExtend() }]);
    expect(resolver.get(key)).toBeInstanceOf(TestExtend);
  });

  it('should resolve by static and interface', () => {
    const key = new StaticKey<Test>('inject');
    const resolver = new DependencyResolver([{ provide: key, use: TestExtend }]);
    const resolved = resolver.get(key);
    expect(resolved).toBeInstanceOf(TestExtend);
  });

  it('should resolve by string key', () => {
    const resolver = new DependencyResolver([{ provide: 'inject', useFactory: () => new TestExtend() }]);
    expect(resolver.get('inject')).toBeInstanceOf(TestExtend);
  });

  it('should resolve class and return undefined for not provided', () => {
    const resolver = new DependencyResolver([{ provide: TestExtend2, use: TestExtend }]);
    expect(resolver.get(TestExtend2)).toBeInstanceOf(TestExtend);
    expect(resolver.get(TestExtend)).toBeUndefined();
  });
});

describe('[DependencyResolver] tests and provide functions', () => {
  it('should resolve with constructor args', () => {
    const resolver = new DependencyResolver([
      provideClass(TestInjectAbstract, TestExtendInject),
      provideClass(TestExtendInjectInner),
    ]);
    const resolved = resolver.get(TestInjectAbstract);
    expect(resolved).toBeInstanceOf(TestExtendInject);
    expect((resolved as TestExtendInject).extend).toBeInstanceOf(TestExtendInjectInner);
  });

  it('should resolve with value', () => {
    const resolver = new DependencyResolver([
      provideClass(TestInjectValue),
      provideValue(InjectKey, { value: 'test value' }),
    ]);
    const resolved = resolver.get(TestInjectValue);
    expect(resolved).toBeInstanceOf(TestInjectValue);
    expect(resolved?.value.value).toBe('test value');
  });

  it('should resolve with factory', () => {
    const resolver = new DependencyResolver([
      provideFactory(TestFactoryInject, () => new TestFactoryInject('one', 2)),
      provideFactory(
        TestFactoryInject2,
        (resolve) => new TestFactoryInject2('one', 2, resolve(TestExtendInjectInner)!)
      ),
      provideClass(TestExtendInjectInner),
    ]);
    const resolved1 = resolver.get(TestFactoryInject);
    expect(resolved1).toBeInstanceOf(TestFactoryInject);
    expect(resolved1?.one).toBe('one');
    expect(resolved1?.two).toBe(2);
    const resolved2 = resolver.get(TestFactoryInject2);
    expect(resolved2).toBeInstanceOf(TestFactoryInject2);
    expect(resolved2?.extend).toBeInstanceOf(TestExtendInjectInner);
    expect(resolved2?.extend.name).toBe('TestExtendInner');
  });
});

describe('[DependencyResolver] Lifetimes', () => {
  it('should set lifetime to scoped by default', async () => {
    const resolver = new DependencyResolver([
      provideClass(TestExtendInject, TestExtendInject),
      { provide: TestExtendInjectInner, use: TestExtendInjectInner },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((resolver as any)._getCreator(TestExtendInject).lifetime).toBe('scoped');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((resolver as any)._getCreator(TestExtendInjectInner).lifetime).toBe('scoped');
  });

  it('should set lifetime to scoped for values', async () => {
    const resolver = new DependencyResolver([
      provideValue(TestExtendInject, new TestExtendInject(new TestExtendInjectInner())),
      { provide: TestExtendInjectInner, useValue: new TestExtendInjectInner() },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((resolver as any)._getCreator(TestExtendInject).lifetime).toBe('scoped');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((resolver as any)._getCreator(TestExtendInjectInner).lifetime).toBe('scoped');
  });

  it('should resolve transient', () => {
    const resolver = new DependencyResolver([
      provideClass(TestExtendInject, TestExtendInject, 'transient'),
      { provide: TestExtendInjectInner, use: TestExtendInjectInner, lifetime: 'transient' },
    ]);

    let resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('TestExtendInner');
    resolved1!.extend.name = 'changed';

    const resolved2 = resolver.get(TestExtendInjectInner);
    expect(resolved2?.name).toBe('TestExtendInner');
    resolved2!.name = 'changed 2';

    resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('TestExtendInner');
  });

  it('should resolve loop', async () => {
    const resolver = new DependencyResolver([
      provideClass(TestExtendInject, TestExtendInject, 'looped'),
      { provide: TestExtendInjectInner, use: TestExtendInjectInner, lifetime: 'looped' },
    ]);

    let resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('TestExtendInner');
    resolved1!.extend.name = 'changed';

    const resolved2 = resolver.get(TestExtendInjectInner);
    expect(resolved2?.name).toBe('changed');
    resolved2!.name = 'changed 2';

    resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('changed 2');

    await delayed(() => {
      const resolved1 = resolver.get(TestExtendInject);
      expect(resolved1!.extend.name).toBe('TestExtendInner');
    });
  });

  it('should resolve scoped', async () => {
    const key3 = new StaticKey<TestExtendInject>('Inject3');
    const resolver = new DependencyResolver([
      provideClass(TestExtendInject, TestExtendInject, 'scoped'),
      { provide: TestExtendInjectInner, use: TestExtendInjectInner, lifetime: 'scoped' },
      provideClass(key3, TestExtendInject, 'scoped'),
    ]);

    let resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('TestExtendInner');
    resolved1!.extend.name = 'changed';

    const resolved2 = resolver.get(TestExtendInjectInner);
    expect(resolved2?.name).toBe('changed');
    resolved2!.name = 'changed 2';

    resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('changed 2');

    const resolved3 = resolver.get(key3)!;
    resolved3.name = 'changed 3';

    await delayed(() => {
      const resolved1 = resolver.get(TestExtendInject);
      expect(resolved1!.extend.name).toBe('changed 2');

      const resolver2 = new DependencyResolver([provideClass(key3, TestExtendInject, 'scoped')], [], resolver);
      const resolved3_2 = resolver2.get(key3)!;
      const resolved3_1 = resolver.get(key3)!;

      expect(resolved3_1.name).toBe(resolved3.name);
      expect(resolved3_1).toBe(resolved3);

      expect(resolved3_2.name).not.toBe(resolved3.name);
      expect(resolved3_2).not.toBe(resolved3);
    });
  });

  it('should resolve singleton', async () => {
    const resolver = new DependencyResolver([
      provideClass(TestExtendInject, TestExtendInject, 'singleton'),
      { provide: TestExtendInjectInner, use: TestExtendInjectInner, lifetime: 'singleton' },
    ]);

    let resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('TestExtendInner');
    resolved1!.extend.name = 'changed';

    const resolved2 = resolver.get(TestExtendInjectInner);
    expect(resolved2?.name).toBe('changed');
    resolved2!.name = 'changed 2';

    resolved1 = resolver.get(TestExtendInject);
    expect(resolved1?.extend.name).toBe('changed 2');

    await delayed(() => {
      const resolver2 = new DependencyResolver([], [], resolver);

      const resolved1 = resolver2.get(TestExtendInject);
      expect(resolved1!.extend.name).toBe('changed 2');
      const resolved2 = resolver.get(TestExtendInjectInner);
      expect(resolved2?.name).toBe('changed 2');
    });
  });

  it('should resolve singleton', async () => {
    const resolver = new DependencyResolver([provideClass(TestExtendInject, TestExtendInject, 'singleton')]);

    await delayed(() => {
      const resolver2 = () =>
        new DependencyResolver(
          [{ provide: TestExtendInject, use: TestExtendInject, lifetime: 'singleton' }],
          [],
          resolver
        );

      expect(resolver2).toThrow(/Singleton/);
    });
  });
});

describe('[DependencyResolver] Parent resolver', () => {
  fit('should resolve overridden items from parent', async () => {
    const resolver1 = new DependencyResolver([
      provideClass(TestAbstract, TestConcrete1),
      provideClass(TestParent, 'transient'),
    ]);

    let test1 = resolver1.get(TestParent)!;
    expect(test1.test.value).toBe(1);

    const resolver2 = new DependencyResolver([provideClass(TestAbstract, TestConcrete2)], [], resolver1);

    test1 = resolver1.get(TestParent)!;
    const test2 = resolver2.get(TestParent)!;

    expect(test1.test.value).toBe(1);
    expect(test2.test.value).toBe(2);
  });
});
