/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, createElement } from "react";
import { ComponentProviderKey } from "./types";
import { useResolveContext } from "./DependencyProvider";

export default function Resolve<T = any>(
  props: {
    provide: ComponentProviderKey<T>;
    children?: ReactNode;
  } & T
) {
  const { provide, children, ...provideProps } = props;
  const provided = useResolveContext()?.getComponent<T>(provide);

  return createElement(provided as any, provideProps as any, children);
}
