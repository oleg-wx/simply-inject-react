import { ProviderKey } from './types';

export function throwMetadataError() {
  throw new Error(
    `SDI01.0: To use Decorators make sure application can handle Decorators and Metadata. Enable "experimentalDecorators" and "emitDecoratorMetadata", import "reflect-metadata" in root file of application.`
  );
}

export function throwRequiredError(key: ProviderKey, chain: Set<ProviderKey>) {
  throw new Error(`SDI01.3: Argument ${String(key.name ?? key)} is Required. ${chainToString(chain)}`);
}

export function throwCircleDependencyError(chain: Set<ProviderKey>) {
  throw new Error(`SDI02.1: Cycle Dependency ${chainToString(chain)}`);
}

function chainToString(chain: Set<ProviderKey>) {
  return Array.from(chain)
    .map((k) => String(k.name ?? k))
    .join(' <- ');
}
