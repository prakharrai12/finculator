// Type declarations for React, JSX, and styling utilities

declare module "react" {
  export function useId(): string;
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export type ReactNode = any;
  export type ReactElement = any;
  export type FC<P = {}> = (props: P) => any;
  export type SVGProps<T> = any;
  export type HTMLAttributes<T> = any;
  export type ComponentPropsWithoutRef<T> = any;
  
  const React: {
    useId: () => string;
    createElement: (...args: any[]) => any;
    Fragment: any;
    [key: string]: any;
  };
  export default React;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface Element {
    [key: string]: any;
  }
  interface ElementClass {
    render(): any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "clsx" {
  export type ClassValue = any;
  export function clsx(...inputs: any[]): string;
  export default clsx;
}

declare module "tailwind-merge" {
  export function twMerge(...classLists: any[]): string;
}
