import { ProviderKey } from './types';

export function throwMetadataError() {
  throw new Error(`Make sure "experimentalDecorators" and "emitDecoratorMetadata" are enabled`);
}

export function throwRequiredError(key: ProviderKey, chain: Set<ProviderKey>) {
  throw new Error(
    `Argument ${String(key.name ?? key)} is Required. ${Array.from(chain)
      .map((k) => String(k.name ?? k))
      .join(' <- ')}`
  );
}
