/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import 'reflect-metadata';

export function isMetadataEnabled(target: any): boolean {
  const reflect = (Reflect as any)
  
  return !!reflect['metadata'] || !!reflect['Metadata'];
}

export function getMetadata<T = any>(key: any, target: any): T | undefined {
  return target ? metadata('getMetadata')(key, target) : undefined;
}

export function defineMetadata<T = any>(key: any, value: any, target: any): T | undefined {
  return target ? metadata('defineMetadata')(key, value, target) : undefined;
}

function metadata(func: string): Function {
  const md = (Reflect as any)[func];

  return md ? md : () => undefined;
}
