export default function throwMetadataError () {
  throw new Error(
    `Make sure "experimentalDecorators" and "emitDecoratorMetadata" are enabled`
  );
}
