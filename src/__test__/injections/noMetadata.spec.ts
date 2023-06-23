import { delayed } from '__test__/delayed';
import { StaticKey } from '_libs/injections/dist';
import { DependencyResolver, provideFactory } from 'injections';

describe('[DependencyResolver] NO metadata + Factory', () => {
  class Test3 {
    now: number;
    constructor(date: Date) {
      this.now = date.getTime();
    }
  }

  class Test2 {
    constructor(public test: Test3) {}
  }

  class Test1 {
    constructor(public test: Test2) {}
  }

  class Test {
    now: number;
    constructor(public test: Test1, date: Date) {
      this.now = date.getTime();
    }
  }

  class Test4 {
    now?: number;
    constructor(public test?: Test4, date?: Date) {
      this.now = date?.getTime();
    }
  }

  it('should create and resolve mappings with no metadata', () => {
    const resolver = new DependencyResolver([
      provideFactory(Test, (resolve) => new Test(resolve(Test1)!, new Date())),
      provideFactory(Test1, (resolve) => new Test1(resolve(Test2)!)),
      provideFactory(Test2, (resolve) => new Test2(resolve(Test3)!)),
      provideFactory(Test3, () => new Test3(new Date())),
    ]);

    const test = resolver.get(Test)!;

    expect(test.test.test.test).not.toBeUndefined();

    expect(test).toBeInstanceOf(Test);
    expect(test.test).toBeInstanceOf(Test1);
    expect(test.test.test).toBeInstanceOf(Test2);
    expect(test.test.test.test).toBeInstanceOf(Test3);
  });

  it('should call factory depending on lifetime', async () => {
    const transientKey = new StaticKey<Test3>('transient');
    const singletonKey = new StaticKey<Test3>('singleton');
    const loopedKey = new StaticKey<Test3>('looped');

    const resolver = new DependencyResolver([
      provideFactory(Test3, () => new Test3(new Date()), 'scoped'),
      provideFactory(transientKey, () => new Test3(new Date()), 'transient'),
      provideFactory(singletonKey, () => new Test3(new Date()), 'singleton'),
      provideFactory(loopedKey, () => new Test3(new Date()), 'looped'),
    ]);

    const scoped1 = resolver.get(Test3)!;
    expect(scoped1).toBeInstanceOf(Test3);
    const scoped2 = resolver.get(Test3)!;
    expect(scoped1 === scoped2).toBe(true);

    const transient1 = resolver.get(transientKey)!;
    expect(transient1).toBeInstanceOf(Test3);
    const transient2 = resolver.get(transientKey)!;
    expect(transient2).toBeInstanceOf(Test3);
    expect(transient1 === transient2).toBe(false);

    const singleton1 = resolver.get(singletonKey)!;
    expect(singleton1).toBeInstanceOf(Test3);
    const singleton2 = resolver.get(singletonKey)!;
    expect(singleton1 === singleton2).toBe(true);

    const looped1 = resolver.get(loopedKey)!;
    expect(looped1).toBeInstanceOf(Test3);
    const looped2 = resolver.get(loopedKey)!;
    expect(looped1 === looped2).toBe(true);

    await delayed(() => {
      const resolver2 = new DependencyResolver([], [], resolver);

      const scoped2 = resolver2.get(Test3)!;

      expect(scoped1 === scoped2).toBe(true);

      const transient2 = resolver.get(transientKey)!;
      expect(transient2).toBeInstanceOf(Test3);
      expect(transient1 === transient2).toBe(false);

      const singleton2 = resolver.get(singletonKey)!;
      expect(singleton1 === singleton2).toBe(true);

      const looped2 = resolver.get(loopedKey)!;
      expect(looped2).toBeInstanceOf(Test3);
      expect(looped1 === looped2).toBe(false);

      expect(scoped2 === singleton2).toBe(false);
      expect(scoped1 === singleton1).toBe(false);
      expect(looped1 === looped2).toBe(false);
    });
  });

  it('should call factory depending on resolution', async () => {
    const resolver = new DependencyResolver([
      provideFactory(Test4, (resolve) => new Test4(resolve(Test4, 'skipSelf'), new Date())),
    ]);

    const test = resolver.get(Test4)!;
    expect(test).toBeInstanceOf(Test4);
    expect(test.test).toBeUndefined();

    const resolver2 = new DependencyResolver(
      [provideFactory(Test4, (resolve) => new Test4(resolve(Test4, 'skipSelf'), new Date()))],
      [],
      resolver
    );

    const test2 = resolver2.get(Test4)!;
    expect(test2).toBeInstanceOf(Test4);
    expect(test2.test).toBeInstanceOf(Test4);
    expect(test2.test === test).toBe(true);
  });
});
