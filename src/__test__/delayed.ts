
export function delayed<T = void>(func: () => T, delay = 32) {
  return new Promise<T>((res) => {
    setTimeout(() => {
      res(func());
    }, delay);
  });
}
